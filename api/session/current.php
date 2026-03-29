<?php
require_once '../config.php';

$today = date('D'); // Sat, Sun, Mon, Tue
// // AFTER (force Saturday)
// $today = 'Mon';
// $day = 'Mon';
$now = new DateTime();

// Map day to DB
$day_map = ['Sat'=>'Sat','Sun'=>'Sun','Mon'=>'Mon','Tue'=>'Tue','Thu'=>'Thu'];
$day = $day_map[$today] ?? null;

if (!$day) {
    echo json_encode(['status' => 'no_class', 'message' => 'No class today']);
    exit;
}

// Get class for today
$stmt = $pdo->prepare("
    SELECT c.id, s.code, s.full_name AS subject, t.name AS teacher,
           c.start_time, c.end_time, c.room, c.is_lab
    FROM classes c
    JOIN subjects s ON c.subject_id = s.id
    JOIN teachers t ON c.teacher_id = t.id
    WHERE c.day = ?
    ORDER BY c.start_time
    LIMIT 1
");
$stmt->execute([$day]);
$class = $stmt->fetch();

if (!$class) {
    echo json_encode(['status' => 'no_class', 'message' => 'No class scheduled']);
    exit;
}

// Check status
$now = new DateTime('now', new DateTimeZone('Asia/Dhaka')); // ✅ Set timezone
$start = new DateTime("today {$class['start_time']}", new DateTimeZone('Asia/Dhaka'));
$end = new DateTime("today {$class['end_time']}", new DateTimeZone('Asia/Dhaka'));

if ($now < $start) {
    $status = 'upcoming';
    $diff = $now->diff($start);
    $remaining = sprintf('%02d:%02d', $diff->h, $diff->i);
} elseif ($now <= $end) {
    $status = 'active';
    $diff = $now->diff($end);
    $remaining = sprintf('%02d:%02d', $diff->h, $diff->i);
} else {
    $status = 'ended';
    $remaining = '00:00';
}

echo json_encode([
    'status' => $status,
    'class' => [
        'id' => $class['id'],
        'subject_code' => $class['code'],
        'subject_name' => $class['subject'],
        'teacher' => $class['teacher'],
        'room' => $class['room'],
        'start_time' => $class['start_time'],
        'end_time' => $class['end_time']
    ],
    'remaining_time' => $remaining
]);
?>