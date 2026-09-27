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

if ($data === null || !isset($data['id']) || !is_numeric($data['id']) || !isset($data['quantity'])) {
    http_response_code(400);
    echo json_encode(["error" => "Cart item 'id' and 'quantity' are required."]);
    exit();
}

$id = (int)$data['id'];
$quantity = (int)$data['quantity'];

if ($quantity < 1) {
    http_response_code(400);
    echo json_encode(["error" => "Quantity must be at least 1. To remove the item, use removefromcart instead."]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
    $stmt->execute([$quantity, $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["message" => "Quantity updated."]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Cart item not found."]);
    }
} catch (PDOException $e) {
    error_log("Failed to update cart quantity: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>
