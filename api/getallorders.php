<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db.php";

try {
    $statusFilter = $_GET['status'] ?? '';

    $sql = "
        SELECT o.*, u.name AS customer_name, u.email AS customer_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
    ";
    $params = [];

    if (!empty($statusFilter) && $statusFilter !== 'All') {
        $sql .= " WHERE o.status = ?";
        $params[] = $statusFilter;
    }

    $sql .= " ORDER BY o.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $itemStmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");

    foreach ($orders as &$order) {
        $order['total_amount'] = (float)$order['total_amount'];
        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($items as &$item) {
            $item['price'] = (float)$item['price'];
        }
        $order['items'] = $items;
    }

    echo json_encode($orders);

} catch (PDOException $e) {
    error_log("Failed to fetch orders: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>
