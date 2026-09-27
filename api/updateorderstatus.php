<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$validStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

if (
    $data === null ||
    !isset($data['order_id']) || !is_numeric($data['order_id']) ||
    empty($data['status']) || !in_array($data['status'], $validStatuses, true)
) {
    http_response_code(400);
    echo json_encode(["error" => "Valid 'order_id' and 'status' are required. Status must be one of: " . implode(', ', $validStatuses)]);
    exit();
}

$order_id = (int)$data['order_id'];
$status = $data['status'];

try {
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $order_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["message" => "Order status updated to $status."]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Order not found or status unchanged."]);
    }
} catch (PDOException $e) {
    error_log("Failed to update order status: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>
