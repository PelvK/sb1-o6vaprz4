<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'vps4_infantiles_valesanito_planilla');
define('DB_USER', 'infantiles');
define('DB_PASS', 'laquevosquieras2022');
  

function getDBConnection() {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $conn;
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "message" => "Database connection failed: " . $e->getMessage()
        ]);
        exit();
    }
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        "error" => true,
        "message" => $message
    ]);
    exit();
}

function getAuthUserId() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader)) {
        sendError("Authorization header missing", 401);
    }

    $token = str_replace('Bearer ', '', $authHeader);
    if (empty($token)) {
        sendError("Invalid token", 401);
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        sendError("Malformed token", 401);
    }

    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);

    if (!$payload || !isset($payload['sub'])) {
        sendError("Invalid token payload", 401);
    }

    return $payload['sub'];
}
