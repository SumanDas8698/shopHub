<?php
// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS"); // Added OPTIONS for preflight requests
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once "db.php";

// Validate and sanitize the user ID
if (!isset($_GET['user_id']) || !is_numeric($_GET['user_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "Invalid or missing 'user_id' parameter."]);
    exit();
}

$user_id = (int)$_GET['user_id'];

try {
    // Prepare the SQL query with a JOIN, including stock for client-side quantity validation
    $stmt = $pdo->prepare("
        SELECT 
            ci.*, 
            p.name, 
            p.price, 
            p.image_url,
            p.stock
        FROM cart_items ci 
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    ");

    // Execute the statement with the sanitized user ID
    $stmt->execute([$user_id]);

    // Fetch all results as an associative array
    $cart = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast numeric fields for correct frontend arithmetic
    foreach ($cart as &$item) {
        $item['price'] = (float)$item['price'];
        $item['quantity'] = (int)$item['quantity'];
        $item['stock'] = (int)$item['stock'];
    }

    // Encode the cart array to JSON and send the response
    http_response_code(200); // OK
    echo json_encode($cart);

} catch (PDOException $e) {
    // Log the detailed error for debugging
    error_log("Failed to fetch cart items: " . $e->getMessage());

    // Send a generic error message and an HTTP 500 status code
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>