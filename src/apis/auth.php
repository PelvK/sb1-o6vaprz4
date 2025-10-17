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

switch($method) {
    case 'POST':
        handlePost($conn);
        break;
    case 'GET':
        handleGet($conn);
        break;
    case 'DELETE':
        handleDelete($conn);
        break;
    default:
        sendError("Method not allowed", 405);
}

function handlePost($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        sendError("Invalid JSON data", 400);
    }

    $action = $data['action'] ?? null;

    if ($action === 'login') {
        handleLogin($conn, $data);
    } elseif ($action === 'register') {
        handleRegister($conn, $data);
    } else {
        sendError("Invalid action", 400);
    }
}

function handleLogin($conn, $data) {
    $email = "'" . $data['email'] . "'" ?? '';
    $password = "'" . $data['password'] . "'" ?? '';

    if (empty($email) || empty($password)) {
        sendError("Email and password are required", 400);
    }

    try {
        $stmt = $conn->prepare("
            SELECT id, email, username, password, is_admin, created_at
            FROM profiles
            WHERE email = :email
        ");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            sendError("Invalid credentials", 401);
        }

        if (!password_verify($password, $user['password'])) {
            sendError("Invalid credentials", 401);
        }

        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        $stmt = $conn->prepare("
            INSERT INTO sessions (id, user_id, session_token, expires_at, created_at)
            VALUES (:id, :user_id, :session_token, :expires_at, NOW())
            ON DUPLICATE KEY UPDATE
                session_token = :session_token,
                expires_at = :expires_at
        ");
        $stmt->execute([
            'id' => bin2hex(random_bytes(16)),
            'user_id' => $user['id'],
            'session_token' => $sessionId,
            'expires_at' => $expiresAt
        ]);

        unset($user['password']);
        $user['is_admin'] = (bool)$user['is_admin'];

        sendResponse([
            'user' => $user,
            'session' => [
                'access_token' => $sessionId,
                'expires_at' => $expiresAt
            ]
        ]);
    } catch (Exception $e) {
        sendError("Login failed: " . $e->getMessage(), 500);
    }
}

function handleRegister($conn, $data) {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $username = $data['username'] ?? '';

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
        $userId = bin2hex(random_bytes(16));

        $stmt = $conn->prepare("
            INSERT INTO profiles (id, email, username, password, is_admin, created_at)
            VALUES (:id, :email, :username, :password, :is_admin, NOW())
        ");
        $stmt->execute([
            'id' => $userId,
            'email' => $email,
            'username' => $username,
            'password' => $hashedPassword,
            'is_admin' => 0
        ]);

        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        $stmt = $conn->prepare("
            INSERT INTO sessions (id, user_id, session_token, expires_at, created_at)
            VALUES (:id, :user_id, :session_token, :expires_at, NOW())
        ");
        $stmt->execute([
            'id' => bin2hex(random_bytes(16)),
            'user_id' => $userId,
            'session_token' => $sessionId,
            'expires_at' => $expiresAt
        ]);

        $user = [
            'id' => $userId,
            'email' => $email,
            'username' => $username,
            'is_admin' => false,
            'created_at' => date('Y-m-d H:i:s')
        ];

        sendResponse([
            'user' => $user,
            'session' => [
                'access_token' => $sessionId,
                'expires_at' => $expiresAt
            ]
        ], 201);
    } catch (Exception $e) {
        sendError("Registration failed: " . $e->getMessage(), 500);
    }
}

function handleGet($conn) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader)) {
        sendError("Authorization header missing", 401);
    }

    $token = str_replace('Bearer ', '', $authHeader);
    if (empty($token)) {
        sendError("Invalid token", 401);
    }

    try {
        $stmt = $conn->prepare("
            SELECT s.user_id, s.expires_at, p.id, p.email, p.username, p.is_admin, p.created_at
            FROM sessions s
            INNER JOIN profiles p ON s.user_id = p.id
            WHERE s.session_token = :token
        ");
        $stmt->execute(['token' => $token]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result) {
            sendError("Invalid session", 401);
        }

        if (strtotime($result['expires_at']) < time()) {
            sendError("Session expired", 401);
        }

        $user = [
            'id' => $result['id'],
            'email' => $result['email'],
            'username' => $result['username'],
            'is_admin' => (bool)$result['is_admin'],
            'created_at' => $result['created_at']
        ];

        sendResponse(['user' => $user]);
    } catch (Exception $e) {
        sendError("Session verification failed: " . $e->getMessage(), 500);
    }
}

function handleDelete($conn) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader)) {
        sendError("Authorization header missing", 401);
    }

    $token = str_replace('Bearer ', '', $authHeader);
    if (empty($token)) {
        sendError("Invalid token", 401);
    }

    try {
        $stmt = $conn->prepare("DELETE FROM sessions WHERE session_token = :token");
        $stmt->execute(['token' => $token]);

        sendResponse(['message' => 'Logged out successfully']);
    } catch (Exception $e) {
        sendError("Logout failed: " . $e->getMessage(), 500);
    }
}
?>
