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

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const storedUser = localStorage.getItem('user_' + username);
    let valid = false;
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.password === password) valid = true;
    }
    if (username === 'admin' && password === 'admin123') valid = true;
    if (valid) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainSite').classList.remove('hidden');
    } else {
        alert('Invalid credentials. Try admin/admin123 or create an account.');
    }
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    if (localStorage.getItem('user_' + username)) {
        alert('Username already exists. Please choose another.');
        return;
    }
    localStorage.setItem('user_' + username, JSON.stringify({ username, email, password }));
    alert('Account created successfully! You can now login.');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('loginUsername').value = username;
    document.getElementById('loginPassword').value = '';
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    document.getElementById('mainSite').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
});

// ========== CART SYSTEM ==========
let cart = [];

// Load cart from localStorage
function loadCart() {
    const saved = localStorage.getItem('bluewave_cart');
    if (saved) cart = JSON.parse(saved);
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('bluewave_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').textContent = count;
}

// Add to Cart buttons
document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', function() {
        const card = this.closest('.product-card');
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const qty = parseInt(card.querySelector('.qty-input').value) || 1;
        
        const existing = cart.find(item => item.name === name);
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({ name, price, qty });
        }
        saveCart();
        alert(`${name} x${qty} added to cart!`);
    });
});

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
    const summary = document.getElementById('cartSummary');
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        summary.classList.add('hidden');
        return;
    }
    
    summary.classList.remove('hidden');
    let html = '';
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
    
    // Quantity buttons
    container.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            if (cart[idx].qty > 1) {
                cart[idx].qty--;
                saveCart();
                renderCartModal();
            }
        });
    });
    
    container.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            cart[idx].qty++;
            saveCart();
            renderCartModal();
        });
    });
    
    container.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            cart.splice(idx, 1);
            saveCart();
            renderCartModal();
        });
    });
}

// ========== CHECKOUT ==========
document.getElementById('checkoutBtn').addEventListener('click', function() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    renderCheckoutModal();
    document.getElementById('cartModal').classList.add('hidden');
    document.getElementById('checkoutModal').classList.remove('hidden');
});

document.getElementById('closeCheckout').addEventListener('click', function() {
    document.getElementById('checkoutModal').classList.add('hidden');
});

function renderCheckoutModal() {
    const container = document.getElementById('checkoutItems');
    let html = '';
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

// Show bank transfer details when selected
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const details = document.getElementById('transferDetails');
        if (this.value === 'transfer') {
            details.classList.remove('hidden');
        } else {
            details.classList.add('hidden');
        }
    });
});

// Place Order
document.getElementById('placeOrderBtn').addEventListener('click', function() {
    const address = document.getElementById('deliveryAddress').value.trim();
    const phone = document.getElementById('deliveryPhone').value.trim();
    
    if (!address || !phone) {
        alert('Please enter your delivery address and phone number.');
        return;
    }
    
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Generate order reference
    const ref = 'BW-' + Date.now().toString().slice(-8);
    document.getElementById('orderRef').textContent = ref;
    
    // Save order history (optional)
    const orders = JSON.parse(localStorage.getItem('bluewave_orders') || '[]');
    orders.push({
        ref,
        items: [...cart],
        total,
        payment,
        address,
        phone,
        date: new Date().toISOString()
    });
    localStorage.setItem('bluewave_orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    saveCart();
    
    // Show confirmation
    document.getElementById('checkoutModal').classList.add('hidden');
    document.getElementById('confirmModal').classList.remove('hidden');
});

// Continue shopping
document.getElementById('continueShopping').addEventListener('click', function() {
    document.getElementById('confirmModal').classList.add('hidden');
    document.getElementById('deliveryAddress').value = '';
    document.getElementById('deliveryPhone').value = '';
});

// Close modals by clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// Initialize cart on load
loadCart();


// ========== ORDER TRACKING SYSTEM ==========

// Simulate order status updates with timestamps
function generateTrackingData(orderRef, orderDate) {
    const orderTime = new Date(orderDate);
    const now = new Date();
    
    // Calculate time differences in minutes
    const minutesSinceOrder = Math.floor((now - orderTime) / 60000);
    
    // Define statuses with realistic time windows
    const statuses = [
        { status: 'Order Placed', time: orderTime, icon: 'fa-check-circle' },
        { status: 'Processing', time: new Date(orderTime.getTime() + 15 * 60000), icon: 'fa-sync-alt' },
        { status: 'Out for Delivery', time: new Date(orderTime.getTime() + 45 * 60000), icon: 'fa-truck' },
        { status: 'Delivered', time: new Date(orderTime.getTime() + 120 * 60000), icon: 'fa-home' }
    ];
    
    // Determine current status based on time elapsed
    let currentStatusIndex = 0;
    for (let i = statuses.length - 1; i >= 0; i--) {
        if (now >= statuses[i].time) {
            currentStatusIndex = i;
            break;
        }
    }
    
    // Calculate estimated delivery time
    const estimatedDelivery = new Date(orderTime.getTime() + 120 * 60000);
    const estimatedStr = estimatedDelivery.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Generate timeline events
    const timeline = [];
    for (let i = 0; i <= currentStatusIndex; i++) {
        const s = statuses[i];
        const timeStr = s.time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        timeline.push({
            time: timeStr,
            event: s.status,
            active: i === currentStatusIndex
        });
    }
    
    // Add future estimated events
    if (currentStatusIndex < statuses.length - 1) {
        for (let i = currentStatusIndex + 1; i < statuses.length; i++) {
            const s = statuses[i];
            const timeStr = s.time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            timeline.push({
                time: timeStr,
                event: s.status + ' (estimated)',
                active: false,
                future: true
            });
        }
    }
    
    return {
        currentStatusIndex,
        statuses,
        estimatedDelivery: estimatedStr,
        timeline
    };
}

// Track Order Button
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

document.getElementById('trackOrderBtn').addEventListener('click', function() {
    const ref = document.getElementById('trackOrderRef').value.trim();
    if (!ref) {
        alert('Please enter an order reference number.');
        return;
    }
    
    // Look up order in localStorage
    const orders = JSON.parse(localStorage.getItem('bluewave_orders') || '[]');
    const order = orders.find(o => o.ref === ref);
    
    if (!order) {
        document.getElementById('trackResult').classList.add('hidden');
        document.getElementById('trackError').classList.remove('hidden');
        document.getElementById('trackError').textContent = 'Order not found. Please check your reference number.';
        return;
    }
    
    document.getElementById('trackError').classList.add('hidden');
    
    // Generate tracking data based on order date
    const orderDate = new Date(order.date);
    const tracking = generateTrackingData(ref, orderDate);
    
    // Display order info
    document.getElementById('trackRefDisplay').textContent = ref;
    document.getElementById('trackAddress').textContent = order.address;
    
    // Update status bar
    const steps = document.querySelectorAll('.status-step');
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed', 'inactive');
        if (index < tracking.currentStatusIndex) {
            step.classList.add('completed');
        } else if (index === tracking.currentStatusIndex) {
            step.classList.add('active');
        } else {
            step.classList.add('inactive');
        }
    });
    
    // Set status text
    const statusText = tracking.statuses[tracking.currentStatusIndex].status;
    document.getElementById('trackStatusDisplay').textContent = statusText;
    
    // Set estimated delivery
    if (tracking.currentStatusIndex < 3) {
        document.getElementById('trackDeliveryTime').textContent = `Today by ${tracking.estimatedDelivery}`;
    } else {
        document.getElementById('trackDeliveryTime').textContent = 'Delivered';
    }
    
    // Generate timeline
    const timelineContainer = document.getElementById('trackTimeline');
    let timelineHtml = '';
    tracking.timeline.forEach(item => {
        const activeClass = item.active ? 'active' : '';
        const futureClass = item.future ? 'future' : '';
        timelineHtml += `
            <div class="timeline-item ${activeClass} ${futureClass}">
                <span class="time">${item.time}</span>
                <span class="event">${item.event}</span>
            </div>
        `;
    });
    timelineContainer.innerHTML = timelineHtml;
    
    document.getElementById('trackResult').classList.remove('hidden');
});

// Also allow pressing Enter in the track input
document.getElementById('trackOrderRef').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('trackOrderBtn').click();
    }
});

// Update order saving to include date for tracking
// Modify the place order section to save proper date
const originalPlaceOrder = document.getElementById('placeOrderBtn').click;
document.getElementById('placeOrderBtn').addEventListener('click', function() {
    const address = document.getElementById('deliveryAddress').value.trim();
    const phone = document.getElementById('deliveryPhone').value.trim();
    
    if (!address || !phone) {
        alert('Please enter your delivery address and phone number.');
        return;
    }
    
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    const ref = 'BW-' + Date.now().toString().slice(-8);
    document.getElementById('orderRef').textContent = ref;
    
    const orders = JSON.parse(localStorage.getItem('bluewave_orders') || '[]');
    orders.push({
        ref,
        items: [...cart],
        total,
        payment,
        address,
        phone,
        date: new Date().toISOString()  // Store exact date for tracking
    });
    localStorage.setItem('bluewave_orders', JSON.stringify(orders));
    
    cart = [];
    saveCart();
    
    document.getElementById('checkoutModal').classList.add('hidden');
    document.getElementById('confirmModal').classList.remove('hidden');
});