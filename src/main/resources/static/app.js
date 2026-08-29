/**
 * APEX B2B Retail Order & Admin Portal Frontend Controller
 */

// Core State
const state = {
    currentUser: null,
    demoUsers: [],
    mainView: 'field-sales', // 'field-sales' | 'admin-portal'
    fieldTab: 'catalog',     // 'catalog' | 'orders'
    adminTab: 'orders',      // 'orders' | 'analytics' | 'products' | 'shops' | 'employees'
    adminStatusFilter: 'ALL',
    shops: [],
    selectedShopId: null,
    products: [],
    categories: [],
    selectedCategory: 'ALL',
    searchQuery: '',
    cart: {}, // { [productId]: quantity }
    adminOrders: [],
    agentOrders: [],
    dashboardStats: null,
    activeInvoiceData: null,
    invoiceFormat: 'a4' // 'a4' | 'thermal'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    setupEventListeners();
    refreshLucide();
});

function refreshLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Data Fetching
async function loadInitialData() {
    try {
        // Fetch Demo Users (Admin + 20 Employees)
        const usersRes = await fetch('/api/auth/demo-users');
        if (usersRes.ok) {
            state.demoUsers = await usersRes.json();
            // By default no employee is selected on start
            state.currentUser = null;
            updateUserHeader();
            renderUserSwitcherMenu();
        }

        // Fetch Shops
        await loadShops();

        // Fetch Products & Categories
        await loadProductsAndCategories();

        // Load Initial Admin Stats & Orders
        await loadAdminData();

        // Render Initial UI
        renderCategoryPills();
        renderProducts();
        renderCartUI();

    } catch (err) {
        console.error('Error during initialization:', err);
        showToast('Failed to connect to backend server', 'error');
    }
}

async function loadShops() {
    try {
        const res = await fetch('/api/shops');
        if (res.ok) {
            state.shops = await res.json();
            populateShopSelectDropdown();
            renderAdminShops();
        }
    } catch (err) {
        console.error('Failed to load shops:', err);
    }
}

async function loadProductsAndCategories() {
    try {
        const [prodRes, catRes] = await fetchAll(['/api/products', '/api/products/categories']);
        if (prodRes) state.products = prodRes;
        if (catRes) state.categories = catRes;
        renderAdminCatalog();
    } catch (err) {
        console.error('Failed to load catalog:', err);
    }
}

async function fetchAll(urls) {
    return Promise.all(urls.map(url => fetch(url).then(r => r.ok ? r.json() : null)));
}

async function loadAdminData() {
    try {
        const [dashRes, ordersRes] = await fetchAll(['/api/analytics/dashboard', '/api/orders']);
        if (dashRes) {
            state.dashboardStats = dashRes;
            renderKPIs(dashRes);
            renderAnalytics(dashRes);
        }
        if (ordersRes) {
            state.adminOrders = ordersRes;
            renderAdminOrdersTable();
            updateStatusCounts();
        }
    } catch (err) {
        console.error('Failed to load admin data:', err);
    }
}

async function loadAgentOrders() {
    if (!state.currentUser) return;
    try {
        const res = await fetch(`/api/orders?employeeId=${state.currentUser.id}`);
        if (res.ok) {
            state.agentOrders = await res.json();
            renderAgentOrders();
            const countElem = document.getElementById('agent-orders-count');
            if (countElem) countElem.innerText = state.agentOrders.length;
        }
    } catch (err) {
        console.error('Failed to load agent orders:', err);
    }
}

// User & Role Switching
function updateUserHeader() {
    if (!state.currentUser) {
        document.getElementById('user-name-display').innerText = 'Select Account';
        document.getElementById('user-role-display').innerText = 'Click to Sign In';
        document.getElementById('user-avatar').innerText = '👤';
        document.getElementById('user-avatar').className = 'w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold';

        const welcomeElem = document.getElementById('field-agent-welcome');
        const territoryElem = document.getElementById('field-agent-territory');
        if (welcomeElem) welcomeElem.innerText = 'Field Sales Portal (Sign In Required)';
        if (territoryElem) territoryElem.innerHTML = `<i data-lucide="lock" class="w-3.5 h-3.5 mr-1 text-blue-300"></i> Please select your employee profile from the top-right menu to authenticate`;
        refreshLucide();
        return;
    }

    const isEmp = state.currentUser.role === 'EMPLOYEE';
    document.getElementById('user-name-display').innerText = state.currentUser.fullName;
    document.getElementById('user-role-display').innerText = `${state.currentUser.employeeCode || 'ADM'} • ${isEmp ? 'Field Rep' : 'Admin'}`;
    
    const initials = state.currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2);
    document.getElementById('user-avatar').innerText = initials;
    document.getElementById('user-avatar').className = 'w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold';

    // Update field agent banner
    const welcomeElem = document.getElementById('field-agent-welcome');
    const territoryElem = document.getElementById('field-agent-territory');
    if (welcomeElem && isEmp) {
        welcomeElem.innerText = `Hello, ${state.currentUser.fullName} (${state.currentUser.employeeCode})`;
    }
    if (territoryElem && isEmp) {
        territoryElem.innerHTML = `<i data-lucide="map-pin" class="w-3.5 h-3.5 mr-1 text-blue-300"></i> Route: ${state.currentUser.territory || 'Assigned Zone'}`;
    }
    refreshLucide();
}

function renderUserSwitcherMenu() {
    const list = document.getElementById('user-switcher-list');
    if (!list) return;
    list.innerHTML = '';

    // If currently signed in, show a Sign Out / Lock Session button at the top
    if (state.currentUser) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-bold flex items-center justify-between text-xs transition border-b border-slate-100';
        logoutBtn.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                <span>Sign Out (${state.currentUser.fullName})</span>
            </div>
            <span class="text-[10px] uppercase font-bold">Lock</span>
        `;
        logoutBtn.onclick = () => {
            state.currentUser = null;
            updateUserHeader();
            document.getElementById('user-switch-menu').classList.add('hidden');
            renderUserSwitcherMenu();
            showToast('Signed out successfully. Select an account to log in.', 'info');
        };
        list.appendChild(logoutBtn);
    }

    // Admin option (Password Protected)
    const adminUser = state.demoUsers.find(u => u.role === 'ADMIN') || { id: 1, fullName: 'Operations Admin', username: 'admin', employeeCode: 'ADM001', role: 'ADMIN', territory: 'HQ Operations' };
    const adminBtn = document.createElement('button');
    adminBtn.className = 'w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between text-xs transition border-b border-slate-100';
    adminBtn.innerHTML = `
        <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">AD</span>
            <div>
                <div class="font-bold text-slate-800 flex items-center space-x-1">
                    <span>Admin Portal</span>
                    <i data-lucide="lock" class="w-3 h-3 text-slate-400"></i>
                </div>
                <div class="text-[10px] text-slate-500">Administrator Access</div>
            </div>
        </div>
        <span class="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">ADMIN</span>
    `;
    adminBtn.onclick = () => {
        document.getElementById('user-switch-menu').classList.add('hidden');
        promptUserAuth(adminUser);
    };
    list.appendChild(adminBtn);

    // 20 Employees (Password Protected)
    state.demoUsers.filter(u => u.role === 'EMPLOYEE').forEach(emp => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-xs transition';
        btn.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    ${emp.employeeCode.replace('EMP', '')}
                </span>
                <div>
                    <div class="font-semibold text-slate-800 flex items-center space-x-1">
                        <span>${emp.fullName}</span>
                        <i data-lucide="lock" class="w-2.5 h-2.5 text-slate-400"></i>
                    </div>
                    <div class="text-[10px] text-slate-500 truncate max-w-[150px]">${emp.territory}</div>
                </div>
            </div>
            <span class="font-mono text-[10px] text-blue-600 font-bold">${emp.employeeCode}</span>
        `;
        btn.onclick = () => {
            document.getElementById('user-switch-menu').classList.add('hidden');
            promptUserAuth(emp);
        };
        list.appendChild(btn);
    });
    refreshLucide();
}

function toggleUserDropdown() {
    const menu = document.getElementById('user-switch-menu');
    menu.classList.toggle('hidden');
}

function promptUserAuth(user) {
    state.pendingAuthUser = user;
    
    const modal = document.getElementById('auth-password-modal');
    const nameElem = document.getElementById('auth-modal-user-name');
    const codeElem = document.getElementById('auth-modal-user-code');
    const roleBadge = document.getElementById('auth-modal-role-badge');
    const avatarElem = document.getElementById('auth-modal-avatar');
    const pwdInput = document.getElementById('auth-modal-password');
    const errorMsg = document.getElementById('auth-error-msg');

    if (nameElem) nameElem.innerText = user.fullName;
    if (codeElem) codeElem.innerText = user.employeeCode || user.username;
    
    if (user.role === 'ADMIN') {
        roleBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white';
        roleBadge.innerText = 'ADMIN';
        avatarElem.className = 'w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs';
        avatarElem.innerText = 'AD';
    } else {
        roleBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700';
        roleBadge.innerText = 'FIELD AGENT';
        avatarElem.className = 'w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs';
        const initials = user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2);
        avatarElem.innerText = initials;
    }

    pwdInput.value = '';
    errorMsg.classList.add('hidden');
    modal.classList.remove('hidden');
    setTimeout(() => pwdInput.focus(), 100);
    refreshLucide();
}

function closeAuthModal() {
    document.getElementById('auth-password-modal').classList.add('hidden');
    state.pendingAuthUser = null;
}

function toggleAuthPasswordVisibility() {
    const input = document.getElementById('auth-modal-password');
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    if (!state.pendingAuthUser) return;

    const pwdInput = document.getElementById('auth-modal-password');
    const errorMsg = document.getElementById('auth-error-msg');
    const submitBtn = document.getElementById('btn-auth-submit');
    const password = pwdInput.value;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-spin mr-1">⏳</span> Verifying...';

    const identifier = state.pendingAuthUser.employeeCode || state.pendingAuthUser.username;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: identifier, password: password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            state.currentUser = data.user;
            updateUserHeader();
            closeAuthModal();

            if (data.user.role === 'ADMIN') {
                switchMainView('admin-portal');
                showToast(`Authenticated as Administrator (${data.user.fullName})`, 'success');
            } else {
                switchMainView('field-sales');
                loadAgentOrders();
                showToast(`Authenticated as Field Agent ${data.user.fullName} (${data.user.employeeCode})`, 'success');
            }
        } else {
            errorMsg.innerText = data.message || 'Invalid password / PIN. Please try again.';
            errorMsg.classList.remove('hidden');
            pwdInput.focus();
            pwdInput.select();
        }
    } catch (err) {
        console.error('Auth error:', err);
        errorMsg.innerText = 'Unable to connect to auth server.';
        errorMsg.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="lock" class="w-3.5 h-3.5 mr-1"></i> Unlock & Login';
        refreshLucide();
    }
}

// View Transitions
function switchMainView(view) {
    if (view === 'admin-portal' && (!state.currentUser || state.currentUser.role !== 'ADMIN')) {
        const adminUser = state.demoUsers.find(u => u.role === 'ADMIN') || { id: 1, fullName: 'Operations Admin', username: 'admin', employeeCode: 'ADM001', role: 'ADMIN', territory: 'HQ Operations' };
        promptUserAuth(adminUser);
        return;
    }

    state.mainView = view;
    const salesView = document.getElementById('field-sales-view');
    const adminView = document.getElementById('admin-portal-view');
    const salesBtn = document.getElementById('view-mode-sales-btn');
    const adminBtn = document.getElementById('view-mode-admin-btn');
    const floatingCart = document.getElementById('floating-cart-bar');

    if (view === 'field-sales') {
        salesView.classList.remove('hidden');
        adminView.classList.add('hidden');
        salesBtn.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-blue-600 shadow-sm';
        adminBtn.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-600 hover:text-slate-900';
        updateFloatingCartVisibility();
    } else {
        salesView.classList.add('hidden');
        adminView.classList.remove('hidden');
        adminBtn.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-blue-600 shadow-sm';
        salesBtn.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-600 hover:text-slate-900';
        if (floatingCart) floatingCart.classList.add('hidden');
        loadAdminData();
    }
    refreshLucide();
}

function switchFieldTab(tab) {
    state.fieldTab = tab;
    const catScreen = document.getElementById('field-screen-catalog');
    const ordScreen = document.getElementById('field-screen-orders');
    const catTabBtn = document.getElementById('field-tab-catalog');
    const ordTabBtn = document.getElementById('field-tab-orders');

    if (tab === 'catalog') {
        catScreen.classList.remove('hidden');
        ordScreen.classList.add('hidden');
        catTabBtn.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white text-blue-700 font-semibold text-xs shadow-sm transition';
        ordTabBtn.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-semibold text-xs transition';
        updateFloatingCartVisibility();
    } else {
        catScreen.classList.add('hidden');
        ordScreen.classList.remove('hidden');
        ordTabBtn.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white text-blue-700 font-semibold text-xs shadow-sm transition';
        catTabBtn.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-semibold text-xs transition';
        document.getElementById('floating-cart-bar').classList.add('hidden');
        loadAgentOrders();
    }
    refreshLucide();
}

function switchAdminTab(tab) {
    state.adminTab = tab;
    const tabs = ['orders', 'analytics', 'products', 'shops', 'employees'];
    
    tabs.forEach(t => {
        const screen = document.getElementById(`adm-screen-${t}`);
        const btn = document.getElementById(`adm-tab-${t}`);
        if (screen && btn) {
            if (t === tab) {
                screen.classList.remove('hidden');
                btn.className = 'px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5';
            } else {
                screen.classList.add('hidden');
                btn.className = 'px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center space-x-1.5';
            }
        }
    });

    if (tab === 'employees') renderAdminEmployees();
    if (tab === 'analytics' && state.dashboardStats) renderAnalytics(state.dashboardStats);
    refreshLucide();
}

// Shop Selection & Registration
function populateShopSelectDropdown() {
    const select = document.getElementById('selected-shop-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choose Retail Shop from Route --</option>';
    
    state.shops.forEach(shop => {
        const opt = document.createElement('option');
        opt.value = shop.id;
        opt.innerText = `${shop.name} (${shop.ownerName} - ${shop.territory})`;
        select.appendChild(opt);
    });

    // Auto select first shop for convenient demo
    if (state.shops.length > 0 && !state.selectedShopId) {
        select.value = state.shops[0].id;
        onShopSelectionChange();
    }
}

function onShopSelectionChange() {
    const select = document.getElementById('selected-shop-select');
    state.selectedShopId = select.value ? parseInt(select.value) : null;
    
    const summaryCard = document.getElementById('active-shop-summary');
    const selectedShop = state.shops.find(s => s.id === state.selectedShopId);

    if (selectedShop) {
        document.getElementById('card-shop-name').innerText = selectedShop.name;
        document.getElementById('card-shop-owner').innerText = selectedShop.ownerName;
        document.getElementById('card-shop-phone').innerText = selectedShop.phone;
        document.getElementById('cart-shop-preview').innerText = `For: ${selectedShop.name}`;
        document.getElementById('drawer-shop-title').innerText = `Shop: ${selectedShop.name} (${selectedShop.ownerName})`;
        summaryCard.classList.remove('hidden');
    } else {
        summaryCard.classList.add('hidden');
        document.getElementById('cart-shop-preview').innerText = 'No shop selected';
        document.getElementById('drawer-shop-title').innerText = 'Shop: Not selected';
    }
}

function openNewShopModal() {
    document.getElementById('new-shop-modal').classList.remove('hidden');
}

function closeNewShopModal() {
    document.getElementById('new-shop-modal').classList.add('hidden');
}

async function handleCreateShop(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('new-shop-name').value,
        ownerName: document.getElementById('new-shop-owner').value,
        phone: document.getElementById('new-shop-phone').value,
        address: document.getElementById('new-shop-address').value,
        territory: document.getElementById('new-shop-territory').value || (state.currentUser ? state.currentUser.territory : 'General'),
        gstNumber: document.getElementById('new-shop-gst').value
    };

    try {
        const res = await fetch('/api/shops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const created = await res.json();
            showToast(`Shop "${created.name}" registered successfully!`, 'success');
            await loadShops();
            // Automatically select the new shop
            state.selectedShopId = created.id;
            const select = document.getElementById('selected-shop-select');
            if (select) select.value = created.id;
            onShopSelectionChange();
            closeNewShopModal();
            document.getElementById('new-shop-form').reset();
        } else {
            showToast('Failed to register shop', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error while saving shop', 'error');
    }
}

// Products Catalog & Quantity Stepper
function renderCategoryPills() {
    const container = document.getElementById('category-pills-container');
    if (!container) return;
    container.innerHTML = '';

    const categories = ['ALL', ...state.categories];
    categories.forEach(cat => {
        const btn = document.createElement('button');
        const isActive = state.selectedCategory === cat;
        btn.className = `px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            isActive 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
        }`;
        btn.innerText = cat === 'ALL' ? '🌟 All Items' : cat;
        btn.onclick = () => selectCategory(cat);
        container.appendChild(btn);
    });
}

function selectCategory(cat) {
    state.selectedCategory = cat;
    renderCategoryPills();
    renderProducts();
}

function filterProducts() {
    state.searchQuery = document.getElementById('product-search-input').value.toLowerCase();
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = state.products.filter(p => {
        const matchesCat = state.selectedCategory === 'ALL' || p.category.toLowerCase() === state.selectedCategory.toLowerCase();
        const matchesQuery = !state.searchQuery || 
                             p.name.toLowerCase().includes(state.searchQuery) || 
                             p.sku.toLowerCase().includes(state.searchQuery);
        return matchesCat && matchesQuery;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-400">
                <i data-lucide="package-x" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm font-semibold">No products found</p>
                <p class="text-xs">Try selecting another category or clear search</p>
            </div>
        `;
        refreshLucide();
        return;
    }

    filtered.forEach(prod => {
        const qtyInCart = state.cart[prod.id] || 0;
        const card = document.createElement('div');
        card.className = `custom-card p-4 flex flex-col justify-between relative overflow-hidden transition-all ${qtyInCart > 0 ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''}`;
        
        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between gap-2">
                    <span class="text-2xl p-2 rounded-xl bg-slate-100">${prod.imageUrl || '📦'}</span>
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">${prod.category}</span>
                </div>
                <div class="mt-3">
                    <span class="font-mono text-[10px] text-slate-400 font-semibold">${prod.sku}</span>
                    <h3 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mt-0.5">${prod.name}</h3>
                    <p class="text-[11px] text-slate-500 mt-1">${prod.unit}</p>
                </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                    <div class="text-[10px] text-slate-400 uppercase font-semibold">Wholesale Rate</div>
                    <div class="text-base font-extrabold text-blue-700">₹ ${prod.price.toFixed(2)}</div>
                </div>

                <!-- Quantity Control Stepper -->
                <div class="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button onclick="updateCartQuantity(${prod.id}, -1)" 
                        class="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-90 shadow-xs">
                        -
                    </button>
                    <input type="number" min="0" value="${qtyInCart}" onchange="setCartQuantity(${prod.id}, this.value)" 
                        class="w-10 text-center font-bold text-xs bg-transparent text-slate-800 focus:outline-none">
                    <button onclick="updateCartQuantity(${prod.id}, 1)" 
                        class="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center transition active:scale-90 shadow-xs">
                        +
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    refreshLucide();
}

// Cart Mechanics
function updateCartQuantity(productId, delta) {
    const current = state.cart[productId] || 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
        delete state.cart[productId];
    } else {
        state.cart[productId] = next;
    }
    renderProducts();
    renderCartUI();
}

function setCartQuantity(productId, value) {
    const qty = parseInt(value) || 0;
    if (qty <= 0) {
        delete state.cart[productId];
    } else {
        state.cart[productId] = qty;
    }
    renderProducts();
    renderCartUI();
}

function calculateCartTotals() {
    let count = 0;
    let subtotal = 0;

    Object.entries(state.cart).forEach(([prodId, qty]) => {
        const prod = state.products.find(p => p.id === parseInt(prodId));
        if (prod && qty > 0) {
            count += qty;
            subtotal += prod.price * qty;
        }
    });

    const tax = subtotal * 0.05; // 5% GST
    const grandTotal = subtotal + tax;

    return { count, subtotal, tax, grandTotal };
}

function renderCartUI() {
    const { count, subtotal, tax, grandTotal } = calculateCartTotals();

    // Floating Bottom Bar
    const floatingBar = document.getElementById('floating-cart-bar');
    const itemCountElem = document.getElementById('cart-item-count');
    const subtotalAmountElem = document.getElementById('cart-subtotal-amount');

    if (itemCountElem) itemCountElem.innerText = `${count} ${count === 1 ? 'Item' : 'Items'}`;
    if (subtotalAmountElem) subtotalAmountElem.innerText = `₹ ${subtotal.toFixed(2)}`;

    updateFloatingCartVisibility();

    // Drawer Totals
    const dSub = document.getElementById('drawer-subtotal');
    const dTax = document.getElementById('drawer-tax');
    const dGrand = document.getElementById('drawer-grand-total');

    if (dSub) dSub.innerText = `₹ ${subtotal.toFixed(2)}`;
    if (dTax) dTax.innerText = `₹ ${tax.toFixed(2)}`;
    if (dGrand) dGrand.innerText = `₹ ${grandTotal.toFixed(2)}`;

    // Drawer Items List
    renderDrawerItems();
}

function updateFloatingCartVisibility() {
    const floatingBar = document.getElementById('floating-cart-bar');
    if (!floatingBar) return;
    const { count } = calculateCartTotals();
    if (count > 0 && state.mainView === 'field-sales' && state.fieldTab === 'catalog') {
        floatingBar.classList.remove('hidden');
    } else {
        floatingBar.classList.add('hidden');
    }
}

function renderDrawerItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    container.innerHTML = '';

    const items = Object.entries(state.cart);
    if (items.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center text-slate-400">
                <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
                <p class="text-sm font-semibold">Your cart is empty</p>
                <p class="text-xs">Add items from the catalog to build order</p>
            </div>
        `;
        refreshLucide();
        return;
    }

    items.forEach(([prodId, qty]) => {
        const prod = state.products.find(p => p.id === parseInt(prodId));
        if (!prod) return;
        const itemTotal = prod.price * qty;

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80';
        row.innerHTML = `
            <div class="flex-1 pr-3">
                <div class="font-bold text-slate-800 text-xs">${prod.name}</div>
                <div class="text-[10px] text-slate-500">₹ ${prod.price.toFixed(2)} × ${qty} ${prod.unit}</div>
                <div class="text-xs font-bold text-blue-600 mt-0.5">₹ ${itemTotal.toFixed(2)}</div>
            </div>
            <div class="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
                <button onclick="updateCartQuantity(${prod.id}, -1)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">-</button>
                <span class="w-6 text-center font-bold text-xs text-slate-800">${qty}</span>
                <button onclick="updateCartQuantity(${prod.id}, 1)" class="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">+</button>
            </div>
        `;
        container.appendChild(row);
    });

    refreshLucide();
}

function openCartDrawer() {
    if (!state.selectedShopId) {
        showToast('Please select a retail shop first!', 'warning');
        return;
    }
    document.getElementById('cart-drawer-modal').classList.remove('hidden');
}

function closeCartDrawer() {
    document.getElementById('cart-drawer-modal').classList.add('hidden');
}

// Order Submission
async function submitOrder() {
    if (!state.currentUser || state.currentUser.role !== 'EMPLOYEE') {
        showToast('Please authenticate as an employee to place orders!', 'warning');
        toggleUserDropdown();
        return;
    }
    if (!state.selectedShopId) {
        showToast('Please select a retail shop', 'warning');
        return;
    }
    const { count, grandTotal } = calculateCartTotals();
    if (count === 0) {
        showToast('Please add at least one product to the cart', 'warning');
        return;
    }

    const submitBtn = document.getElementById('btn-submit-order');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Submitting Order...';

    const itemsPayload = Object.entries(state.cart).map(([prodId, qty]) => ({
        productId: parseInt(prodId),
        quantity: qty
    }));

    const payload = {
        shopId: state.selectedShopId,
        employeeId: state.currentUser.id,
        paymentMethod: document.getElementById('order-payment-method').value,
        notes: document.getElementById('order-notes-input').value,
        items: itemsPayload
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const createdOrder = await res.json();
            
            // Show Confirmation Popup
            document.getElementById('success-order-no').innerText = createdOrder.orderNumber;
            document.getElementById('success-shop-name').innerText = createdOrder.shop.name;
            document.getElementById('success-grand-total').innerText = `₹ ${createdOrder.grandTotal.toFixed(2)}`;
            document.getElementById('order-success-modal').classList.remove('hidden');

            // Reset cart & close drawer
            state.cart = {};
            document.getElementById('order-notes-input').value = '';
            closeCartDrawer();
            renderProducts();
            renderCartUI();

            // Refresh orders & admin lists
            await loadInitialData();
            showToast(`Order ${createdOrder.orderNumber} placed for ${createdOrder.shop.name}!`, 'success');
        } else {
            const errData = await res.json();
            showToast(errData.error || 'Failed to place order', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error while submitting order', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4 mr-1"></i> Confirm & Place Order';
        refreshLucide();
    }
}

function closeSuccessModal() {
    document.getElementById('order-success-modal').classList.add('hidden');
    switchFieldTab('orders');
}

// Field Agent Orders History
function renderAgentOrders() {
    const list = document.getElementById('agent-orders-list');
    if (!list) return;
    list.innerHTML = '';

    if (state.agentOrders.length === 0) {
        list.innerHTML = `
            <div class="py-12 text-center text-slate-400 custom-card">
                <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
                <p class="text-sm font-semibold">No orders placed yet</p>
                <p class="text-xs">Orders placed on your route will appear here</p>
            </div>
        `;
        refreshLucide();
        return;
    }

    state.agentOrders.forEach(ord => {
        const card = document.createElement('div');
        card.className = 'custom-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
        
        const badgeClass = getStatusBadgeClass(ord.status);
        const dateStr = formatDate(ord.createdAt);

        card.innerHTML = `
            <div>
                <div class="flex items-center space-x-2">
                    <span class="font-mono font-bold text-slate-900 text-xs">${ord.orderNumber}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">${ord.status}</span>
                </div>
                <h4 class="font-bold text-slate-800 text-sm mt-1">${ord.shop.name}</h4>
                <p class="text-[11px] text-slate-500">${ord.items.length} Line Items • Placed: ${dateStr}</p>
            </div>
            <div class="flex items-center justify-between sm:justify-end sm:space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                <div class="text-right">
                    <div class="text-[10px] text-slate-400 uppercase font-semibold">Total Amount</div>
                    <div class="text-sm font-extrabold text-blue-600">₹ ${ord.grandTotal.toFixed(2)}</div>
                </div>
                <button onclick="openInvoiceModal(${ord.id})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition">
                    <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                    <span>Bill</span>
                </button>
            </div>
        `;
        list.appendChild(card);
    });

    refreshLucide();
}

// Admin Fulfillment & Dispatch
function renderKPIs(stats) {
    if (!stats) return;
    document.getElementById('kpi-total-revenue').innerText = `₹ ${stats.totalRevenue ? stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}`;
    document.getElementById('kpi-total-orders').innerText = stats.totalOrders;
    document.getElementById('kpi-pending-orders').innerText = stats.pendingOrders;
    document.getElementById('kpi-shipped-orders').innerText = stats.shippedOrders;
    document.getElementById('kpi-done-orders').innerText = stats.doneOrders;
}

function updateStatusCounts() {
    const all = state.adminOrders.length;
    const pending = state.adminOrders.filter(o => o.status === 'PENDING').length;
    const shipped = state.adminOrders.filter(o => o.status === 'SHIPPED').length;
    const done = state.adminOrders.filter(o => o.status === 'DONE').length;

    document.getElementById('count-all').innerText = all;
    document.getElementById('count-pending').innerText = pending;
    document.getElementById('count-shipped').innerText = shipped;
    document.getElementById('count-done').innerText = done;
}

function filterAdminOrders(status) {
    state.adminStatusFilter = status;
    const statuses = ['ALL', 'PENDING', 'SHIPPED', 'DONE'];
    statuses.forEach(s => {
        const btn = document.getElementById(`filter-status-${s}`);
        if (btn) {
            if (s === status) {
                btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white text-blue-600 shadow-sm';
            } else {
                btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition';
            }
        }
    });
    renderAdminOrdersTable();
}

function renderAdminOrdersTable() {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = (document.getElementById('admin-order-search')?.value || '').toLowerCase();

    const filtered = state.adminOrders.filter(ord => {
        const matchesStatus = state.adminStatusFilter === 'ALL' || ord.status === state.adminStatusFilter;
        const matchesSearch = !query || 
                              ord.orderNumber.toLowerCase().includes(query) ||
                              ord.shop.name.toLowerCase().includes(query) ||
                              ord.employee.fullName.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-400">
                    <i data-lucide="package-open" class="w-8 h-8 mx-auto mb-1 opacity-40"></i>
                    <p class="font-semibold text-xs">No orders matching selected criteria</p>
                </td>
            </tr>
        `;
        refreshLucide();
        return;
    }

    filtered.forEach(ord => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition-colors';

        const badgeClass = getStatusBadgeClass(ord.status);
        const dateStr = formatDate(ord.createdAt);

        // Dynamic Action Buttons according to workflow: Mark Shipped / Mark Done
        let actionButtons = '';
        if (ord.status === 'PENDING') {
            actionButtons = `
                <button onclick="updateOrderStatus(${ord.id}, 'SHIPPED')" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 shadow-xs transition">
                    <i data-lucide="truck" class="w-3 h-3"></i>
                    <span>Mark Shipped</span>
                </button>
            `;
        } else if (ord.status === 'SHIPPED') {
            actionButtons = `
                <button onclick="updateOrderStatus(${ord.id}, 'DONE')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 shadow-xs transition">
                    <i data-lucide="check" class="w-3 h-3"></i>
                    <span>Mark Done</span>
                </button>
            `;
        } else if (ord.status === 'DONE') {
            actionButtons = `
                <span class="text-emerald-700 font-bold text-[11px] flex items-center space-x-1">
                    <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                    <span>Completed</span>
                </span>
            `;
        }

        tr.innerHTML = `
            <td class="py-3 px-4">
                <div class="font-mono font-bold text-slate-900">${ord.orderNumber}</div>
                <div class="text-[10px] text-slate-400">${dateStr}</div>
            </td>
            <td class="py-3 px-4">
                <div class="font-bold text-slate-800">${ord.shop.name}</div>
                <div class="text-[10px] text-slate-500">${ord.shop.ownerName} • ${ord.shop.phone}</div>
            </td>
            <td class="py-3 px-4">
                <div class="font-semibold text-slate-800">${ord.employee.fullName}</div>
                <div class="text-[10px] text-blue-600 font-mono font-bold">${ord.employee.employeeCode}</div>
            </td>
            <td class="py-3 px-4">
                <div class="font-extrabold text-slate-900">₹ ${ord.grandTotal.toFixed(2)}</div>
                <div class="text-[10px] text-slate-500">${ord.items.length} Products</div>
            </td>
            <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">${ord.paymentMethod}</span>
            </td>
            <td class="py-3 px-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${badgeClass}">${ord.status}</span>
            </td>
            <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end space-x-2">
                    ${actionButtons}
                    <button onclick="openInvoiceModal(${ord.id})" title="Print Bill / Invoice" 
                        class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                        <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    refreshLucide();
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            const updated = await res.json();
            showToast(`Order ${updated.orderNumber} marked as ${newStatus}!`, 'success');
            await loadAdminData();
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error updating status', 'error');
    }
}

async function refreshAdminData() {
    showToast('Syncing orders and revenue metrics...', 'info');
    await loadAdminData();
}

// Master Data: Catalog, Shops, Employees
function renderAdminCatalog() {
    const tbody = document.getElementById('admin-catalog-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    state.products.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
            <td class="py-2.5 px-4 font-mono font-bold text-slate-700">${p.sku}</td>
            <td class="py-2.5 px-4">
                <div class="font-bold text-slate-900">${p.imageUrl || ''} ${p.name}</div>
            </td>
            <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">${p.category}</span></td>
            <td class="py-2.5 px-4 text-slate-600">${p.unit}</td>
            <td class="py-2.5 px-4 font-bold text-blue-700">₹ ${p.price.toFixed(2)}</td>
            <td class="py-2.5 px-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stockQuantity > 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                    ${p.stockQuantity} in stock
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAdminShops() {
    const grid = document.getElementById('admin-shops-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.shops.forEach(shop => {
        const card = document.createElement('div');
        card.className = 'custom-card p-4 space-y-2';
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="font-bold text-slate-900 text-sm">${shop.name}</h3>
                    <p class="text-xs text-slate-500">${shop.ownerName}</p>
                </div>
                <span class="p-1.5 rounded-lg bg-blue-50 text-blue-600"><i data-lucide="store" class="w-4 h-4"></i></span>
            </div>
            <div class="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                <div class="flex items-center space-x-1.5">
                    <i data-lucide="phone" class="w-3 h-3 text-slate-400"></i>
                    <span>${shop.phone}</span>
                </div>
                <div class="flex items-center space-x-1.5">
                    <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i>
                    <span class="truncate">${shop.address}</span>
                </div>
                <div class="text-[10px] text-blue-600 font-semibold uppercase mt-1">Route: ${shop.territory}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderAdminEmployees() {
    const grid = document.getElementById('admin-employees-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const employees = state.demoUsers.filter(u => u.role === 'EMPLOYEE');
    employees.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'custom-card p-4 space-y-2';
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    ${emp.employeeCode.replace('EMP', '')}
                </div>
                <span class="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">${emp.employeeCode}</span>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 text-sm">${emp.fullName}</h4>
                <p class="text-xs text-slate-500">${emp.phone || 'Field Sales Rep'}</p>
            </div>
            <div class="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center space-x-1">
                <i data-lucide="map" class="w-3 h-3 text-slate-400"></i>
                <span class="truncate">${emp.territory}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Analytics & Leaderboard
function renderAnalytics(stats) {
    // Leaderboard
    const empList = document.getElementById('top-employees-list');
    if (empList && stats.topEmployees) {
        empList.innerHTML = '';
        stats.topEmployees.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100';
            div.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="w-6 h-6 rounded-full ${idx === 0 ? 'bg-amber-400 text-slate-900 font-extrabold' : 'bg-slate-200 text-slate-700 font-bold'} flex items-center justify-center text-xs">
                        #${idx + 1}
                    </span>
                    <div>
                        <div class="font-bold text-slate-900 text-xs">${item.employee}</div>
                        <div class="text-[10px] text-slate-500">${item.orderCount} Orders Booked</div>
                    </div>
                </div>
                <div class="text-right font-extrabold text-xs text-blue-700">
                    ₹ ${item.revenue ? item.revenue.toFixed(2) : '0.00'}
                </div>
            `;
            empList.appendChild(div);
        });
    }

    // Top Products
    const prodList = document.getElementById('top-products-list');
    if (prodList && stats.topProducts) {
        prodList.innerHTML = '';
        stats.topProducts.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100';
            div.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                        ${idx + 1}
                    </span>
                    <div class="font-bold text-slate-900 text-xs">${item.productName}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-xs text-slate-800">${item.quantity} Units</div>
                    <div class="text-[10px] text-slate-500">₹ ${item.revenue ? item.revenue.toFixed(2) : '0.00'}</div>
                </div>
            `;
            prodList.appendChild(div);
        });
    }
}

// Bill & Invoice Printing View
async function openInvoiceModal(orderId) {
    try {
        const res = await fetch(`/api/orders/${orderId}/invoice`);
        if (res.ok) {
            state.activeInvoiceData = await res.json();
            renderInvoiceTemplate();
            document.getElementById('invoice-modal').classList.remove('hidden');
            refreshLucide();
        } else {
            showToast('Failed to load invoice details', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error fetching invoice', 'error');
    }
}

function closeInvoiceModal() {
    document.getElementById('invoice-modal').classList.add('hidden');
}

function setInvoiceFormat(fmt) {
    state.invoiceFormat = fmt;
    const a4Btn = document.getElementById('fmt-a4-btn');
    const thermalBtn = document.getElementById('fmt-thermal-btn');

    if (fmt === 'a4') {
        a4Btn.className = 'px-2.5 py-1 rounded-md bg-white text-blue-700 shadow-xs font-bold';
        thermalBtn.className = 'px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900';
    } else {
        thermalBtn.className = 'px-2.5 py-1 rounded-md bg-white text-blue-700 shadow-xs font-bold';
        a4Btn.className = 'px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900';
    }
    renderInvoiceTemplate();
}

function renderInvoiceTemplate() {
    const area = document.getElementById('invoice-print-area');
    if (!area || !state.activeInvoiceData) return;

    const data = state.activeInvoiceData;
    const ord = data.order;

    if (state.invoiceFormat === 'thermal') {
        // Compact 80mm Thermal POS Receipt Layout
        let itemsHtml = '';
        ord.items.forEach((it, i) => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <div>${i+1}. ${it.productName}<br><span style="color:#64748b;">${it.quantity} x ₹${it.unitPrice.toFixed(2)}</span></div>
                    <div style="font-weight: bold;">₹${it.subtotal.toFixed(2)}</div>
                </div>
            `;
        });

        area.innerHTML = `
            <div class="thermal-receipt">
                <div style="text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 8px; margin-bottom: 8px;">
                    <div style="font-size: 16px; font-weight: 800;">${data.companyName}</div>
                    <div style="font-size: 10px; color: #475569;">${data.companyAddress}</div>
                    <div style="font-size: 10px;">GSTIN: ${data.companyGst}</div>
                    <div style="font-size: 10px;">Ph: ${data.companyPhone}</div>
                </div>

                <div style="font-size: 11px; margin-bottom: 8px; border-bottom: 1px dashed #94a3b8; padding-bottom: 8px;">
                    <div><strong>RECEIPT #:</strong> ${data.invoiceNumber}</div>
                    <div><strong>DATE:</strong> ${data.invoiceDate}</div>
                    <div><strong>SHOP:</strong> ${ord.shop.name}</div>
                    <div><strong>OWNER:</strong> ${ord.shop.ownerName} (${ord.shop.phone})</div>
                    <div><strong>SALES REP:</strong> ${ord.employee.fullName} (${ord.employee.employeeCode})</div>
                    <div><strong>PAYMENT:</strong> ${ord.paymentMethod}</div>
                </div>

                <div style="border-bottom: 1px dashed #94a3b8; padding-bottom: 8px; margin-bottom: 8px;">
                    ${itemsHtml}
                </div>

                <div style="font-size: 11px; margin-bottom: 8px; border-bottom: 1px dashed #94a3b8; padding-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>SUBTOTAL:</span>
                        <span>₹${ord.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>GST (5%):</span>
                        <span>₹${ord.taxAmount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-top: 4px;">
                        <span>GRAND TOTAL:</span>
                        <span>₹${ord.grandTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div style="text-align: center; font-size: 10px; color: #64748b; margin-top: 8px;">
                    <div>* THANK YOU FOR YOUR BUSINESS *</div>
                    <div>Goods once sold subject to delivery terms.</div>
                </div>
            </div>
        `;
    } else {
        // Standard A4 Professional Tax Invoice Layout
        let rowsHtml = '';
        ord.items.forEach((it, idx) => {
            rowsHtml += `
                <tr class="border-b border-slate-200">
                    <td class="py-2.5 px-3 text-slate-500 font-mono text-center">${idx + 1}</td>
                    <td class="py-2.5 px-3 font-semibold text-slate-800">${it.productName}</td>
                    <td class="py-2.5 px-3 text-slate-600 font-mono text-center">${it.quantity}</td>
                    <td class="py-2.5 px-3 text-slate-700 text-right font-mono">₹ ${it.unitPrice.toFixed(2)}</td>
                    <td class="py-2.5 px-3 text-slate-900 font-bold text-right font-mono">₹ ${it.subtotal.toFixed(2)}</td>
                </tr>
            `;
        });

        area.innerHTML = `
            <div class="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-8 space-y-6 text-xs text-slate-800">
                <!-- Header -->
                <div class="flex justify-between items-start border-b border-slate-200 pb-6">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">A</span>
                            <span class="text-xl font-extrabold text-slate-900 tracking-tight">${data.companyName}</span>
                        </div>
                        <p class="text-slate-500 mt-1 max-w-xs text-[11px]">${data.companyAddress}</p>
                        <p class="text-[11px] text-slate-600 mt-0.5">GSTIN: <strong class="font-mono">${data.companyGst}</strong> | Ph: ${data.companyPhone}</p>
                    </div>
                    <div class="text-right">
                        <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold uppercase text-[11px] tracking-wider">Tax Invoice</span>
                        <div class="mt-2">
                            <div class="text-slate-400 uppercase text-[10px] font-bold">Invoice Number</div>
                            <div class="font-mono font-bold text-sm text-slate-900">${data.invoiceNumber}</div>
                        </div>
                        <div class="mt-1 text-[11px] text-slate-500">Date: ${data.invoiceDate}</div>
                    </div>
                </div>

                <!-- Bill To & Order Meta -->
                <div class="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bill To (Retail Partner)</div>
                        <div class="font-bold text-sm text-slate-900">${ord.shop.name}</div>
                        <div class="text-slate-600 mt-0.5">Prop: ${ord.shop.ownerName}</div>
                        <div class="text-slate-600">Ph: ${ord.shop.phone}</div>
                        <div class="text-slate-500 text-[11px] mt-0.5">${ord.shop.address}</div>
                        ${ord.shop.gstNumber ? `<div class="text-[11px] text-slate-500 mt-0.5">GSTIN: ${ord.shop.gstNumber}</div>` : ''}
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatch & Booking Details</div>
                        <div class="text-slate-700">Booked By: <strong>${ord.employee.fullName} (${ord.employee.employeeCode})</strong></div>
                        <div class="text-slate-700">Territory: ${ord.employee.territory || ord.shop.territory}</div>
                        <div class="text-slate-700">Payment Terms: <strong>${ord.paymentMethod}</strong></div>
                        <div class="text-slate-700">Fulfillment Status: <strong class="uppercase text-blue-600">${ord.status}</strong></div>
                        ${ord.notes ? `<div class="text-slate-500 italic mt-1">Note: "${ord.notes}"</div>` : ''}
                    </div>
                </div>

                <!-- Line Items Table -->
                <div class="rounded-xl border border-slate-200 overflow-hidden">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead class="bg-slate-100/70 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600">
                            <tr>
                                <th class="py-2.5 px-3 text-center w-10">#</th>
                                <th class="py-2.5 px-3">Item Description</th>
                                <th class="py-2.5 px-3 text-center w-16">Qty</th>
                                <th class="py-2.5 px-3 text-right w-24">Rate</th>
                                <th class="py-2.5 px-3 text-right w-28">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>

                <!-- Totals & Tax Calculation -->
                <div class="flex justify-end pt-2">
                    <div class="w-72 space-y-1.5 text-xs">
                        <div class="flex justify-between text-slate-600">
                            <span>Subtotal:</span>
                            <span class="font-mono font-semibold">₹ ${ord.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>CGST (2.5%):</span>
                            <span class="font-mono">₹ ${(ord.taxAmount / 2).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>SGST (2.5%):</span>
                            <span class="font-mono">₹ ${(ord.taxAmount / 2).toFixed(2)}</span>
                        </div>
                        <div class="border-t-2 border-slate-900 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                            <span>Grand Total:</span>
                            <span class="font-mono text-blue-700">₹ ${ord.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <!-- Signatures & Disclaimer Footer -->
                <div class="pt-8 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
                    <div>
                        <p class="font-semibold text-slate-700">Terms & Conditions:</p>
                        <p>1. Payment due per agreed terms (${ord.paymentMethod}).</p>
                        <p>2. Goods received in good condition & sealed packs.</p>
                    </div>
                    <div class="text-center">
                        <div class="w-40 border-b border-slate-400 mb-1"></div>
                        <p class="font-bold text-slate-700">Authorized Signatory</p>
                        <p class="text-[10px] text-slate-400">${data.companyName}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Helpers
function getStatusBadgeClass(status) {
    switch (status) {
        case 'PENDING': return 'badge-pending';
        case 'SHIPPED': return 'badge-shipped';
        case 'DONE': return 'badge-done';
        case 'CANCELLED': return 'badge-cancelled';
        default: return 'bg-slate-100 text-slate-700';
    }
}

function formatDate(isoStr) {
    if (!isoStr) return 'Just now';
    try {
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return isoStr;
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'bg-emerald-600 text-white' :
                       type === 'error' ? 'bg-rose-600 text-white' :
                       type === 'warning' ? 'bg-amber-500 text-white' :
                       'bg-slate-900 text-white';

    toast.className = `px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center space-x-2 pointer-events-auto transition-all transform duration-300 translate-y-2 opacity-0 ${colorClass}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function setupEventListeners() {
    // Click outside user menu to close
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-switch-menu');
        const trigger = e.target.closest('button[onclick="toggleUserDropdown()"]');
        if (menu && !menu.contains(e.target) && !trigger) {
            menu.classList.add('hidden');
        }
    });
}
