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
$data = json_decode(file_get_contents("php://input"), true);

// Check if data is valid and required fields are present
if ($data === null) {
    echo json_encode(["error" => "Invalid JSON data received."]);
    http_response_code(400); // Bad Request
    exit();
}

// Use a cleaner way to get data and trim whitespace
$name = trim($data["name"] ?? '');
$email = trim($data["email"] ?? '');
$password = trim($data["password"] ?? '');
$address = trim($data["address"] ?? '');

// Basic validation
if (empty($name) || empty($email) || empty($password)) {
    echo json_encode(["error" => "Name, email, and password are required."]);
    http_response_code(400); // Bad Request
    exit();
}

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

try {
    // Prepare the SQL statement
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, address) VALUES (?, ?, ?, ?)");

    // Execute the statement
    $stmt->execute([$name, $email, $hashedPassword, $address]);

    // Send success response
    echo json_encode(["message" => "User registered successfully."]);

} catch (PDOException $e) {
    // Log the detailed error for debugging purposes
    error_log("Registration failed: " . $e->getMessage());

    // Send a generic error message to the client
    echo json_encode(["error" => "Registration failed. Please try again later."]);
    
    // Optionally, set a server error status code
    http_response_code(500);
}