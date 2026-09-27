<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db.php";

if (!isset($_GET['user_id']) || !is_numeric($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing 'user_id' parameter."]);
    exit();
}

$user_id = (int)$_GET['user_id'];

try {
    $orderStmt = $pdo->prepare("
        SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    ");
    $orderStmt->execute([$user_id]);
    $orders = $orderStmt->fetchAll(PDO::FETCH_ASSOC);

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
