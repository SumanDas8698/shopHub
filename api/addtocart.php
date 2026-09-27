<?php
// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection file
require_once "db.php";

// Get and decode the JSON data from the request body
$data = json_decode(file_get_contents("php://input"), true);

// Validate and sanitize the input data
if ($data === null || !isset($data['user_id']) || !isset($data['product_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "Invalid JSON data or missing fields."]);
    exit();
}

// Trim whitespace from keys and values to avoid "Undefined index" errors
$user_id = trim($data['user_id']);
$product_id = trim($data['product_id']);
$quantity = isset($data['quantity']) ? (int)$data['quantity'] : 1;

try {
    // Prepare the SQL statement for adding to cart
    $stmt = $pdo->prepare("
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + ?
    ");

    // Execute the statement
    $stmt->execute([$user_id, $product_id, $quantity, $quantity]);

    // Check if a new row was inserted or an existing row was updated
    if ($stmt->rowCount() > 0) {
        echo json_encode(["message" => "Added to cart successfully."]);
    } else {
        echo json_encode(["message" => "Item already in cart, quantity updated."]);
    }

} catch (PDOException $e) {
    // Log the detailed error for debugging
    error_log("Failed to add to cart: " . $e->getMessage());

    // Send a generic error message to the frontend for security
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>