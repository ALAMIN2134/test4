<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT student_id FROM students ORDER BY student_id");
    $students = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($students);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch students']);
}
?>