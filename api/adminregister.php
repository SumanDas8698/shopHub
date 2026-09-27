<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

// Basic validation: ensure all keys exist and are not empty
if (!isset($data["username"]) || !isset($data["email"]) || !isset($data["password"]) || empty($data["username"]) || empty($data["email"]) || empty($data["password"])) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "Username, email, and password are required."]);
    exit();
}

$username = $data["username"];
$email = $data["email"];
// Corrected the key from "password " to "password"
$password = password_hash($data["password"], PASSWORD_BCRYPT);

$stmt = $pdo->prepare("INSERT INTO admins (username, email, password) VALUES (?, ?, ?)");

try {
    $stmt->execute([$username, $email, $password]);
    http_response_code(201); // Created
    // Corrected the key from "message " to "message"
    echo json_encode(["message" => "Admin registered successfully"]);
} catch (PDOException $e) {
    // Improved error handling
    if ($e->getCode() == 23000) { // SQLSTATE 23000 is an integrity constraint violation (e.g., duplicate entry)
        http_response_code(409); // Conflict
        echo json_encode(["error" => "An account with this email already exists."]);
    } else {
        http_response_code(500); // Internal Server Error
        // Don't expose detailed database errors to the client for security reasons
        echo json_encode(["error" => "Registration failed due to a server error."]);
    }
}
?>