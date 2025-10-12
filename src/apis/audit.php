<?php
require_once 'conexion.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = getAuthUserId();

if ($method !== 'GET') {
    sendError("Method not allowed", 405);
}

$planillaId = $_GET['planilla_id'] ?? null;

if (!$planillaId) {
    sendError("Planilla ID is required", 400);
}

try {
    $stmt = $conn->prepare("
        SELECT
            a.*,
            p.full_name as user_name
        FROM planilla_audit_log a
        LEFT JOIN profiles p ON a.user_id = p.id
        WHERE a.planilla_id = :planilla_id
        ORDER BY a.created_at DESC
    ");

    $stmt->execute(['planilla_id' => $planillaId]);
    $logs = $stmt->fetchAll();

    foreach ($logs as &$log) {
        if ($log['old_value']) {
            $log['old_value'] = json_decode($log['old_value'], true);
        }
        if ($log['new_value']) {
            $log['new_value'] = json_decode($log['new_value'], true);
        }
    }

    sendResponse($logs);
} catch (Exception $e) {
    sendError("Error fetching audit log: " . $e->getMessage(), 500);
}
?>
