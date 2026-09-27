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

$required = ['user_id', 'full_name', 'phone', 'address_line', 'city', 'state', 'pincode'];
foreach ($required as $field) {
    if ($data === null || empty($data[$field])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required field: $field"]);
        exit();
    }
}

$user_id = (int)$data['user_id'];
$full_name = htmlspecialchars(trim($data['full_name']));
$phone = htmlspecialchars(trim($data['phone']));
$address_line = htmlspecialchars(trim($data['address_line']));
$city = htmlspecialchars(trim($data['city']));
$state = htmlspecialchars(trim($data['state']));
$pincode = htmlspecialchars(trim($data['pincode']));
$payment_method = in_array($data['payment_method'] ?? 'COD', ['COD', 'Card', 'UPI'], true)
    ? $data['payment_method'] : 'COD';

try {
    $pdo->beginTransaction();

    // Pull the user's current cart with live product prices/stock
    $stmt = $pdo->prepare("
        SELECT ci.product_id, ci.quantity, p.name AS product_name, p.price, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($cartItems) === 0) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["error" => "Your cart is empty."]);
        exit();
    }

    // Verify stock availability before committing to the order
    foreach ($cartItems as $item) {
        if ((int)$item['quantity'] > (int)$item['stock']) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(["error" => "\"{$item['product_name']}\" only has {$item['stock']} left in stock."]);
            exit();
        }
    }

    // Calculate total
    $total = 0;
    foreach ($cartItems as $item) {
        $total += $item['price'] * $item['quantity'];
    }

    // Create the order
    $orderStmt = $pdo->prepare("
        INSERT INTO orders (user_id, total_amount, payment_method, status, full_name, phone, address_line, city, state, pincode)
        VALUES (?, ?, ?, 'Placed', ?, ?, ?, ?, ?, ?)
    ");
    $orderStmt->execute([$user_id, $total, $payment_method, $full_name, $phone, $address_line, $city, $state, $pincode]);
    $orderId = $pdo->lastInsertId();

    // Create order_items and decrement stock
    $itemStmt = $pdo->prepare("
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stockStmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    foreach ($cartItems as $item) {
        $itemStmt->execute([$orderId, $item['product_id'], $item['product_name'], $item['price'], $item['quantity']]);
        $stockStmt->execute([$item['quantity'], $item['product_id']]);
    }

    // Clear the user's cart
    $clearStmt = $pdo->prepare("DELETE FROM cart_items WHERE user_id = ?");
    $clearStmt->execute([$user_id]);

    $pdo->commit();

    http_response_code(201);
    echo json_encode([
        "message" => "Order placed successfully.",
        "order_id" => $orderId,
        "total_amount" => $total
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Failed to place order: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred while placing your order."]);
}
?>
