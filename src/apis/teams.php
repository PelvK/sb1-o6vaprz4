<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
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
        $stmt = $conn->prepare("SELECT id, nombre, category, created_at FROM teams WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $team = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$team) {
            sendError("Team not found", 404);
        }

        // Miembros (si los querés agregar)
        $stmt = $conn->prepare("
            SELECT id, username, email, is_admin, created_at
            FROM profiles
            WHERE team_id = :team_id
            ORDER BY username
        ");
        $stmt->execute(['team_id' => $id]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Forzar bool en is_admin
        foreach ($members as &$m) { $m['is_admin'] = (bool)$m['is_admin']; }

        $team['members'] = $members;

        sendResponse($team);
    } else {
        $stmt = $conn->prepare("
            SELECT t.id, t.nombre, t.category, t.created_at, COUNT(p.id) as member_count
            FROM teams t
            LEFT JOIN profiles p ON t.id = p.team_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        ");
        $stmt->execute();
        $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse($teams);
    }
}

function handlePost($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        sendError("Invalid JSON data", 400);
    }

    // Solo admin puede crear equipos
    $stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userProfile || !$userProfile['is_admin']) {
        sendError("Unauthorized", 403);
    }

    if (!isset($data['nombre']) || empty($data['nombre'])) {
        sendError("Field 'nombre' is required", 400);
    }
    if (!isset($data['category']) || empty($data['category'])) {
        sendError("Field 'category' is required", 400);
    }

    $id = uniqid('team_', true);

    try {
        $stmt = $conn->prepare("
            INSERT INTO teams (id, nombre, category, created_at)
            VALUES (:id, :nombre, :category, NOW())
        ");

        $stmt->execute([
            'id' => $id,
            'nombre' => $data['nombre'],
            'category' => $data['category']
        ]);

        sendResponse(['id' => $id, 'message' => 'Team created successfully'], 201);
    } catch (Exception $e) {
        sendError("Error creating team: " . $e->getMessage(), 500);
    }
}

function handlePut($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['id'])) {
        sendError("Team ID is required", 400);
    }

    // Solo admin puede modificar equipos
    $stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userProfile || !$userProfile['is_admin']) {
        sendError("Unauthorized", 403);
    }

    $id = $data['id'];

    try {
        $updates = [];
        $params = ['id' => $id];

        if (isset($data['nombre'])) {
            $updates[] = "nombre = :nombre";
            $params['nombre'] = $data['nombre'];
        }
        if (isset($data['category'])) {
            $updates[] = "category = :category";
            $params['category'] = $data['category'];
        }

        if (empty($updates)) {
            sendError("No fields to update", 400);
        }

        $sql = "UPDATE teams SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            sendError("Team not found", 404);
        }

        sendResponse(['message' => 'Team updated successfully']);
    } catch (Exception $e) {
        sendError("Error updating team: " . $e->getMessage(), 500);
    }
}

function handleDelete($conn, $userId) {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        sendError("Team ID is required", 400);
    }

    // Solo admin puede borrar equipos
    $stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userProfile || !$userProfile['is_admin']) {
        sendError("Unauthorized", 403);
    }

    try {
        $stmt = $conn->prepare("DELETE FROM teams WHERE id = :id");
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() === 0) {
            sendError("Team not found", 404);
        }

        sendResponse(['message' => 'Team deleted successfully']);
    } catch (Exception $e) {
        sendError("Error deleting team: " . $e->getMessage(), 500);
    }
}
?>
