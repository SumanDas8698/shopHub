-- ============================================================
--  ECOMMERCE PROJECT — DATABASE SCHEMA
--  Run this entire file once on a fresh MySQL database named
--  `ecommerce_db` (or update api/db.php to match your db name).
-- ============================================================

CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

-- ------------------------------------------------------------
-- ADMINS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,   -- bcrypt hash
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- USERS (customers)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,   -- bcrypt hash
    address     TEXT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CATEGORIES (new — used for navbar category strip + filters)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO categories (name, slug) VALUES
    ('Electronics', 'electronics'),
    ('Fashion', 'fashion'),
    ('Home & Kitchen', 'home-kitchen'),
    ('Books', 'books'),
    ('Beauty', 'beauty'),
    ('Sports', 'sports'),
    ('Toys', 'toys'),
    ('Grocery', 'grocery')
ON DUPLICATE KEY UPDATE name = name;

-- ------------------------------------------------------------
-- PRODUCTS  (extended with stock, category, rating for a real
-- marketplace listing — existing columns kept for compatibility)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    description  TEXT NULL,
    price        DECIMAL(10,2) NOT NULL DEFAULT 0,
    mrp          DECIMAL(10,2) NULL,              -- original price, for "discount" display
    image_url    VARCHAR(255) NULL,
    category_id  INT NULL,
    stock        INT NOT NULL DEFAULT 0,
    rating       DECIMAL(2,1) NOT NULL DEFAULT 4.0,
    rating_count INT NOT NULL DEFAULT 0,
    admin_id     INT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CART ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDERS (new — checkout flow)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method  ENUM('COD','Card','UPI') NOT NULL DEFAULT 'COD',
    status          ENUM('Placed','Processing','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Placed',
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    address_line    VARCHAR(255) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pincode         VARCHAR(12) NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDER ITEMS (new — line items per order, snapshot of price
-- at time of purchase so later price changes don't rewrite history)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    order_id     INT NOT NULL,
    product_id   INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    price        DECIMAL(10,2) NOT NULL,
    quantity     INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Seed a couple of sample products so the storefront isn't
-- empty on first run (safe to delete later from admin panel)
-- ------------------------------------------------------------
INSERT INTO products (name, description, price, mrp, image_url, category_id, stock, rating, rating_count)
SELECT * FROM (SELECT
    'Wireless Bluetooth Headphones' AS name,
    'Over-ear wireless headphones with active noise cancellation and 30-hour battery life.' AS description,
    1499.00 AS price, 2999.00 AS mrp,
    'uploads/-original-imahf69gvypszzyz.jpeg' AS image_url,
    (SELECT id FROM categories WHERE slug = 'electronics') AS category_id,
    50 AS stock, 4.3 AS rating, 128 AS rating_count
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Wireless Bluetooth Headphones');

INSERT INTO products (name, description, price, mrp, image_url, category_id, stock, rating, rating_count)
SELECT * FROM (SELECT
    'Men''s Running Shoes' AS name,
    'Lightweight breathable running shoes with cushioned sole for all-day comfort.' AS description,
    1299.00 AS price, 2499.00 AS mrp,
    'uploads/-original-imahfusbkmdvh3vz.jpeg' AS image_url,
    (SELECT id FROM categories WHERE slug = 'fashion') AS category_id,
    80 AS stock, 4.1 AS rating, 64 AS rating_count
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Men''s Running Shoes');
