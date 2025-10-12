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
            SELECT p.*, t.name as team_name
            FROM profiles p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $profile = $stmt->fetch();

        if (!$profile) {
            sendError("Profile not found", 404);
        }

        sendResponse($profile);
    } else {
        $stmt = $conn->prepare("SELECT role FROM profiles WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $userProfile = $stmt->fetch();

        if (!$userProfile || $userProfile['role'] !== 'admin') {
            sendError("Unauthorized", 403);
        }

        $stmt = $conn->prepare("
            SELECT p.*, t.name as team_name
            FROM profiles p
            LEFT JOIN teams t ON p.team_id = t.id
            ORDER BY p.created_at DESC
        ");
        $stmt->execute();
        $profiles = $stmt->fetchAll();

        sendResponse($profiles);
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

    $required = ['id', 'email'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("Field '$field' is required", 400);
        }
    }

    try {
        $stmt = $conn->prepare("
            INSERT INTO profiles (id, email, full_name, role, team_id)
            VALUES (:id, :email, :full_name, :role, :team_id)
        ");

        $stmt->execute([
            'id' => $data['id'],
            'email' => $data['email'],
            'full_name' => $data['full_name'] ?? null,
            'role' => $data['role'] ?? 'user',
            'team_id' => $data['team_id'] ?? null
        ]);

        sendResponse(['message' => 'Profile created successfully'], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            sendError("Profile already exists", 409);
        }
        sendError("Error creating profile: " . $e->getMessage(), 500);
    }
}

function handlePut($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['id'])) {
        sendError("Profile ID is required", 400);
    }

    $id = $data['id'];

    $stmt = $conn->prepare("SELECT role FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch();

    if ($id !== $userId && (!$userProfile || $userProfile['role'] !== 'admin')) {
        sendError("Unauthorized", 403);
    }

    try {
        $updates = [];
        $params = ['id' => $id];

        $allowedFields = ['full_name', 'role', 'team_id'];

        if ($userProfile['role'] !== 'admin') {
            $allowedFields = ['full_name'];
        }

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($updates)) {
            sendError("No fields to update", 400);
        }

        $sql = "UPDATE profiles SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        sendResponse(['message' => 'Profile updated successfully']);
    } catch (Exception $e) {
        sendError("Error updating profile: " . $e->getMessage(), 500);
    }
}

function handleDelete($conn, $userId) {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        sendError("Profile ID is required", 400);
    }

    $stmt = $conn->prepare("SELECT role FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch();

    if (!$userProfile || $userProfile['role'] !== 'admin') {
        sendError("Unauthorized", 403);
    }

    if ($id === $userId) {
        sendError("Cannot delete your own profile", 400);
    }

    try {
        $stmt = $conn->prepare("DELETE FROM profiles WHERE id = :id");
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() === 0) {
            sendError("Profile not found", 404);
        }

        sendResponse(['message' => 'Profile deleted successfully']);
    } catch (Exception $e) {
        sendError("Error deleting profile: " . $e->getMessage(), 500);
    }
}
?>
