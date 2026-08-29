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
    adminDateFilter: 'today', // 'today' | 'yesterday' | 'last7' | 'last30'
    analyticsRange: 'last7',  // analytics sub-tab: 'last7' | 'last30'
    editingOrderId: null,     // order currently open in the edit modal
    editItems: {},            // { [productId]: qty } working copy while editing
    editOriginalQty: {},      // { [productId]: qty } quantities the order held before editing
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
    activeInvoiceData: null
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
        // Fetch Demo Users (Admin + field employees)
        const usersRes = await fetch('/api/auth/demo-users');
        if (usersRes.ok) {
            state.demoUsers = await usersRes.json();
            // By default no employee is selected on start
            state.currentUser = null;
            updateUserHeader();
            renderUserSwitcherMenu();
            const agentCountEl = document.getElementById('nav-agent-count');
            if (agentCountEl) agentCountEl.innerText = state.demoUsers.filter(u => u.role === 'EMPLOYEE').length;
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
        const ordersRes = await fetch('/api/orders').then(r => r.ok ? r.json() : null);
        if (ordersRes) {
            state.adminOrders = ordersRes;
            renderKPIs();
            renderAdminOrdersTable();
            updateStatusCounts();
        }
        await loadAnalytics();
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
        const stock = prod.stockQuantity ?? 0;
        const outOfStock = stock <= 0;
        const lowStock = !outOfStock && stock <= 20;
        const card = document.createElement('div');
        card.className = `custom-card p-4 flex flex-col justify-between relative overflow-hidden transition-all ${outOfStock ? 'opacity-75 grayscale-[35%]' : ''} ${qtyInCart > 0 ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''}`;

        const stockBadge = outOfStock
            ? `<span class="text-[10px] font-extrabold text-rose-600 uppercase tracking-wide">● Out of Stock</span>`
            : `<span class="text-[10px] font-bold uppercase tracking-wide ${lowStock ? 'text-amber-600' : 'text-emerald-600'}">${stock} in stock${lowStock ? ' • Low' : ''}</span>`;

        const control = outOfStock
            ? `<span class="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 text-[11px] font-extrabold uppercase">Out of Stock</span>`
            : `
                <div class="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button onclick="updateCartQuantity(${prod.id}, -1)"
                        class="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-90 shadow-xs">
                        -
                    </button>
                    <input type="number" min="0" max="${stock}" value="${qtyInCart}" onchange="setCartQuantity(${prod.id}, this.value)"
                        class="w-10 text-center font-bold text-xs bg-transparent text-slate-800 focus:outline-none">
                    <button onclick="updateCartQuantity(${prod.id}, 1)"
                        class="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center transition active:scale-90 shadow-xs">
                        +
                    </button>
                </div>`;

        card.innerHTML = `
            ${outOfStock ? `<div class="absolute top-2 -right-8 rotate-45 bg-rose-600 text-white text-[9px] font-extrabold uppercase px-8 py-0.5 shadow-sm">Sold Out</div>` : ''}
            <div>
                <div class="flex items-start justify-between gap-2">
                    <span class="text-2xl p-2 rounded-xl bg-slate-100">${prod.imageUrl || '📦'}</span>
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">${prod.category}</span>
                </div>
                <div class="mt-3">
                    <span class="font-mono text-[10px] text-slate-400 font-semibold">${prod.sku}</span>
                    <h3 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mt-0.5">${prod.name}</h3>
                    <p class="text-[11px] text-slate-500 mt-1">${prod.unit}</p>
                    <div class="mt-1.5">${stockBadge}</div>
                </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                    <div class="text-[10px] text-slate-400 uppercase font-semibold">Wholesale Rate</div>
                    <div class="text-base font-extrabold text-blue-700">₹ ${prod.price.toFixed(2)}</div>
                </div>
                ${control}
            </div>
        `;
        grid.appendChild(card);
    });

    refreshLucide();
}

// Cart Mechanics
function getAvailableStock(productId) {
    const prod = state.products.find(p => p.id === parseInt(productId));
    return prod ? (prod.stockQuantity ?? 0) : 0;
}

function updateCartQuantity(productId, delta) {
    const max = getAvailableStock(productId);
    const current = state.cart[productId] || 0;
    let next = Math.max(0, current + delta);
    if (next > max) {
        next = max;
        if (delta > 0) showToast(`Only ${max} unit(s) in stock`, 'warning');
    }
    if (next === 0) {
        delete state.cart[productId];
    } else {
        state.cart[productId] = next;
    }
    renderProducts();
    renderCartUI();
}

function setCartQuantity(productId, value) {
    const max = getAvailableStock(productId);
    let qty = parseInt(value) || 0;
    if (qty > max) {
        qty = max;
        showToast(`Only ${max} unit(s) in stock`, 'warning');
    }
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
// KPI cards reflect the currently selected date-range tab
function renderKPIs() {
    const orders = state.adminOrders.filter(o => isInDateRange(o.createdAt, state.adminDateFilter));
    const revenue = orders.reduce((s, o) => s + (o.status !== 'CANCELLED' ? o.grandTotal : 0), 0);
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('kpi-total-revenue', `₹ ${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    set('kpi-total-orders', orders.length);
    set('kpi-pending-orders', orders.filter(o => o.status === 'PENDING').length);
    set('kpi-shipped-orders', orders.filter(o => o.status === 'SHIPPED').length);
    set('kpi-done-orders', orders.filter(o => o.status === 'DONE').length);
}

async function loadAnalytics() {
    try {
        const res = await fetch(`/api/analytics/dashboard?range=${state.analyticsRange}`);
        if (res.ok) {
            state.dashboardStats = await res.json();
            renderAnalytics(state.dashboardStats);
        }
    } catch (err) {
        console.error('Failed to load analytics:', err);
    }
}

function switchAnalyticsRange(range) {
    state.analyticsRange = range;
    ['last7', 'last30'].forEach(r => {
        const btn = document.getElementById(`analytics-range-${r}`);
        if (btn) {
            btn.className = r === range
                ? 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white text-blue-600 shadow-sm'
                : 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition';
        }
    });
    loadAnalytics();
}

function updateStatusCounts() {
    DATE_RANGES.forEach(r => {
        const el = document.getElementById(`count-date-${r}`);
        if (el) el.innerText = state.adminOrders.filter(o => isInDateRange(o.createdAt, r)).length;
    });
}

const DATE_RANGES = ['today', 'yesterday', 'last7', 'last30'];

function filterAdminByDate(range) {
    state.adminDateFilter = range;
    DATE_RANGES.forEach(r => {
        const btn = document.getElementById(`filter-date-${r}`);
        if (btn) {
            if (r === range) {
                btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white text-blue-600 shadow-sm';
            } else {
                btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition';
            }
        }
    });
    renderKPIs();
    renderAdminOrdersTable();
}

// Calendar-day key (local) used to cluster orders from the same shop on the same date
function dateKey(isoStr) {
    const d = new Date(isoStr);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Returns true if an ISO timestamp falls within the given date range key
function isInDateRange(isoStr, range) {
    if (!isoStr) return false;
    const t = new Date(isoStr).getTime();
    if (isNaN(t)) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 3600000;
    const DAY = 24 * 3600000;

    switch (range) {
        case 'today': return t >= startOfToday;
        case 'yesterday': return t >= startOfYesterday && t < startOfToday;
        case 'last7': return t >= now.getTime() - 7 * DAY;
        case 'last30': return t >= now.getTime() - 30 * DAY;
        default: return true;
    }
}

function renderAdminOrdersTable() {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = (document.getElementById('admin-order-search')?.value || '').toLowerCase();

    const filtered = state.adminOrders.filter(ord => {
        const matchesDate = isInDateRange(ord.createdAt, state.adminDateFilter);
        const matchesSearch = !query ||
                              ord.orderNumber.toLowerCase().includes(query) ||
                              ord.shop.name.toLowerCase().includes(query) ||
                              ord.employee.fullName.toLowerCase().includes(query);
        return matchesDate && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-400">
                    <i data-lucide="package-open" class="w-8 h-8 mx-auto mb-1 opacity-40"></i>
                    <p class="font-semibold text-xs">No orders in the selected period</p>
                </td>
            </tr>
        `;
        refreshLucide();
        return;
    }

    // Group the filtered orders by status, rendered in workflow order.
    // Within each status, orders from the same shop on the same date are
    // clustered together so the admin can see (and merge) them at a glance.
    const STATUS_ORDER = ['PENDING', 'SHIPPED', 'DONE', 'CANCELLED'];
    const groups = {};
    filtered.forEach(o => { (groups[o.status] = groups[o.status] || []).push(o); });

    STATUS_ORDER.filter(s => groups[s] && groups[s].length).forEach(status => {
        const orders = groups[status];
        const groupTotal = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

        const headerTr = document.createElement('tr');
        headerTr.className = 'bg-slate-50/90';
        headerTr.innerHTML = `
            <td colspan="7" class="py-2 px-4">
                <div class="flex items-center justify-between">
                    <span class="flex items-center space-x-2">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${getStatusBadgeClass(status)}">${status}</span>
                        <span class="text-xs font-bold text-slate-600">${orders.length} order${orders.length === 1 ? '' : 's'}</span>
                    </span>
                    <span class="text-[11px] font-bold text-slate-500">₹ ${groupTotal.toFixed(2)}</span>
                </div>
            </td>
        `;
        tbody.appendChild(headerTr);

        // Cluster this status's orders by shop + calendar date
        const shopGroups = {};
        orders.forEach(o => {
            const key = `${o.shop.id}|${dateKey(o.createdAt)}`;
            if (!shopGroups[key]) shopGroups[key] = [];
            shopGroups[key].push(o);
        });

        Object.values(shopGroups).forEach(shopOrders => {
            // Multiple same-shop orders: show a cluster sub-header (+ Merge if pending)
            if (shopOrders.length > 1) {
                const shop = shopOrders[0].shop;
                const clusterTotal = shopOrders.reduce((s, o) => s + o.grandTotal, 0);
                const ids = shopOrders.map(o => o.id).join(',');
                const canMerge = status === 'PENDING';

                const subTr = document.createElement('tr');
                subTr.className = 'bg-blue-50/40';
                subTr.innerHTML = `
                    <td colspan="7" class="py-1.5 px-4 pl-8">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                            <span class="flex items-center gap-2 text-[11px]">
                                <i data-lucide="store" class="w-3.5 h-3.5 text-blue-600"></i>
                                <span class="font-bold text-slate-700">${shop.name}</span>
                                <span class="text-slate-500">${shopOrders.length} orders on ${formatDate(shopOrders[0].createdAt)} • ₹ ${clusterTotal.toFixed(2)}</span>
                            </span>
                            ${canMerge ? `<button onclick="mergeOrders('${ids}', ${shopOrders.length})" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition">
                                <i data-lucide="git-merge" class="w-3 h-3"></i><span>Merge ${shopOrders.length} orders</span>
                            </button>` : `<span class="text-[10px] text-slate-400 italic">locked (already ${status.toLowerCase()})</span>`}
                        </div>
                    </td>
                `;
                tbody.appendChild(subTr);
                shopOrders.forEach(ord => {
                    const row = buildAdminOrderRow(ord);
                    row.classList.add('bg-white');
                    tbody.appendChild(row);
                });
            } else {
                tbody.appendChild(buildAdminOrderRow(shopOrders[0]));
            }
        });
    });

    refreshLucide();
}

function buildAdminOrderRow(ord) {
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
            <div class="flex items-center justify-end space-x-1.5">
                ${actionButtons}
                ${ord.status === 'PENDING' ? `<button onclick="openEditOrderModal(${ord.id})" title="Edit Order"
                    class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition">
                    <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                </button>` : ''}
                <button onclick="deleteOrder(${ord.id})" title="Delete Order"
                    class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="openInvoiceModal(${ord.id})" title="Print Bill / Invoice"
                    class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                    <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </td>
    `;
    return tr;
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

// ---- Order Editing (Admin) ----

// Max quantity selectable for a product while editing an order:
// current stock plus whatever this order already reserved for it.
function editAvailable(productId) {
    const prod = state.products.find(p => p.id === parseInt(productId));
    const stock = prod ? (prod.stockQuantity ?? 0) : 0;
    return stock + (state.editOriginalQty[productId] || 0);
}

function openEditOrderModal(orderId) {
    if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        showToast('Only administrators can edit orders', 'error');
        return;
    }
    const order = state.adminOrders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status === 'DONE') {
        showToast('Completed orders cannot be edited', 'warning');
        return;
    }

    state.editingOrderId = orderId;
    state.editItems = {};
    state.editOriginalQty = {};
    order.items.forEach(it => {
        state.editItems[it.productId] = (state.editItems[it.productId] || 0) + it.quantity;
        state.editOriginalQty[it.productId] = (state.editOriginalQty[it.productId] || 0) + it.quantity;
    });

    document.getElementById('edit-order-subtitle').innerText = `${order.orderNumber} • ${order.shop.name}`;
    populateEditAddProduct();
    renderEditOrderItems();
    document.getElementById('edit-order-modal').classList.remove('hidden');
    refreshLucide();
}

function closeEditOrderModal() {
    document.getElementById('edit-order-modal').classList.add('hidden');
    state.editingOrderId = null;
    state.editItems = {};
    state.editOriginalQty = {};
}

function populateEditAddProduct() {
    const select = document.getElementById('edit-add-product');
    if (!select) return;
    select.innerHTML = '';
    state.products
        .filter(p => p.active)
        .forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            const avail = editAvailable(p.id) - (state.editItems[p.id] || 0);
            opt.innerText = `${p.name} — ₹${p.price.toFixed(2)} (${avail} avail)`;
            select.appendChild(opt);
        });
}

function renderEditOrderItems() {
    const container = document.getElementById('edit-order-items');
    if (!container) return;
    container.innerHTML = '';

    const entries = Object.entries(state.editItems).filter(([, q]) => q > 0);
    if (entries.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-400 py-4 text-center">No items — add at least one product below.</div>';
    }

    entries.forEach(([pid, qty]) => {
        const prod = state.products.find(p => p.id === parseInt(pid));
        if (!prod) return;
        const lineTotal = prod.price * qty;
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200';
        row.innerHTML = `
            <div class="flex-1 min-w-0">
                <div class="font-bold text-slate-800 text-xs truncate">${prod.imageUrl || ''} ${prod.name}</div>
                <div class="text-[10px] text-slate-500">₹ ${prod.price.toFixed(2)} × ${qty} = <span class="font-bold text-blue-600">₹ ${lineTotal.toFixed(2)}</span></div>
            </div>
            <div class="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button onclick="editChangeQty(${pid}, -1)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">-</button>
                <input type="number" min="0" value="${qty}" onchange="editSetQty(${pid}, this.value)" class="w-10 text-center font-bold text-xs bg-transparent focus:outline-none">
                <button onclick="editChangeQty(${pid}, 1)" class="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs">+</button>
            </div>
            <button onclick="editRemoveItem(${pid})" title="Remove" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        `;
        container.appendChild(row);
    });

    renderEditOrderTotals();
    populateEditAddProduct();
    refreshLucide();
}

function renderEditOrderTotals() {
    const el = document.getElementById('edit-order-totals');
    if (!el) return;
    let subtotal = 0;
    Object.entries(state.editItems).forEach(([pid, qty]) => {
        const prod = state.products.find(p => p.id === parseInt(pid));
        if (prod && qty > 0) subtotal += prod.price * qty;
    });
    const tax = subtotal * 0.05;
    const grand = subtotal + tax;
    el.innerHTML = `
        <div class="flex justify-between text-slate-600"><span>Subtotal</span><span class="font-mono">₹ ${subtotal.toFixed(2)}</span></div>
        <div class="flex justify-between text-slate-600"><span>GST (5%)</span><span class="font-mono">₹ ${tax.toFixed(2)}</span></div>
        <div class="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-1"><span>Grand Total</span><span class="font-mono text-blue-700">₹ ${grand.toFixed(2)}</span></div>
    `;
}

function editChangeQty(productId, delta) {
    const current = state.editItems[productId] || 0;
    let next = Math.max(0, current + delta);
    const max = editAvailable(productId);
    if (next > max) {
        next = max;
        if (delta > 0) showToast(`Only ${max} unit(s) of this product available`, 'warning');
    }
    if (next === 0) delete state.editItems[productId];
    else state.editItems[productId] = next;
    renderEditOrderItems();
}

function editSetQty(productId, value) {
    let qty = parseInt(value) || 0;
    const max = editAvailable(productId);
    if (qty > max) {
        qty = max;
        showToast(`Only ${max} unit(s) of this product available`, 'warning');
    }
    if (qty <= 0) delete state.editItems[productId];
    else state.editItems[productId] = qty;
    renderEditOrderItems();
}

function editRemoveItem(productId) {
    delete state.editItems[productId];
    renderEditOrderItems();
}

function editAddProduct() {
    const select = document.getElementById('edit-add-product');
    const qtyInput = document.getElementById('edit-add-qty');
    if (!select || !select.value) return;
    const pid = parseInt(select.value);
    const addQty = Math.max(1, parseInt(qtyInput.value) || 1);
    const desired = (state.editItems[pid] || 0) + addQty;
    const max = editAvailable(pid);
    if (desired > max) {
        showToast(`Only ${max} unit(s) available`, 'warning');
        state.editItems[pid] = max;
    } else {
        state.editItems[pid] = desired;
    }
    qtyInput.value = 1;
    renderEditOrderItems();
}

async function saveOrderEdit() {
    if (!state.editingOrderId) return;
    const items = Object.entries(state.editItems)
        .filter(([, q]) => q > 0)
        .map(([productId, quantity]) => ({ productId: parseInt(productId), quantity }));
    if (items.length === 0) {
        showToast('An order must contain at least one item', 'warning');
        return;
    }

    const btn = document.getElementById('edit-order-save-btn');
    btn.disabled = true;
    btn.innerText = 'Saving...';

    try {
        const res = await fetch(`/api/orders/${state.editingOrderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterId: state.currentUser.id, items })
        });
        if (res.ok) {
            const updated = await res.json();
            closeEditOrderModal();
            await loadProductsAndCategories(); // stock changed
            await loadAdminData();             // orders + KPIs
            showToast(`Order ${updated.orderNumber} updated`, 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Failed to update order', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Server error while updating order', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Save Changes';
    }
}

async function deleteOrder(orderId) {
    if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        showToast('Only administrators can delete orders', 'error');
        return;
    }
    const order = state.adminOrders.find(o => o.id === orderId);
    if (!confirm(`Delete order ${order ? order.orderNumber : orderId}? Stock will be returned to inventory.`)) return;

    try {
        const res = await fetch(`/api/orders/${orderId}?requesterId=${state.currentUser.id}`, { method: 'DELETE' });
        if (res.ok) {
            await loadProductsAndCategories();
            await loadAdminData();
            showToast('Order deleted', 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Failed to delete order', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Server error while deleting order', 'error');
    }
}

// Merge several pending same-shop orders into one (before shipping)
async function mergeOrders(idsStr, count) {
    if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        showToast('Only administrators can merge orders', 'error');
        return;
    }
    if (!confirm(`Merge these ${count} orders into a single order? Items will be combined and the separate orders removed.`)) return;

    const ids = idsStr.split(',').map(s => parseInt(s)).filter(Boolean);
    try {
        const res = await fetch('/api/orders/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterId: state.currentUser.id, ids })
        });
        if (res.ok) {
            const merged = await res.json();
            await loadAdminData();
            showToast(`Merged into ${merged.orderNumber} (${count} orders combined)`, 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Failed to merge orders', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Server error while merging orders', 'error');
    }
}

// Master Data: Catalog, Shops, Employees
function renderAdminCatalog() {
    const tbody = document.getElementById('admin-catalog-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    state.products.forEach(p => {
        const stock = p.stockQuantity ?? 0;
        const statusBadge = stock <= 0
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Out of Stock</span>'
            : stock <= 20
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Low Stock</span>'
                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">In Stock</span>';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
            <td class="py-2.5 px-4 font-mono font-bold text-slate-700">${p.sku}</td>
            <td class="py-2.5 px-4">
                <div class="font-bold text-slate-900">${p.imageUrl || ''} ${p.name}</div>
            </td>
            <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">${p.category}</span></td>
            <td class="py-2.5 px-4 text-slate-600">${p.unit}</td>
            <td class="py-2.5 px-4">
                <div class="flex items-center gap-1.5">
                    <span class="text-slate-400 text-xs">₹</span>
                    <input type="number" min="0.01" step="0.01" value="${p.price.toFixed(2)}" id="price-input-${p.id}"
                        class="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button onclick="updateProductPrice(${p.id})"
                        class="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition active:scale-95">
                        Save
                    </button>
                </div>
            </td>
            <td class="py-2.5 px-4">
                <div class="flex items-center gap-2">
                    <input type="number" min="0" value="${stock}" id="stock-input-${p.id}"
                        class="w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button onclick="updateProductStock(${p.id})"
                        class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition active:scale-95">
                        Update
                    </button>
                    ${statusBadge}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateProductStock(productId) {
    if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        showToast('Only administrators can update inventory', 'error');
        return;
    }
    const input = document.getElementById(`stock-input-${productId}`);
    if (!input) return;
    const qty = parseInt(input.value, 10);
    if (isNaN(qty) || qty < 0) {
        showToast('Enter a valid non-negative stock quantity', 'warning');
        return;
    }

    try {
        const res = await fetch(`/api/products/${productId}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockQuantity: qty, requesterId: state.currentUser.id })
        });

        if (res.ok) {
            const updated = await res.json();
            const prod = state.products.find(p => p.id === productId);
            if (prod) prod.stockQuantity = updated.stockQuantity;
            renderAdminCatalog();
            renderProducts();
            showToast(`Stock updated: ${updated.name} → ${updated.stockQuantity} units`, 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Failed to update stock', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Server error while updating stock', 'error');
    }
}

async function updateProductPrice(productId) {
    if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        showToast('Only administrators can update prices', 'error');
        return;
    }
    const input = document.getElementById(`price-input-${productId}`);
    if (!input) return;
    const price = parseFloat(input.value);
    if (isNaN(price) || price <= 0) {
        showToast('Enter a valid price greater than 0', 'warning');
        return;
    }

    try {
        const res = await fetch(`/api/products/${productId}/price`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price, requesterId: state.currentUser.id })
        });

        if (res.ok) {
            const updated = await res.json();
            const prod = state.products.find(p => p.id === productId);
            if (prod) prod.price = updated.price;
            renderAdminCatalog();
            renderProducts();
            showToast(`Price updated: ${updated.name} → ₹${updated.price.toFixed(2)} (existing orders keep old price)`, 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Failed to update price', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Server error while updating price', 'error');
    }
}

function openAddProductModal() {
    if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        showToast('Only administrators can add products', 'error');
        return;
    }
    // Populate category (company) dropdown from existing categories
    const select = document.getElementById('new-prod-category');
    if (select) {
        select.innerHTML = '';
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            select.appendChild(opt);
        });
    }
    document.getElementById('add-product-form').reset();
    document.getElementById('add-product-modal').classList.remove('hidden');
    refreshLucide();
}

function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
}

async function handleAddProduct(e) {
    e.preventDefault();
    if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        showToast('Only administrators can add products', 'error');
        return;
    }

    const payload = {
        requesterId: state.currentUser.id,
        name: document.getElementById('new-prod-name').value,
        category: document.getElementById('new-prod-category').value,
        sku: document.getElementById('new-prod-sku').value,
        hsn: document.getElementById('new-prod-hsn').value,
        unit: document.getElementById('new-prod-unit').value,
        price: document.getElementById('new-prod-price').value,
        stockQuantity: document.getElementById('new-prod-stock').value,
        minOrderQuantity: document.getElementById('new-prod-minqty').value,
        imageUrl: document.getElementById('new-prod-image').value,
        description: document.getElementById('new-prod-description').value
    };

    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const created = await res.json();
            closeAddProductModal();
            // Refresh catalog + categories so new company categories appear everywhere
            await loadProductsAndCategories();
            renderCategoryPills();
            renderProducts();
            showToast(`Product "${created.name}" added to ${created.category}`, 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Failed to add product', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error while adding product', 'error');
    }
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

function renderInvoiceTemplate() {
    const area = document.getElementById('invoice-print-area');
    if (!area || !state.activeInvoiceData) return;

    const data = state.activeInvoiceData;
    const ord = data.order;
    const seller = data.seller || {};
    const lines = data.lineItems || [];

    const rowsHtml = lines.map(l => `
        <tr>
            <td class="inv-cell text-center">${l.sn}</td>
            <td class="inv-cell">${l.productName}</td>
            <td class="inv-cell text-center font-mono">${l.hsn || '—'}</td>
            <td class="inv-cell text-center font-mono">${Number(l.quantity).toFixed(2)}</td>
            <td class="inv-cell text-center">${l.unit || '—'}</td>
            <td class="inv-cell text-right font-mono">${l.listPrice.toFixed(2)}</td>
            <td class="inv-cell text-center">${l.cgstPct.toFixed(2)} %</td>
            <td class="inv-cell text-right font-mono">${l.cgstAmt.toFixed(2)}</td>
            <td class="inv-cell text-center">${l.sgstPct.toFixed(2)} %</td>
            <td class="inv-cell text-right font-mono">${l.sgstAmt.toFixed(2)}</td>
            <td class="inv-cell text-right font-mono font-bold">${l.amount.toFixed(2)}</td>
        </tr>
    `).join('');

    const sellerAddress = (seller.addressLines || []).map(a => `<div>${a}</div>`).join('');

    area.innerHTML = `
        <div class="tax-invoice mx-auto bg-white text-slate-900" style="max-width: 1000px;">
            <!-- Title bar -->
            <div class="flex justify-between items-start px-1 pb-1">
                <div class="text-sm font-bold">GSTIN : ${seller.gstin || ''}</div>
                <div class="text-center flex-1">
                    <div class="text-lg font-extrabold tracking-wide">TAX INVOICE</div>
                </div>
                <div class="text-xs italic w-40 text-right">Original Copy</div>
            </div>

            <!-- Seller (left) + Bill To (right) -->
            <div class="grid grid-cols-2 border border-slate-800">
                <div class="p-3 border-r border-slate-800">
                    <div class="text-base font-extrabold uppercase">${seller.name || ''}</div>
                    <div class="text-[11px] leading-snug mt-0.5">${sellerAddress}</div>
                    <div class="text-[11px] mt-1">Tel./Email : ${seller.telEmail || ''}</div>
                </div>
                <div class="p-3 text-[11px]">
                    <div><span class="font-bold">Billed to :</span> <span class="font-bold">${ord.shop.name}</span></div>
                    <div class="mt-0.5"><span class="font-bold">Address :</span> ${ord.shop.address}</div>
                    ${ord.shop.gstNumber ? `<div class="mt-0.5"><span class="font-bold">GSTIN :</span> ${ord.shop.gstNumber}</div>` : `<div class="mt-0.5"><span class="font-bold">GSTIN :</span> —</div>`}
                    <div class="mt-0.5"><span class="font-bold">Mobile No :</span> ${ord.shop.phone || ''}</div>
                </div>
            </div>

            <!-- Invoice meta row -->
            <div class="grid grid-cols-3 border-l border-r border-b border-slate-800 text-[11px]">
                <div class="p-2 border-r border-slate-800"><span class="font-bold">Invoice No. :</span> ${data.invoiceNumber}</div>
                <div class="p-2 border-r border-slate-800"><span class="font-bold">Dated :</span> ${data.invoiceDate}</div>
                <div class="p-2"><span class="font-bold">Place of Supply :</span> ${data.placeOfSupply || ''}</div>
            </div>
            ${data.sourceOrders && data.sourceOrders.length > 1 ? `
            <div class="border-l border-r border-b border-slate-800 text-[11px] p-2 bg-slate-50">
                <span class="font-bold">Combined bill for orders :</span> ${data.sourceOrders.join(', ')}
            </div>` : ''}

            <!-- Line items table -->
            <table class="w-full border-l border-r border-b border-slate-800 text-[11px] border-collapse">
                <thead>
                    <tr class="bg-slate-100 font-bold text-center">
                        <th class="inv-cell w-8">S.N.</th>
                        <th class="inv-cell text-left">Goods / Services supplied</th>
                        <th class="inv-cell">HSN/SAC</th>
                        <th class="inv-cell">Qty.</th>
                        <th class="inv-cell">Unit</th>
                        <th class="inv-cell">List Price</th>
                        <th class="inv-cell">CGST (%)</th>
                        <th class="inv-cell">CGST Amt.</th>
                        <th class="inv-cell">SGST (%)</th>
                        <th class="inv-cell">SGST Amt.</th>
                        <th class="inv-cell">Amount(₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    <tr>
                        <td class="inv-cell" colspan="6"></td>
                        <td class="inv-cell text-center font-bold">2.50 %</td>
                        <td class="inv-cell text-right font-mono font-bold">${data.totalCgst.toFixed(2)}</td>
                        <td class="inv-cell text-center font-bold">2.50 %</td>
                        <td class="inv-cell text-right font-mono font-bold">${data.totalSgst.toFixed(2)}</td>
                        <td class="inv-cell"></td>
                    </tr>
                    <tr>
                        <td class="inv-cell text-right font-semibold" colspan="10">Less : Rounded Off (-)</td>
                        <td class="inv-cell text-right font-mono">${data.roundOff.toFixed(2)}</td>
                    </tr>
                    <tr class="bg-slate-100">
                        <td class="inv-cell text-right font-extrabold" colspan="10">Grand Total ₹</td>
                        <td class="inv-cell text-right font-mono font-extrabold">${data.grandTotalRounded.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Signatures -->
            <div class="grid grid-cols-2 border-l border-r border-b border-slate-800 text-[11px]">
                <div class="p-6 border-r border-slate-800 flex items-end">
                    <span class="italic">Receiver's Signature ______________________</span>
                </div>
                <div class="p-3 text-right">
                    <div class="font-bold">For ${seller.name || ''}</div>
                    <div class="mt-8 italic">Authorised Signatory</div>
                </div>
            </div>
        </div>
    `;
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
