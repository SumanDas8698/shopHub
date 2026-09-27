<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db.php";

try {
    // --- Summary stat cards ---
    $totalRevenue = (float)$pdo->query("
        SELECT COALESCE(SUM(total_amount), 0) AS v FROM orders WHERE status != 'Cancelled'
    ")->fetch()['v'];

    $totalOrders = (int)$pdo->query("SELECT COUNT(*) AS v FROM orders")->fetch()['v'];
    $totalProducts = (int)$pdo->query("SELECT COUNT(*) AS v FROM products")->fetch()['v'];
    $totalUsers = (int)$pdo->query("SELECT COUNT(*) AS v FROM users")->fetch()['v'];

    $pendingOrders = (int)$pdo->query("
        SELECT COUNT(*) AS v FROM orders WHERE status IN ('Placed', 'Processing')
    ")->fetch()['v'];

    $lowStockCount = (int)$pdo->query("
        SELECT COUNT(*) AS v FROM products WHERE stock <= 5
    ")->fetch()['v'];

    // --- Sales over the last 14 days (for line/bar chart) ---
    $salesStmt = $pdo->query("
        SELECT DATE(created_at) AS day, SUM(total_amount) AS total
        FROM orders
        WHERE status != 'Cancelled' AND created_at >= (CURDATE() - INTERVAL 13 DAY)
        GROUP BY DATE(created_at)
        ORDER BY day ASC
    ");
    $salesRaw = $salesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fill in missing days with 0 so the chart has a continuous 14-day axis
    $salesByDay = [];
    for ($i = 13; $i >= 0; $i--) {
        $day = date('Y-m-d', strtotime("-$i day"));
        $salesByDay[$day] = 0.0;
    }
    foreach ($salesRaw as $row) {
        $salesByDay[$row['day']] = (float)$row['total'];
    }

    $salesOverTime = [];
    foreach ($salesByDay as $day => $total) {
        $salesOverTime[] = ['date' => $day, 'total' => $total];
    }

    // --- Top 5 products by quantity sold ---
    $topProductsStmt = $pdo->query("
        SELECT product_name, SUM(quantity) AS total_sold, SUM(price * quantity) AS revenue
        FROM order_items
        GROUP BY product_name
        ORDER BY total_sold DESC
        LIMIT 5
    ");
    $topProducts = $topProductsStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($topProducts as &$tp) {
        $tp['total_sold'] = (int)$tp['total_sold'];
        $tp['revenue'] = (float)$tp['revenue'];
    }

    // --- Order status breakdown (for pie/doughnut chart) ---
    $statusStmt = $pdo->query("
        SELECT status, COUNT(*) AS count FROM orders GROUP BY status
    ");
    $statusBreakdownRaw = $statusStmt->fetchAll(PDO::FETCH_ASSOC);

    // Ensure every status is represented even if count is 0
    $allStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    $statusCounts = array_fill_keys($allStatuses, 0);
    foreach ($statusBreakdownRaw as $row) {
        $statusCounts[$row['status']] = (int)$row['count'];
    }
    $statusBreakdown = [];
    foreach ($statusCounts as $status => $count) {
        $statusBreakdown[] = ['status' => $status, 'count' => $count];
    }

    echo json_encode([
        "summary" => [
            "total_revenue" => $totalRevenue,
            "total_orders" => $totalOrders,
            "total_products" => $totalProducts,
            "total_users" => $totalUsers,
            "pending_orders" => $pendingOrders,
            "low_stock_count" => $lowStockCount,
        ],
        "sales_over_time" => $salesOverTime,
        "top_products" => $topProducts,
        "status_breakdown" => $statusBreakdown,
    ]);

} catch (PDOException $e) {
    error_log("Failed to fetch dashboard stats: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "An internal server error occurred."]);
}
?>
