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

    $stmt = $conn->prepare("SELECT * FROM jugadores WHERE planilla_id = :planilla_id ORDER BY number ASC");
    $stmt->execute(['planilla_id' => $planillaId]);
    $jugadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse($jugadores);
}

function handlePost($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (
        empty($data['planilla_id']) ||
        empty($data['dni']) ||
        empty($data['name']) ||
        empty($data['second_name'])
    ) {
        sendError("Missing required fields", 400);
    }

    $number = isset($data['number']) ? intval($data['number']) : 0;

    $stmt = $conn->prepare("SELECT UUID() AS id");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $jugador_id = $row['id'];

    $stmt = $conn->prepare("
        INSERT INTO jugadores (id, planilla_id, dni, number, name, second_name, created_at)
        VALUES (:id, :planilla_id, :dni, :number, :name, :second_name, NOW())
    ");
    $stmt->execute([
        'id' => $jugador_id,
        'planilla_id' => $data['planilla_id'],
        'dni' => $data['dni'],
        'number' => $number,
        'name' => $data['name'],
        'second_name' => $data['second_name']
    ]);

    logAudit(
        $conn,
        $data['planilla_id'],
        $userId,
        'jugador_added',
        'jugador',
        $jugador_id,
        $data
    );

    sendResponse(['message' => 'Jugador agregado correctamente', 'id' => $jugador_id], 201);
}

function handlePut($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['id'])) sendError("id is required", 400);

    $stmt = $conn->prepare("SELECT * FROM jugadores WHERE id = :id");
    $stmt->execute(['id' => $data['id']]);
    $oldJugador = $stmt->fetch(PDO::FETCH_ASSOC);

    $fields = [];
    $params = ['id' => $data['id']];
    foreach (['dni', 'number', 'name', 'second_name'] as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = :$field";
            $params[$field] = $data[$field];
        }
    }
    if (empty($fields)) sendError("No fields to update", 400);

    $sql = "UPDATE jugadores SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    if ($oldJugador) {
        logAudit(
            $conn,
            $oldJugador['planilla_id'],
            $userId,
            'jugador_updated',
            'jugador',
            $data['id'],
            [
                'old' => $oldJugador,
                'new' => $data
            ]
        );
    }

    sendResponse(['message' => 'Jugador actualizado correctamente']);
}

function handleDelete($conn, $userId) {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError("id is required", 400);

    $stmt = $conn->prepare("SELECT * FROM jugadores WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $jugador = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("DELETE FROM jugadores WHERE id = :id");
    $stmt->execute(['id' => $id]);

    if ($jugador) {
        logAudit(
            $conn,
            $jugador['planilla_id'],
            $userId,
            'jugador_deleted',
            'jugador',
            $id,
            $jugador
        );
    }

    sendResponse(['message' => 'Jugador eliminado correctamente']);
}
?>
