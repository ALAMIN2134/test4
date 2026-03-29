<?php
require_once 'config.php';

// Get day from URL (e.g., ?day=Sat)
$day = $_GET['day'] ?? date('D');
$day_map = ['Sat'=>'Sat','Sun'=>'Sun','Mon'=>'Mon','Tue'=>'Tue','Thu'=>'Thu'];
$day = $day_map[$day] ?? null;

try {
    $sql = "
        SELECT c.id, s.code, s.full_name, t.name AS teacher, c.day, c.start_time
        FROM classes c
        JOIN subjects s ON c.subject_id = s.id
        JOIN teachers t ON c.teacher_id = t.id";
    
    $params = [];
    if ($day) {
        $sql .= " WHERE c.day = ?";
        $params[] = $day;
    }
    
    $sql .= " ORDER BY c.start_time";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $classes = $stmt->fetchAll();
    
    $options = [];
    foreach ($classes as $c) {
        $options[] = [
            'value' => $c['id'],
            'label' => "{$c['code']} - {$c['full_name']} ({$c['start_time']})"
        ];
    }
    
    echo json_encode($options);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch classes']);
}
?>