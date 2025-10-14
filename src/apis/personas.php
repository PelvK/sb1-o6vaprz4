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

function handleGet($conn) {
    $planillaId = $_GET['planilla_id'] ?? null;
    if (!$planillaId) sendError("planilla_id is required", 400);

    $stmt = $conn->prepare("SELECT * FROM personas WHERE planilla_id = :planilla_id ORDER BY charge, name ASC");
    $stmt->execute(['planilla_id' => $planillaId]);
    $personas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse($personas);
}

function handlePost($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (
        empty($data['planilla_id']) ||
        empty($data['dni']) ||
        empty($data['name']) ||
        empty($data['second_name']) ||
        empty($data['phone_number']) ||
        empty($data['charge'])
    ) {
        sendError("Missing required fields", 400);
    }

    $stmt = $conn->prepare("SELECT UUID() AS id");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $persona_id = $row['id'];

    $stmt = $conn->prepare("
        INSERT INTO personas (id, planilla_id, dni, name, second_name, phone_number, charge, created_at)
        VALUES (:id, :planilla_id, :dni, :name, :second_name, :phone_number, :charge, NOW())
    ");
    $stmt->execute([
        'id' => $persona_id,
        'planilla_id' => $data['planilla_id'],
        'dni' => $data['dni'],
        'name' => $data['name'],
        'second_name' => $data['second_name'],
        'phone_number' => $data['phone_number'],
        'charge' => $data['charge'],
    ]);

    // Audit log
    logAudit(
        $conn,
        $data['planilla_id'],
        $userId,
        'persona_added',
        'persona',
        $persona_id,
        $data
    );

    sendResponse(['message' => 'Persona agregada correctamente', 'id' => $persona_id], 201);
}

function handlePut($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['id'])) sendError("id is required", 400);

    $stmt = $conn->prepare("SELECT * FROM personas WHERE id = :id");
    $stmt->execute(['id' => $data['id']]);
    $oldPersona = $stmt->fetch(PDO::FETCH_ASSOC);

    $fields = [];
    $params = ['id' => $data['id']];
    foreach (['dni', 'name', 'second_name', 'phone_number', 'charge'] as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = :$field";
            $params[$field] = $data[$field];
        }
    }
    if (empty($fields)) sendError("No fields to update", 400);

    $sql = "UPDATE personas SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    if ($oldPersona) {
        logAudit(
            $conn,
            $oldPersona['planilla_id'],
            $userId,
            'persona_updated',
            'persona',
            $data['id'],
            [
                'old' => $oldPersona,
                'new' => $data
            ]
        );
    }

    sendResponse(['message' => 'Persona actualizada correctamente']);
}

function handleDelete($conn, $userId) {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError("id is required", 400);

    $stmt = $conn->prepare("SELECT * FROM personas WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $persona = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("DELETE FROM personas WHERE id = :id");
    $stmt->execute(['id' => $id]);

    if ($persona) {
        logAudit(
            $conn,
            $persona['planilla_id'],
            $userId,
            'persona_deleted',
            'persona',
            $id,
            $persona
        );
    }

    sendResponse(['message' => 'Persona eliminada correctamente']);
}
?>
