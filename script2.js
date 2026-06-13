// =============================================
//  BlueWave Market - script.js
//  Connected to PHP + MySQL backend via api.php
// =============================================

const API = 'api.php';          // Path to the backend API
let currentUser = null;         // { user_id, username }
let cart = [];

// ========== HELPERS ==========

async function apiCall(action, data = {}) {
    const res = await fetch(`${API}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

// ========== LOGIN / SIGNUP ==========

document.getElementById('showSignup').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
});

document.getElementById('showLogin').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const result = await apiCall('login', { username, password });

    if (result.success) {
        currentUser = { user_id: result.user_id, username: result.username };
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainSite').classList.remove('hidden');
        loadProducts();   // Load products from DB after login
    } else {
        alert(result.message || 'Invalid credentials.');
    }
});

document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const email    = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    const result = await apiCall('signup', { username, email, password });

    if (result.success) {
        alert(result.message);
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').value = '';
    } else {
        alert(result.message || 'Signup failed. Please try again.');
    }
});

document.getElementById('logoutBtn').addEventListener('click', async function() {
    await apiCall('logout');
    currentUser = null;
    cart = [];
    updateCartUI();
    document.getElementById('mainSite').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
});

// ========== LOAD PRODUCTS FROM DATABASE ==========

async function loadProducts() {
    const result = await apiCall('get_products');
    if (!result.success) return;

    const grid = document.querySelector('.product-grid');
    grid.innerHTML = '';   // Clear static HTML products

    result.products.forEach(p => {
        const maxQty = p.stock > 0 ? Math.min(p.stock, 20) : 0;
        const outOfStock = p.stock === 0;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.name  = p.name;
        card.dataset.price = p.price;
        card.dataset.id    = p.id;

        card.innerHTML = `
            <img src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'">
            <h3>${p.name}</h3>
            <p class="price">OMR ${parseFloat(p.price).toFixed(3)}/kg</p>
            ${p.description ? `<p style="font-size:13px;color:#777;padding:0 15px;">${p.description}</p>` : ''}
            <p style="font-size:12px;color:${p.stock > 5 ? '#2ecc71' : p.stock > 0 ? '#f39c12' : '#e63946'};padding:5px 0;">
                ${p.stock > 0 ? `In stock: ${p.stock}` : 'Out of stock'}
            </p>
            <div class="quantity-selector">
                <label>Pieces:</label>
                <input type="number" class="qty-input" value="1" min="1" max="${maxQty}" ${outOfStock ? 'disabled' : ''}>
            </div>
            <button class="btn-buy add-to-cart" ${outOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
        `;

        grid.appendChild(card);
    });

    // Re-bind cart buttons after dynamic load
    bindCartButtons();
}

// ========== CART SYSTEM ==========

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').textContent = count;
}

function bindCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', function() {
            const card  = this.closest('.product-card');
            const name  = card.dataset.name;
            const price = parseFloat(card.dataset.price);
            const qty   = parseInt(card.querySelector('.qty-input').value) || 1;

            const existing = cart.find(item => item.name === name);
            if (existing) {
                existing.qty += qty;
            } else {
                cart.push({ name, price, qty });
            }
            updateCartUI();
            alert(`${name} x${qty} added to cart!`);
        });
    });
}

// Cart Modal
document.getElementById('cartBtn').addEventListener('click', function(e) {
    e.preventDefault();
    renderCartModal();
    document.getElementById('cartModal').classList.remove('hidden');
});

document.getElementById('closeCart').addEventListener('click', function() {
    document.getElementById('cartModal').classList.add('hidden');
});

function renderCartModal() {
    const container = document.getElementById('cartItems');
    const summary   = document.getElementById('cartSummary');

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        summary.classList.add('hidden');
        return;
    }

    summary.classList.remove('hidden');
    let html  = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        html += `
            <div class="cart-item">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <span class="item-price">OMR ${item.price.toFixed(3)}/kg</span>
                </div>
                <div class="item-qty">
                    <button class="qty-minus" data-index="${index}">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-plus" data-index="${index}">+</button>
                </div>
                <span style="font-weight:bold;margin:0 15px;">OMR ${itemTotal.toFixed(3)}</span>
                <i class="fas fa-trash remove-item" data-index="${index}"></i>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('cartTotal').textContent = `OMR ${total.toFixed(3)}`;

    container.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            if (cart[idx].qty > 1) { cart[idx].qty--; updateCartUI(); renderCartModal(); }
        });
    });

    container.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            cart[idx].qty++; updateCartUI(); renderCartModal();
        });
    });

    container.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            cart.splice(idx, 1); updateCartUI(); renderCartModal();
        });
    });
}

// ========== CHECKOUT ==========

document.getElementById('checkoutBtn').addEventListener('click', function() {
    if (cart.length === 0) { alert('Your cart is empty!'); return; }
    renderCheckoutModal();
    document.getElementById('cartModal').classList.add('hidden');
    document.getElementById('checkoutModal').classList.remove('hidden');
});

document.getElementById('closeCheckout').addEventListener('click', function() {
    document.getElementById('checkoutModal').classList.add('hidden');
});

function renderCheckoutModal() {
    const container = document.getElementById('checkoutItems');
    let html  = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        html += `
            <div class="checkout-item">
                <span>${item.name} x${item.qty}</span>
                <span>OMR ${itemTotal.toFixed(3)}</span>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('checkoutTotal').textContent = `OMR ${total.toFixed(3)}`;
}

// Show/hide bank transfer details
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const details = document.getElementById('transferDetails');
        this.value === 'transfer'
            ? details.classList.remove('hidden')
            : details.classList.add('hidden');
    });
});

// Place Order â saves to MySQL via API
document.getElementById('placeOrderBtn').addEventListener('click', async function() {
    const address = document.getElementById('deliveryAddress').value.trim();
    const phone   = document.getElementById('deliveryPhone').value.trim();

    if (!address || !phone) {
        alert('Please enter your delivery address and phone number.');
        return;
    }

    const payment = document.querySelector('input[name="payment"]:checked').value;
    const total   = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const result = await apiCall('place_order', {
        user_id: currentUser ? currentUser.user_id : null,
        items:   cart,
        total:   total.toFixed(3),
        payment,
        address,
        phone
    });

    if (!result.success) {
        alert(result.message || 'Failed to place order. Please try again.');
        return;
    }

    // Show confirmation
    document.getElementById('orderRef').textContent = result.ref;
    cart = [];
    updateCartUI();

    document.getElementById('checkoutModal').classList.add('hidden');
    document.getElementById('confirmModal').classList.remove('hidden');
});

document.getElementById('continueShopping').addEventListener('click', function() {
    document.getElementById('confirmModal').classList.add('hidden');
    document.getElementById('deliveryAddress').value = '';
    document.getElementById('deliveryPhone').value   = '';
});

// ========== ORDER TRACKING ==========

function generateTrackingData(orderDate, dbStatus) {
    const orderTime = new Date(orderDate);
    const now       = new Date();

    const statuses = [
        { status: 'Order Placed',    time: orderTime,                                    icon: 'fa-check-circle' },
        { status: 'Processing',      time: new Date(orderTime.getTime() + 15 * 60000),   icon: 'fa-sync-alt'     },
        { status: 'Out for Delivery',time: new Date(orderTime.getTime() + 45 * 60000),   icon: 'fa-truck'        },
        { status: 'Delivered',       time: new Date(orderTime.getTime() + 120 * 60000),  icon: 'fa-home'         }
    ];

    // Map DB status to step index
    const statusMap = { pending: 0, processing: 1, shipped: 2, delivered: 3 };
    let currentStatusIndex = statusMap[dbStatus] ?? 0;

    // Also advance by time if DB status hasn't been manually updated
    if (dbStatus === 'pending') {
        for (let i = statuses.length - 1; i >= 0; i--) {
            if (now >= statuses[i].time) { currentStatusIndex = i; break; }
        }
    }

    const estimatedDelivery = new Date(orderTime.getTime() + 120 * 60000);
    const estimatedStr = estimatedDelivery.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const timeline = [];
    for (let i = 0; i < statuses.length; i++) {
        const s       = statuses[i];
        const timeStr = s.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const isFuture = i > currentStatusIndex;
        timeline.push({ time: timeStr, event: s.status + (isFuture ? ' (estimated)' : ''), active: i === currentStatusIndex, future: isFuture });
    }

    return { currentStatusIndex, statuses, estimatedDelivery: estimatedStr, timeline };
}

document.getElementById('trackBtn').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('trackModal').classList.remove('hidden');
    document.getElementById('trackResult').classList.add('hidden');
    document.getElementById('trackError').classList.add('hidden');
    document.getElementById('trackOrderRef').value = '';
});

document.getElementById('closeTrack').addEventListener('click', function() {
    document.getElementById('trackModal').classList.add('hidden');
});

document.getElementById('trackOrderBtn').addEventListener('click', async function() {
    const ref = document.getElementById('trackOrderRef').value.trim();
    if (!ref) { alert('Please enter an order reference number.'); return; }

    const result = await apiCall('track_order', { ref });

    if (!result.success) {
        document.getElementById('trackResult').classList.add('hidden');
        document.getElementById('trackError').classList.remove('hidden');
        document.getElementById('trackError').textContent = result.message || 'Order not found.';
        return;
    }

    document.getElementById('trackError').classList.add('hidden');

    const order   = result.order;
    const tracking = generateTrackingData(order.created_at, order.status);

    document.getElementById('trackRefDisplay').textContent  = order.ref;
    document.getElementById('trackAddress').textContent     = order.delivery_address;

    // Update status bar
    const steps = document.querySelectorAll('.status-step');
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed', 'inactive');
        if      (index < tracking.currentStatusIndex) step.classList.add('completed');
        else if (index === tracking.currentStatusIndex) step.classList.add('active');
        else    step.classList.add('inactive');
    });

    document.getElementById('trackStatusDisplay').textContent =
        tracking.statuses[tracking.currentStatusIndex].status;

    document.getElementById('trackDeliveryTime').textContent =
        tracking.currentStatusIndex < 3 ? `Today by ${tracking.estimatedDelivery}` : 'Delivered';

    // Timeline
    const timelineContainer = document.getElementById('trackTimeline');
    timelineContainer.innerHTML = tracking.timeline.map(item => `
        <div class="timeline-item ${item.active ? 'active' : ''} ${item.future ? 'future' : ''}">
            <span class="time">${item.time}</span>
            <span class="event">${item.event}</span>
        </div>
    `).join('');

    document.getElementById('trackResult').classList.remove('hidden');
});

document.getElementById('trackOrderRef').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') document.getElementById('trackOrderBtn').click();
});

// Close modals by clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});