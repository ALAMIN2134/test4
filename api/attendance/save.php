<?php
require_once '../config.php';

$input = json_decode(file_get_contents('php://input'), true);
$class_id = $input['class_id'] ?? null;
$attendance = $input['attendance'] ?? []; // [{student_id:111124001, status:'present'}, ...]

if (!$class_id || empty($attendance)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

try {
    $pdo->beginTransaction();

    foreach ($attendance as $att) {
        $sid = $att['student_id'];
        $status = ($att['status'] === 'present') ? 'present' : 'absent';

        $stmt = $pdo->prepare("
            INSERT INTO attendance (class_id, student_id, date, status)
            VALUES (?, ?, CURDATE(), ?)
            ON DUPLICATE KEY UPDATE status = ?
        ");
        $stmt->execute([$class_id, $sid, $status, $status]);
    }

    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Save failed']);
}
?>