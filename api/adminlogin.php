<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Use require_once for critical files like a database connection.
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

// Basic validation: ensure email and password keys exist
if (!isset($data["email"]) || !isset($data["password"])) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "Email and password are required."]);
    exit();
}

$email = $data["email"];
$password = $data["password"];

$stmt = $pdo->prepare("SELECT * FROM admins WHERE email = ?");
$stmt->execute([$email]);
$admin = $stmt->fetch();

if ($admin && password_verify($password, $admin["password"])) {
    // Security improvement: Do NOT send the password hash back to the client.
    unset($admin['password']);

    http_response_code(200); // OK
    echo json_encode(["message" => "Login successful", "admin" => $admin]);
} else {
    http_response_code(401); // Unauthorized
    // Corrected the key from "error " to "error"
    echo json_encode(["error" => "Invalid credentials"]);
}
?>