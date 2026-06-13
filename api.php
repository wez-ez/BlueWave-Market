<?php
// =============================================
//  BlueWave Market - Backend API
//  Handles: login, signup, products, orders, tracking
// =============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once 'db.php';

// Start session for login state
session_start();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Parse JSON body if sent as application/json
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {

    // ---- LOGIN ----
    case 'login':
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        if (!$username || !$password) {
            echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
            break;
        }

        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id']  = $user['id'];
            $_SESSION['username'] = $user['username'];
            echo json_encode(['success' => true, 'username' => $user['username'], 'user_id' => $user['id']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
        }
        break;

    // ---- SIGNUP ----
    case 'signup':
        $username = trim($input['username'] ?? '');
        $email    = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (!$username || !$email || !$password) {
            echo json_encode(['success' => false, 'message' => 'All fields are required.']);
            break;
        }

        $pdo = getDB();

        // Check if username already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Username already exists. Please choose another.']);
            break;
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $hashed]);

        echo json_encode(['success' => true, 'message' => 'Account created successfully! You can now login.']);
        break;

    // ---- GET PRODUCTS ----
    case 'get_products':
        $pdo  = getDB();
        $stmt = $pdo->query("SELECT id, name, price, image_url, description, stock FROM products ORDER BY id ASC");
        $products = $stmt->fetchAll();
        echo json_encode(['success' => true, 'products' => $products]);
        break;

    // ---- PLACE ORDER ----
    case 'place_order':
        $user_id = $input['user_id'] ?? null;
        $items   = $input['items']   ?? [];
        $total   = $input['total']   ?? 0;
        $payment = $input['payment'] ?? '';
        $address = trim($input['address'] ?? '');
        $phone   = trim($input['phone']   ?? '');

        if (!$items || !$address || !$phone) {
            echo json_encode(['success' => false, 'message' => 'Missing required order information.']);
            break;
        }

        $pdo = getDB();

        // Generate reference like BW-12345678
        $ref = 'BW-' . strtoupper(substr(uniqid(), -8));

        // Insert order
        $stmt = $pdo->prepare(
            "INSERT INTO orders (user_id, total, status, payment_method, delivery_address, delivery_phone, ref, created_at)
             VALUES (?, ?, 'pending', ?, ?, ?, ?, NOW())"
        );
        $stmt->execute([$user_id, $total, $payment, $address, $phone, $ref]);
        $order_id = $pdo->lastInsertId();

        // Insert order items
        $itemStmt = $pdo->prepare(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)"
        );

        foreach ($items as $item) {
            // Find product by name (since frontend sends name)
            $pStmt = $pdo->prepare("SELECT id, stock FROM products WHERE name = ?");
            $pStmt->execute([$item['name']]);
            $product = $pStmt->fetch();

            if ($product) {
                $itemStmt->execute([$order_id, $product['id'], $item['qty'], $item['price']]);

                // Reduce stock
                $newStock = max(0, $product['stock'] - $item['qty']);
                $pdo->prepare("UPDATE products SET stock = ? WHERE id = ?")->execute([$newStock, $product['id']]);
            }
        }

        echo json_encode(['success' => true, 'ref' => $ref, 'order_id' => $order_id]);
        break;

    // ---- TRACK ORDER ----
    case 'track_order':
        $ref = trim($input['ref'] ?? $_GET['ref'] ?? '');

        if (!$ref) {
            echo json_encode(['success' => false, 'message' => 'Order reference is required.']);
            break;
        }

        $pdo  = getDB();
        $stmt = $pdo->prepare(
            "SELECT o.id, o.ref, o.status, o.total, o.delivery_address, o.delivery_phone,
                    o.payment_method, o.created_at
             FROM orders o WHERE o.ref = ?"
        );
        $stmt->execute([$ref]);
        $order = $stmt->fetch();

        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'Order not found. Please check your reference number.']);
            break;
        }

        // Get order items
        $iStmt = $pdo->prepare(
            "SELECT oi.quantity, oi.price, p.name
             FROM order_items oi JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?"
        );
        $iStmt->execute([$order['id']]);
        $order['items'] = $iStmt->fetchAll();

        echo json_encode(['success' => true, 'order' => $order]);
        break;

    // ---- LOGOUT ----
    case 'logout':
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}