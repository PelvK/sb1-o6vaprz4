<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'conexion.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = getAuthUserId();

$stmt = $conn->prepare("SELECT is_admin FROM profiles WHERE id = :user_id");
$stmt->execute(['user_id' => $userId]);
$userProfile = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userProfile || !$userProfile['is_admin']) {
    sendError("Unauthorized: Admin access required", 403);
}

switch($method) {
    case 'GET':
        handleGet($conn);
        break;
    case 'POST':
        handlePost($conn);
        break;
    case 'PUT':
        handlePut($conn);
        break;
    case 'DELETE':
        handleDelete($conn);
        break;
    default:
        sendError("Method not allowed", 405);
}

function handleGet($conn) {
    try {
        $stmt = $conn->prepare("
            SELECT id, email, username, is_admin, created_at
            FROM profiles
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($users as &$user) {
            $user['is_admin'] = (bool)$user['is_admin'];
        }

        sendResponse(['users' => $users]);
    } catch (Exception $e) {
        sendError("Failed to fetch users: " . $e->getMessage(), 500);
    }
}

function handlePost($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        sendError("Invalid JSON data", 400);
    }

    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $username = $data['username'] ?? '';
    $isAdmin = isset($data['is_admin']) && $data['is_admin'];

    if (empty($email) || empty($password) || empty($username)) {
        sendError("Email, password and username are required", 400);
    }

    if (strlen($password) < 6) {
        sendError("Password must be at least 6 characters", 400);
    }

    try {
        $stmt = $conn->prepare("SELECT id FROM profiles WHERE email = :email");
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            sendError("User already exists", 409);
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $newUserId = bin2hex(random_bytes(16));

        $stmt = $conn->prepare("
            INSERT INTO profiles (id, email, username, password, is_admin, created_at)
            VALUES (:id, :email, :username, :password, :is_admin, NOW())
        ");
        $stmt->execute([
            'id' => $newUserId,
            'email' => $email,
            'username' => $username,
            'password' => $hashedPassword,
            'is_admin' => $isAdmin ? 1 : 0
        ]);

        sendResponse(['message' => 'User created successfully', 'id' => $newUserId], 201);
    } catch (Exception $e) {
        sendError("Failed to create user: " . $e->getMessage(), 500);
    }
}

function handlePut($conn) {
    $parts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
    $targetUserId = end($parts);

    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !$targetUserId) {
        sendError("User ID and data are required", 400);
    }

    $username = $data['username'] ?? '';
    $isAdmin = isset($data['is_admin']) && $data['is_admin'];

    if (empty($username)) {
        sendError("Username is required", 400);
    }

    try {
        $stmt = $conn->prepare("
            UPDATE profiles
            SET username = :username, is_admin = :is_admin
            WHERE id = :id
        ");
        $stmt->execute([
            'username' => $username,
            'is_admin' => $isAdmin ? 1 : 0,
            'id' => $targetUserId
        ]);

        if ($stmt->rowCount() === 0) {
            sendError("User not found", 404);
        }

        sendResponse(['message' => 'User updated successfully']);
    } catch (Exception $e) {
        sendError("Failed to update user: " . $e->getMessage(), 500);
    }
}

function handleDelete($conn) {
    $parts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
    $targetUserId = end($parts);

    if (!$targetUserId) {
        sendError("User ID is required", 400);
    }

    try {
        $stmt = $conn->prepare("DELETE FROM profiles WHERE id = :id");
        $stmt->execute(['id' => $targetUserId]);

        if ($stmt->rowCount() === 0) {
            sendError("User not found", 404);
        }

        sendResponse(['message' => 'User deleted successfully']);
    } catch (Exception $e) {
        sendError("Failed to delete user: " . $e->getMessage(), 500);
    }
}
?>
