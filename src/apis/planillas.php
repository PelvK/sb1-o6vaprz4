<?php
require_once 'conexion.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = getAuthUserId();

switch($method) {
    case 'GET':
        handleGet($conn, $userId);
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

function handleGet($conn, $userId) {
    $id = $_GET['id'] ?? null;

    if ($id) {
        $stmt = $conn->prepare("
            SELECT p.*, pr.email as creator_email, pr.full_name as creator_name, t.name as team_name
            FROM planillas p
            LEFT JOIN profiles pr ON p.created_by = pr.id
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $planilla = $stmt->fetch();

        if (!$planilla) {
            sendError("Planilla not found", 404);
        }

        $stmt = $conn->prepare("
            SELECT * FROM planilla_detalle
            WHERE planilla_id = :planilla_id
            ORDER BY fecha, trabajador
        ");
        $stmt->execute(['planilla_id' => $id]);
        $detalles = $stmt->fetchAll();

        $planilla['detalles'] = $detalles;
        sendResponse($planilla);
    } else {
        $stmt = $conn->prepare("
            SELECT pr.role FROM profiles WHERE id = :user_id
        ");
        $stmt->execute(['user_id' => $userId]);
        $profile = $stmt->fetch();

        if ($profile && $profile['role'] === 'admin') {
            $stmt = $conn->prepare("
                SELECT p.*, pr.email as creator_email, pr.full_name as creator_name, t.name as team_name
                FROM planillas p
                LEFT JOIN profiles pr ON p.created_by = pr.id
                LEFT JOIN teams t ON p.team_id = t.id
                ORDER BY p.created_at DESC
            ");
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("
                SELECT p.*, pr.email as creator_email, pr.full_name as creator_name, t.name as team_name
                FROM planillas p
                LEFT JOIN profiles pr ON p.created_by = pr.id
                LEFT JOIN teams t ON p.team_id = t.id
                WHERE p.created_by = :user_id OR p.team_id IN (
                    SELECT team_id FROM profiles WHERE id = :user_id
                )
                ORDER BY p.created_at DESC
            ");
            $stmt->execute(['user_id' => $userId]);
        }

        $planillas = $stmt->fetchAll();
        sendResponse($planillas);
    }
}

function handlePost($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        sendError("Invalid JSON data", 400);
    }

    $required = ['numero_planilla', 'fecha_inicio', 'fecha_fin', 'empresa', 'proyecto'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("Field '$field' is required", 400);
        }
    }

    $id = uniqid('pln_', true);

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("
            INSERT INTO planillas (
                id, numero_planilla, fecha_inicio, fecha_fin, estado,
                empresa, proyecto, observaciones, total_horas, created_by, team_id
            ) VALUES (
                :id, :numero_planilla, :fecha_inicio, :fecha_fin, :estado,
                :empresa, :proyecto, :observaciones, :total_horas, :created_by, :team_id
            )
        ");

        $stmt->execute([
            'id' => $id,
            'numero_planilla' => $data['numero_planilla'],
            'fecha_inicio' => $data['fecha_inicio'],
            'fecha_fin' => $data['fecha_fin'],
            'estado' => $data['estado'] ?? 'borrador',
            'empresa' => $data['empresa'],
            'proyecto' => $data['proyecto'],
            'observaciones' => $data['observaciones'] ?? null,
            'total_horas' => $data['total_horas'] ?? 0,
            'created_by' => $userId,
            'team_id' => $data['team_id'] ?? null
        ]);

        if (isset($data['detalles']) && is_array($data['detalles'])) {
            foreach ($data['detalles'] as $detalle) {
                $detalleId = uniqid('det_', true);
                $stmtDetalle = $conn->prepare("
                    INSERT INTO planilla_detalle (
                        id, planilla_id, fecha, trabajador, dni, cargo,
                        horas_trabajadas, tarifa_hora
                    ) VALUES (
                        :id, :planilla_id, :fecha, :trabajador, :dni, :cargo,
                        :horas_trabajadas, :tarifa_hora
                    )
                ");
                $stmtDetalle->execute([
                    'id' => $detalleId,
                    'planilla_id' => $id,
                    'fecha' => $detalle['fecha'],
                    'trabajador' => $detalle['trabajador'],
                    'dni' => $detalle['dni'] ?? null,
                    'cargo' => $detalle['cargo'] ?? null,
                    'horas_trabajadas' => $detalle['horas_trabajadas'] ?? 0,
                    'tarifa_hora' => $detalle['tarifa_hora'] ?? 0
                ]);
            }
        }

        $auditId = uniqid('aud_', true);
        $stmtAudit = $conn->prepare("
            INSERT INTO planilla_audit_log (id, planilla_id, action, user_id, user_email, new_value)
            SELECT :id, :planilla_id, 'created', :user_id, email, :new_value
            FROM profiles WHERE id = :user_id
        ");
        $stmtAudit->execute([
            'id' => $auditId,
            'planilla_id' => $id,
            'user_id' => $userId,
            'new_value' => json_encode($data)
        ]);

        $conn->commit();

        sendResponse(['id' => $id, 'message' => 'Planilla created successfully'], 201);
    } catch (Exception $e) {
        $conn->rollBack();
        sendError("Error creating planilla: " . $e->getMessage(), 500);
    }
}

function handlePut($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['id'])) {
        sendError("Planilla ID is required", 400);
    }

    $id = $data['id'];

    $stmt = $conn->prepare("SELECT * FROM planillas WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $oldPlanilla = $stmt->fetch();

    if (!$oldPlanilla) {
        sendError("Planilla not found", 404);
    }

    try {
        $conn->beginTransaction();

        $updates = [];
        $params = ['id' => $id];

        $allowedFields = [
            'numero_planilla', 'fecha_inicio', 'fecha_fin', 'estado',
            'empresa', 'proyecto', 'observaciones', 'total_horas', 'team_id'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (!empty($updates)) {
            $sql = "UPDATE planillas SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
        }

        if (isset($data['detalles']) && is_array($data['detalles'])) {
            $stmt = $conn->prepare("DELETE FROM planilla_detalle WHERE planilla_id = :planilla_id");
            $stmt->execute(['planilla_id' => $id]);

            foreach ($data['detalles'] as $detalle) {
                $detalleId = $detalle['id'] ?? uniqid('det_', true);
                $stmtDetalle = $conn->prepare("
                    INSERT INTO planilla_detalle (
                        id, planilla_id, fecha, trabajador, dni, cargo,
                        horas_trabajadas, tarifa_hora
                    ) VALUES (
                        :id, :planilla_id, :fecha, :trabajador, :dni, :cargo,
                        :horas_trabajadas, :tarifa_hora
                    )
                ");
                $stmtDetalle->execute([
                    'id' => $detalleId,
                    'planilla_id' => $id,
                    'fecha' => $detalle['fecha'],
                    'trabajador' => $detalle['trabajador'],
                    'dni' => $detalle['dni'] ?? null,
                    'cargo' => $detalle['cargo'] ?? null,
                    'horas_trabajadas' => $detalle['horas_trabajadas'] ?? 0,
                    'tarifa_hora' => $detalle['tarifa_hora'] ?? 0
                ]);
            }
        }

        $auditId = uniqid('aud_', true);
        $stmtAudit = $conn->prepare("
            INSERT INTO planilla_audit_log (id, planilla_id, action, user_id, user_email, old_value, new_value)
            SELECT :id, :planilla_id, 'updated', :user_id, email, :old_value, :new_value
            FROM profiles WHERE id = :user_id
        ");
        $stmtAudit->execute([
            'id' => $auditId,
            'planilla_id' => $id,
            'user_id' => $userId,
            'old_value' => json_encode($oldPlanilla),
            'new_value' => json_encode($data)
        ]);

        $conn->commit();

        sendResponse(['message' => 'Planilla updated successfully']);
    } catch (Exception $e) {
        $conn->rollBack();
        sendError("Error updating planilla: " . $e->getMessage(), 500);
    }
}

function handleDelete($conn, $userId) {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        sendError("Planilla ID is required", 400);
    }

    $stmt = $conn->prepare("SELECT * FROM planillas WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $planilla = $stmt->fetch();

    if (!$planilla) {
        sendError("Planilla not found", 404);
    }

    try {
        $conn->beginTransaction();

        $auditId = uniqid('aud_', true);
        $stmtAudit = $conn->prepare("
            INSERT INTO planilla_audit_log (id, planilla_id, action, user_id, user_email, old_value)
            SELECT :id, :planilla_id, 'deleted', :user_id, email, :old_value
            FROM profiles WHERE id = :user_id
        ");
        $stmtAudit->execute([
            'id' => $auditId,
            'planilla_id' => $id,
            'user_id' => $userId,
            'old_value' => json_encode($planilla)
        ]);

        $stmt = $conn->prepare("DELETE FROM planillas WHERE id = :id");
        $stmt->execute(['id' => $id]);

        $conn->commit();

        sendResponse(['message' => 'Planilla deleted successfully']);
    } catch (Exception $e) {
        $conn->rollBack();
        sendError("Error deleting planilla: " . $e->getMessage(), 500);
    }
}
?>
