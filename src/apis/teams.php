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
        $stmt = $conn->prepare("SELECT * FROM teams WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $team = $stmt->fetch();

        if (!$team) {
            sendError("Team not found", 404);
        }

        $stmt = $conn->prepare("
            SELECT id, email, full_name, role
            FROM profiles
            WHERE team_id = :team_id
            ORDER BY full_name
        ");
        $stmt->execute(['team_id' => $id]);
        $members = $stmt->fetchAll();

        $team['members'] = $members;
        sendResponse($team);
    } else {
        $stmt = $conn->prepare("
            SELECT t.*, COUNT(p.id) as member_count
            FROM teams t
            LEFT JOIN profiles p ON t.id = p.team_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        ");
        $stmt->execute();
        $teams = $stmt->fetchAll();

        sendResponse($teams);
    }
}

function handlePost($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        sendError("Invalid JSON data", 400);
    }

    $stmt = $conn->prepare("SELECT role FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch();

    if (!$userProfile || $userProfile['role'] !== 'admin') {
        sendError("Unauthorized", 403);
    }

    if (!isset($data['name']) || empty($data['name'])) {
        sendError("Field 'name' is required", 400);
    }

    $id = uniqid('team_', true);

    try {
        $stmt = $conn->prepare("
            INSERT INTO teams (id, name)
            VALUES (:id, :name)
        ");

        $stmt->execute([
            'id' => $id,
            'name' => $data['name']
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

    $stmt = $conn->prepare("SELECT role FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch();

    if (!$userProfile || $userProfile['role'] !== 'admin') {
        sendError("Unauthorized", 403);
    }

    $id = $data['id'];

    try {
        $updates = [];
        $params = ['id' => $id];

        if (isset($data['name'])) {
            $updates[] = "name = :name";
            $params['name'] = $data['name'];
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

    $stmt = $conn->prepare("SELECT role FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch();

    if (!$userProfile || $userProfile['role'] !== 'admin') {
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
