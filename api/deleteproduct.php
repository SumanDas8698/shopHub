<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if ($data === null || !isset($data['id']) || !is_numeric($data['id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing product 'id'."]);
    exit();
}

$id = (int)$data['id'];

try {
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["message" => "Product deleted successfully."]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Product not found."]);
    }
} catch (PDOException $e) {
    error_log("Failed to delete product: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>
