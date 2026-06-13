<?php
// =============================================
//  BlueWave Market - Database Configuration
//  Edit these values to match your server
// =============================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'fish_market');   // Change to your database name
define('DB_USER', 'root');          // Change to your MySQL username
define('DB_PASS', '');              // Change to your MySQL password

function getDB() {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }
}