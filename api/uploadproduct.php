<?php
// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, enctype");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once "db.php";

// Check for file and other required POST data
if (
    empty($_FILES['image']) ||
    empty($_POST['name']) ||
    empty($_POST['description']) ||
    empty($_POST['price']) ||
    empty($_POST['admin_id'])
) {
    http_response_code(400);
    echo json_encode(["error" => "Required data is missing."]);
    exit();
}

try {
    // Sanitize and validate inputs
    $name = htmlspecialchars(trim($_POST["name"]));
    $description = htmlspecialchars(trim($_POST["description"]));
    $price = filter_var($_POST["price"], FILTER_VALIDATE_FLOAT);
    $admin_id = filter_var($_POST["admin_id"], FILTER_VALIDATE_INT);
    $mrp = isset($_POST['mrp']) && $_POST['mrp'] !== '' ? filter_var($_POST['mrp'], FILTER_VALIDATE_FLOAT) : null;
    $stock = isset($_POST['stock']) ? filter_var($_POST['stock'], FILTER_VALIDATE_INT) : 0;
    $category_id = isset($_POST['category_id']) && $_POST['category_id'] !== '' ? filter_var($_POST['category_id'], FILTER_VALIDATE_INT) : null;

    // Validate filtered inputs
    if ($price === false || $admin_id === false) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid price or admin ID."]);
        exit();
    }
    if ($stock === false) {
        $stock = 0;
    }

    // Handle file upload
    $target_dir = "../uploads/";
    if (!is_dir($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    // Generate a unique filename to avoid collisions / overwrites
    $original_name = basename($_FILES["image"]["name"]);
    $ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    $safe_base = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($original_name, PATHINFO_FILENAME));
    $image_name = $safe_base . '_' . uniqid() . '.' . $ext;
    $target_file = $target_dir . $image_name;

    // Check if the file is an actual image
    $check = getimagesize($_FILES["image"]["tmp_name"]);
    if ($check === false) {
        http_response_code(400);
        echo json_encode(["error" => "File is not an image."]);
        exit();
    }

    // Check file size (5MB limit)
    if ($_FILES["image"]["size"] > 5000000) {
        http_response_code(400);
        echo json_encode(["error" => "Sorry, your file is too large."]);
        exit();
    }

    // Attempt to move the uploaded file
    if (!move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
        http_response_code(500);
        echo json_encode(["error" => "Sorry, there was an error uploading your file."]);
        exit();
    }

    $image_url = "uploads/" . $image_name;

    // Prepare and execute the SQL statement
    $stmt = $pdo->prepare("
        INSERT INTO products (name, description, price, mrp, image_url, admin_id, stock, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$name, $description, $price, $mrp, $image_url, $admin_id, $stock, $category_id]);

    http_response_code(201);
    echo json_encode(['message' => 'Product uploaded successfully.', 'id' => $pdo->lastInsertId()]);

} catch (PDOException $e) {
    error_log("Product upload failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);

} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An unexpected error occurred."]);
}
