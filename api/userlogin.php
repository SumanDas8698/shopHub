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

// Include database connection
require_once "db.php";

// Get JSON data from the request body
$data = json_decode(file_get_contents('php://input'), true);

// Check if data is valid and required fields are present
if ($data === null || !isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["error" => "Invalid JSON data or missing fields."]);
    http_response_code(400); // Bad Request
    exit();
}

// Trim whitespace from inputs
$email = trim($data["email"]);
$password = trim($data["password"]);

try {
    // Prepare the SQL statement to select the user by email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC); // Use FETCH_ASSOC for cleaner array keys

    // Verify user existence and password
    if ($user && password_verify($password, $user["password"])) {
        // Remove password from the user object before sending it to the client
        unset($user['password']);

        // Login successful
        echo json_encode(["message" => "Login successful.", "user" => $user]);
    } else {
        // Invalid credentials
        echo json_encode(["error" => "Invalid credentials."]);
    }

} catch (PDOException $e) {
    // Log the detailed error for debugging purposes
    error_log("Login failed: " . $e->getMessage());

    // Send a generic error message to the client
    echo json_encode(["error" => "An internal server error occurred. Please try again later."]);
    http_response_code(500); // Internal Server Error
}