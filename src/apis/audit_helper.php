<?php
function logAudit($conn, $planilla_id, $user_id, $action, $entity_type, $entity_id, $details = []) {
    $stmt = $conn->prepare("
        INSERT INTO audit_log
        (id, planilla_id, user_id, action, entity_type, entity_id, details, created_at, username)
        VALUES (UUID(), :planilla_id, :user_id, :action, :entity_type, :entity_id, :details, NOW(),
            (SELECT username FROM profiles WHERE id = :user_id_username LIMIT 1)
        )
    ");
    $stmt->execute([
    'planilla_id' => $planilla_id,
    'user_id' => $user_id,
    'action' => $action,
    'entity_type' => $entity_type,
    'entity_id' => $entity_id,
    'details' => json_encode($details, JSON_UNESCAPED_UNICODE),
    'user_id_username' => $user_id,
]);

}
?>
