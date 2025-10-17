<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
require_once 'conexion.php';

$conn = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed", 405);
}

$planillaId = $_GET['planilla_id'] ?? null;
if (!$planillaId) {
    sendError("planilla_id is required", 400);
}

try {
    $stmt = $conn->prepare("
        SELECT
            a.id,
            a.planilla_id,
            a.user_id,
            a.action,
            a.entity_type,
            a.entity_id,
            a.details,
            a.created_at,
            a.username
        FROM audit_log a
        WHERE a.planilla_id = :planilla_id
        ORDER BY a.created_at DESC
    ");
    $stmt->execute(['planilla_id' => $planillaId]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decodificar details de JSON string a objeto/array para el frontend
    foreach ($logs as &$log) {
        if ($log['details']) {
            $log['details'] = json_decode($log['details'], true);
        }
    }

    sendResponse($logs);
} catch (Exception $e) {
    sendError("Error fetching audit log: " . $e->getMessage(), 500);
}
?>
