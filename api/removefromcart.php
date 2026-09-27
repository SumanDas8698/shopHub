<?php
// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS, DELETE"); // Added DELETE method
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once "db.php";

// Get JSON data from the request body
$data = json_decode(file_get_contents("php://input"), true);

// Validate input data
if ($data === null || !isset($data['id']) || !is_numeric($data['id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "Invalid or missing 'id' in the request."]);
    exit();
}

// Sanitize the ID
$id = (int)$data['id'];

try {
    // Prepare the SQL statement
    $stmt = $pdo->prepare("DELETE FROM cart_items WHERE id = ?");

    // Execute the statement with the sanitized ID
    $stmt->execute([$id]);

    // Check if any row was affected
    if ($stmt->rowCount() > 0) {
        http_response_code(200); // OK
        echo json_encode(["message" => "Item removed from cart successfully."]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(["message" => "Item not found in cart."]);
    }

} catch (PDOException $e) {
    // Log the detailed error for debugging purposes
    error_log("Database error: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>