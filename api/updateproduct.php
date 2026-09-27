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

if (
    $data === null ||
    !isset($data['id']) || !is_numeric($data['id']) ||
    empty($data['name']) ||
    !isset($data['price'])
) {
    http_response_code(400);
    echo json_encode(["error" => "Product id, name, and price are required."]);
    exit();
}

$id = (int)$data['id'];
$name = htmlspecialchars(trim($data['name']));
$description = htmlspecialchars(trim($data['description'] ?? ''));
$price = filter_var($data['price'], FILTER_VALIDATE_FLOAT);
$mrp = isset($data['mrp']) && $data['mrp'] !== '' && $data['mrp'] !== null
    ? filter_var($data['mrp'], FILTER_VALIDATE_FLOAT) : null;
$stock = isset($data['stock']) ? filter_var($data['stock'], FILTER_VALIDATE_INT) : 0;
$category_id = isset($data['category_id']) && $data['category_id'] !== '' && $data['category_id'] !== null
    ? filter_var($data['category_id'], FILTER_VALIDATE_INT) : null;

if ($price === false) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid price."]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        UPDATE products
        SET name = ?, description = ?, price = ?, mrp = ?, stock = ?, category_id = ?
        WHERE id = ?
    ");
    $stmt->execute([$name, $description, $price, $mrp, $stock, $category_id, $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["message" => "Product updated successfully."]);
    } else {
        echo json_encode(["message" => "No changes made (values were identical or product not found)."]);
    }
} catch (PDOException $e) {
    error_log("Failed to update product: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>
