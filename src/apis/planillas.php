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
        // 1. Planilla y datos del equipo
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

        // 2. Jugadores
        $jugStmt = $conn->prepare("
            SELECT id, planilla_id, dni, number, name, second_name, created_at
            FROM jugadores WHERE planilla_id = :planilla_id
        ");
        $jugStmt->execute(['planilla_id' => $id]);
        $jugadores = $jugStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Personas
        $persStmt = $conn->prepare("
            SELECT id, planilla_id, dni, name, second_name, phone_number, charge, created_at
            FROM personas WHERE planilla_id = :planilla_id
        ");
        $persStmt->execute(['planilla_id' => $id]);
        $personas = $persStmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Assigned users (user_planilla + profiles)
        $usersStmt = $conn->prepare("
            SELECT up.id AS user_planilla_id, p.id, p.username, p.is_admin, p.created_at
            FROM user_planilla up
            JOIN profiles p ON up.user_id = p.id
            WHERE up.planilla_id = :planilla_id
        ");
        $usersStmt->execute(['planilla_id' => $id]);
        $assigned_users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

        // 5. Team
        $team = [
            'id' => $planilla['team_id'],
            'nombre' => $planilla['team_nombre'],
            'category' => intval($planilla['team_category']),
            'created_at' => $planilla['team_created_at'],
        ];

        // 6. Armar el objeto respuesta
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

    if (!$data || empty($data['team_id'])) {
        sendError("Field 'team_id' is required", 400);
    }
    if (!isset($data['user_ids']) || !is_array($data['user_ids']) || count($data['user_ids']) === 0) {
        sendError("Field 'user_ids' must be a non-empty array", 400);
    }

    $status = $data['status'] ?? 'Pendiente de envío';
    $userIds = array_values(array_unique($data['user_ids'])); // evita duplicados

    try {
        $conn->beginTransaction();

        // Insert sin pasar el ID, ya que es autoincremental
        $stmt = $conn->prepare("
            INSERT INTO planillas (team_id, status, created_at, updated_at)
            VALUES (:team_id, :status, NOW(), NOW())
        ");
        $stmt->execute([
            'team_id' => $data['team_id'],
            'status' => $status
        ]);

        // Obtener el ID autogenerado
        $planillaId = $conn->lastInsertId();

        // Asignar usuarios a la planilla
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

        // Audit log: nueva planilla
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

function handlePut($conn, $userId)
{
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['id'])) {
        sendError("Field 'id' is required", 400);
    }

    // Obtener planilla previa para log
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

        // Audit log: status_changed o planilla_updated
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

    // Traer planilla antes de borrar
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
