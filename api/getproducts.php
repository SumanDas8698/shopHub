<?php
// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once "db.php";

try {
    $sql = "
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
    ";
    $params = [];

    // Optional category filter: ?category=electronics
    if (!empty($_GET['category'])) {
        $sql .= " AND c.slug = ?";
        $params[] = trim($_GET['category']);
    }

    // Optional search filter: ?q=headphones
    if (!empty($_GET['q'])) {
        $sql .= " AND (p.name LIKE ? OR p.description LIKE ?)";
        $like = "%" . trim($_GET['q']) . "%";
        $params[] = $like;
        $params[] = $like;
    }

    $sql .= " ORDER BY p.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast numeric fields so Angular doesn't have to guess types from strings
    foreach ($products as &$p) {
        $p['price'] = (float)$p['price'];
        $p['mrp'] = $p['mrp'] !== null ? (float)$p['mrp'] : null;
        $p['stock'] = (int)$p['stock'];
        $p['rating'] = (float)$p['rating'];
        $p['rating_count'] = (int)$p['rating_count'];
    }

    echo json_encode($products);

} catch (PDOException $e) {
    error_log("Failed to fetch products: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>
