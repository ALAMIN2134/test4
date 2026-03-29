<?php
require_once 'config.php';

$class_id = $_GET['id'] ?? null;

if (!$class_id || !is_numeric($class_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid class ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT c.id, s.code, s.full_name, t.name AS teacher, c.room, c.start_time, c.end_time
        FROM classes c
        JOIN subjects s ON c.subject_id = s.id
        JOIN teachers t ON c.teacher_id = t.id
        WHERE c.id = ?
    ");
    $stmt->execute([$class_id]);
    $class = $stmt->fetch();

    if (!$class) {
        http_response_code(404);
        echo json_encode(['error' => 'Class not found']);
        exit;
    }

    echo json_encode([
        'id' => $class['id'],
        'subject_code' => $class['code'],
        'subject_name' => $class['full_name'],
        'teacher' => $class['teacher'],
        'room' => $class['room'],
        'start_time' => $class['start_time'],
        'end_time' => $class['end_time']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch class']);
}
?>