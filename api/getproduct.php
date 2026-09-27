<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db.php";

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing 'id' parameter."]);
    exit();
}

$id = (int)$_GET['id'];

try {
    $stmt = $pdo->prepare("
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode(["error" => "Product not found."]);
        exit();
    }

    $product['price'] = (float)$product['price'];
    $product['mrp'] = $product['mrp'] !== null ? (float)$product['mrp'] : null;
    $product['stock'] = (int)$product['stock'];
    $product['rating'] = (float)$product['rating'];
    $product['rating_count'] = (int)$product['rating_count'];

    echo json_encode($product);

} catch (PDOException $e) {
    error_log("Failed to fetch product: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>
