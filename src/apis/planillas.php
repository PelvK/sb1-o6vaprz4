<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once 'conexion.php';
require_once 'audit_helper.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = getAuthUserId();

switch ($method) {
    case 'GET':
        handleGet($conn);
        break;
    case 'POST':
        handlePost($conn, $userId);
        break;
    case 'PUT':
        handlePut($conn, $userId);
        break;
    case 'DELETE':
        handleDelete($conn, $userId);
        break;
    default:
        sendError("Method not allowed", 405);
}

function handleGet($conn)
{
    $id = $_GET['id'] ?? null;

    if ($id) {
        $stmt = $conn->prepare("
            SELECT p.id, p.team_id, p.status, p.created_at, p.updated_at,
                   t.nombre AS team_nombre, t.category AS team_category, t.created_at AS team_created_at
            FROM planillas p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $planilla = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$planilla) {
            sendError("Planilla not found", 404);
        }

        $jugStmt = $conn->prepare("
            SELECT id, planilla_id, dni, number, name, second_name, created_at
            FROM jugadores WHERE planilla_id = :planilla_id
        ");
        $jugStmt->execute(['planilla_id' => $id]);
        $jugadores = $jugStmt->fetchAll(PDO::FETCH_ASSOC);

        $persStmt = $conn->prepare("
            SELECT id, planilla_id, dni, name, second_name, phone_number, charge, created_at
            FROM personas WHERE planilla_id = :planilla_id
        ");
        $persStmt->execute(['planilla_id' => $id]);
        $personas = $persStmt->fetchAll(PDO::FETCH_ASSOC);

        $usersStmt = $conn->prepare("
            SELECT up.id AS user_planilla_id, p.id, p.username, p.is_admin, p.created_at
            FROM user_planilla up
            JOIN profiles p ON up.user_id = p.id
            WHERE up.planilla_id = :planilla_id
        ");
        $usersStmt->execute(['planilla_id' => $id]);
        $assigned_users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

        $team = [
            'id' => $planilla['team_id'],
            'nombre' => $planilla['team_nombre'],
            'category' => intval($planilla['team_category']),
            'created_at' => $planilla['team_created_at'],
        ];

        $result = [
            'id' => $planilla['id'],
            'team_id' => $planilla['team_id'],
            'status' => $planilla['status'],
            'created_at' => $planilla['created_at'],
            'updated_at' => $planilla['updated_at'],
            'team' => $team,
            'jugadores' => $jugadores,
            'personas' => $personas,
            'assigned_users' => $assigned_users
        ];

        sendResponse($result);
    } else {
        $stmt = $conn->query("
            SELECT p.id, p.team_id, p.status, p.created_at, p.updated_at,
                   t.nombre AS team_nombre, t.category AS team_category
            FROM planillas p
            LEFT JOIN teams t ON p.team_id = t.id
            ORDER BY p.created_at DESC
        ");

        $planillas = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $planillas[] = [
                'id' => intval($row['id']),
                'team_id' => $row['team_id'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'team' => [
                    'id' => $row['team_id'],
                    'nombre' => $row['team_nombre'],
                    'category' => intval($row['team_category'])
                ]
            ];
        }
        sendResponse($planillas);
    }
}

function handlePost($conn, $userId)
{
    $data = json_decode(file_get_contents('php://input'), true);

    $stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userProfile || !$userProfile['is_admin']) {
        sendError("Unauthorized", 403);
    }

    $isBulk = isset($_GET['bulk']) && $_GET['bulk'] === 'true';

    if ($isBulk) {
        handleBulkCreate($conn, $data, $userId);
        return;
    }

    if (!$data || empty($data['team_id'])) {
        sendError("Field 'team_id' is required", 400);
    }
    if (!isset($data['user_ids']) || !is_array($data['user_ids']) || count($data['user_ids']) === 0) {
        sendError("Field 'user_ids' must be a non-empty array", 400);
    }

    $status = $data['status'] ?? 'Pendiente de envío';
    $userIds = array_values(array_unique($data['user_ids']));

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("
            INSERT INTO planillas (team_id, status, created_at, updated_at)
            VALUES (:team_id, :status, NOW(), NOW())
        ");
        $stmt->execute([
            'team_id' => $data['team_id'],
            'status' => $status
        ]);

        $planillaId = $conn->lastInsertId();

        $assignStmt = $conn->prepare("
            INSERT INTO user_planilla (user_id, planilla_id, created_at)
            VALUES (:user_id, :planilla_id, NOW())
        ");
        foreach ($userIds as $uid) {
            $assignStmt->execute([
                'user_id' => $uid,
                'planilla_id' => $planillaId
            ]);
        }

        logAudit(
            $conn,
            $planillaId,
            $userId,
            'planilla_created',
            'planilla',
            $planillaId,
            [
                'team_id' => $data['team_id'],
                'user_ids' => $userIds,
                'status' => $status
            ]
        );

        $conn->commit();
        sendResponse([
            'id' => intval($planillaId),
            'assigned_count' => count($userIds),
            'message' => 'Planilla creada y asignada correctamente'
        ], 201);
    } catch (Exception $e) {
        $conn->rollBack();
        sendError("Error creating planilla: " . $e->getMessage(), 500);
    }
}

function handleBulkCreate($conn, $data, $userId) {
    if (!isset($data['planillas']) || !is_array($data['planillas'])) {
        sendError("Field 'planillas' is required and must be an array", 400);
    }

    $planillas = $data['planillas'];
    $created = 0;
    $failed = 0;
    $errors = [];
    $createdPlanillas = [];

    try {
        $conn->beginTransaction();

        foreach ($planillas as $planilla) {
            try {
                if (!isset($planilla['team_id']) || empty($planilla['team_id'])) {
                    $failed++;
                    $errors[] = [
                        'team_id' => $planilla['team_id'] ?? 'N/A',
                        'error' => 'El campo team_id es obligatorio'
                    ];
                    continue;
                }

                if (!isset($planilla['email']) || empty($planilla['email'])) {
                    $failed++;
                    $errors[] = [
                        'team_id' => $planilla['team_id'],
                        'error' => 'El campo email es obligatorio'
                    ];
                    continue;
                }

                if (!isset($planilla['password']) || empty($planilla['password'])) {
                    $failed++;
                    $errors[] = [
                        'team_id' => $planilla['team_id'],
                        'error' => 'El campo password es obligatorio'
                    ];
                    continue;
                }

                if (!isset($planilla['username']) || empty($planilla['username'])) {
                    $failed++;
                    $errors[] = [
                        'team_id' => $planilla['team_id'],
                        'error' => 'El campo username es obligatorio'
                    ];
                    continue;
                }

                $stmt = $conn->prepare("SELECT id FROM planillas WHERE team_id = :team_id");
                $stmt->execute(['team_id' => $planilla['team_id']]);
                if ($stmt->fetch()) {
                    $failed++;
                    $errors[] = [
                        'team_id' => $planilla['team_id'],
                        'error' => 'El equipo ya tiene una planilla asignada'
                    ];
                    continue;
                }

                $stmt = $conn->prepare("SELECT id FROM profiles WHERE email = :email");
                $stmt->execute(['email' => $planilla['email']]);
                if ($stmt->fetch()) {
                    $failed++;
                    $errors[] = [
                        'team_id' => $planilla['team_id'],
                        'error' => 'El email ya está en uso'
                    ];
                    continue;
                }

                $hashedPassword = password_hash($planilla['password'], PASSWORD_BCRYPT);
                $newUserId = bin2hex(random_bytes(16));

                $stmt = $conn->prepare("
                    INSERT INTO profiles (id, email, username, password, is_admin, created_at)
                    VALUES (:id, :email, :username, :password, 0, NOW())
                ");
                $stmt->execute([
                    'id' => $newUserId,
                    'email' => $planilla['email'],
                    'username' => $planilla['username'],
                    'password' => $hashedPassword
                ]);

                $stmt = $conn->prepare("
                    INSERT INTO planillas (team_id, status, created_at, updated_at)
                    VALUES (:team_id, 'Pendiente de envío', NOW(), NOW())
                ");
                $stmt->execute([
                    'team_id' => $planilla['team_id']
                ]);

                $planillaId = $conn->lastInsertId();

                $stmt = $conn->prepare("
                    INSERT INTO user_planilla (user_id, planilla_id, created_at)
                    VALUES (:user_id, :planilla_id, NOW())
                ");
                $stmt->execute([
                    'user_id' => $newUserId,
                    'planilla_id' => $planillaId
                ]);

                logAudit(
                    $conn,
                    $planillaId,
                    $userId,
                    'planilla_created',
                    'planilla',
                    $planillaId,
                    [
                        'team_id' => $planilla['team_id'],
                        'user_id' => $newUserId,
                        'bulk_create' => true
                    ]
                );

                $createdPlanillas[] = [
                    'team_id' => $planilla['team_id'],
                    'username' => $planilla['username'],
                    'email' => $planilla['email'],
                    'password' => $planilla['password'],
                    'planilla_id' => intval($planillaId)
                ];

                $created++;
            } catch (Exception $e) {
                $failed++;
                $errors[] = [
                    'team_id' => $planilla['team_id'] ?? 'N/A',
                    'error' => 'Error al insertar: ' . $e->getMessage()
                ];
            }
        }

        $conn->commit();

        sendResponse([
            'success' => true,
            'created' => $created,
            'failed' => $failed,
            'planillas' => $createdPlanillas,
            'errors' => $errors
        ], 201);
    } catch (Exception $e) {
        $conn->rollBack();
        sendError("Error en carga masiva: " . $e->getMessage(), 500);
    }
}

function handlePut($conn, $userId)
{
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['id'])) {
        sendError("Field 'id' is required", 400);
    }

    $stmt = $conn->prepare("SELECT * FROM planillas WHERE id = :id");
    $stmt->execute(['id' => $data['id']]);
    $oldPlanilla = $stmt->fetch(PDO::FETCH_ASSOC);

    $fields = [];
    $params = ['id' => $data['id']];

    if (isset($data['status'])) {
        $fields[] = "status = :status";
        $params['status'] = $data['status'];
    }

    if (isset($data['team_id'])) {
        $fields[] = "team_id = :team_id";
        $params['team_id'] = $data['team_id'];
    }

    if (empty($fields)) {
        sendError("No fields to update", 400);
    }

    $sql = "UPDATE planillas SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = :id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        if (isset($data['status']) && $oldPlanilla && $data['status'] !== $oldPlanilla['status']) {
            logAudit(
                $conn,
                $data['id'],
                $userId,
                'status_changed',
                'planilla',
                $data['id'],
                [
                    'old_status' => $oldPlanilla['status'],
                    'new_status' => $data['status']
                ]
            );
        } elseif ($oldPlanilla) {
            logAudit(
                $conn,
                $data['id'],
                $userId,
                'planilla_updated',
                'planilla',
                $data['id'],
                [
                    'old' => $oldPlanilla,
                    'new' => $data
                ]
            );
        }

        sendResponse(['message' => 'Planilla actualizada correctamente']);
    } catch (Exception $e) {
        sendError("Error updating planilla: " . $e->getMessage(), 500);
    }
}

function handleDelete($conn, $userId)
{
    $id = $_GET['id'] ?? null;
    if (!$id) sendError("Planilla ID is required", 400);

    $stmt = $conn->prepare("SELECT * FROM planillas WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $planilla = $stmt->fetch(PDO::FETCH_ASSOC);

    try {
        $conn->beginTransaction();

        $conn->prepare("DELETE FROM jugadores WHERE planilla_id = :id")->execute(['id' => $id]);
        $conn->prepare("DELETE FROM personas WHERE planilla_id = :id")->execute(['id' => $id]);
        $conn->prepare("DELETE FROM user_planilla WHERE planilla_id = :id")->execute(['id' => $id]);
        $conn->prepare("DELETE FROM planillas WHERE id = :id")->execute(['id' => $id]);

        // Audit log: eliminación
        if ($planilla) {
            logAudit(
                $conn,
                $id,
                $userId,
                'planilla_deleted',
                'planilla',
                $id,
                $planilla
            );
        }

        $conn->commit();
        sendResponse(['message' => 'Planilla eliminada correctamente']);
    } catch (Exception $e) {
        $conn->rollBack();
        sendError("Error deleting planilla: " . $e->getMessage(), 500);
    }
}
?>
