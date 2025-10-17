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
        $stmt = $conn->prepare("
            SELECT p.id, p.username, p.email, p.is_admin, p.created_at
            FROM profiles p
            WHERE p.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$profile) {
            sendError("Profile not found", 404);
        }

        $profile['is_admin'] = (bool)$profile['is_admin'];

        sendResponse($profile);
    } else {
        $stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$userProfile || !$userProfile['is_admin']) {
            sendError("Unauthorized", 403);
        }

        $stmt = $conn->prepare("
            SELECT id, username, email, is_admin, created_at
            FROM profiles
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $profiles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($profiles as &$p) {
            $p['is_admin'] = (bool)$p['is_admin'];
        }

        sendResponse($profiles);
    }
}

function handlePost($conn, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        sendError("Invalid JSON data", 400);
    }

    $stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userProfile || !$userProfile['is_admin']) {
        sendError("Unauthorized", 403);
    }

    $required = ['id', 'email', 'username'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("Field '$field' is required", 400);
        }
    }

    try {
        $stmt = $conn->prepare("
            INSERT INTO profiles (id, email, username, is_admin, created_at)
            VALUES (:id, :email, :username, :is_admin, NOW())
        ");

        $stmt->execute([
            'id' => $data['id'],
            'email' => $data['email'],
            'username' => $data['username'],
            'is_admin' => isset($data['is_admin']) && $data['is_admin'] ? 1 : 0,
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

    $stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($id !== $userId && (!$userProfile || !$userProfile['is_admin'])) {
        sendError("Unauthorized", 403);
    }

    try {
        $updates = [];
        $params = ['id' => $id];

        $allowedFields = ['username', 'email', 'is_admin'];

        if (!$userProfile['is_admin']) {
            $allowedFields = ['username', 'email'];
        }

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = :$field";
                $params[$field] = ($field === 'is_admin') ? (isset($data[$field]) && $data[$field] ? 1 : 0) : $data[$field];
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

    $stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userProfile || !$userProfile['is_admin']) {
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
