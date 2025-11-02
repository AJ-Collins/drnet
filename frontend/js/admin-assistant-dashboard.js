// Admin Assistant Dashboard JavaScript - Inventory Management System

let inventoryData = [];
let movementHistory = [];
let currentUser = null;

async function initAdminAssistantDashboard() {
    console.log('🚀 Admin Assistant Dashboard initializing...');
    updateTime();
    setInterval(updateTime, 1000);
    
    await loadStaffProfile();
    await loadInventoryData();
    setupSidebar();
    initCharts();
    loadRecentActivities();
    checkLowStockAlerts();
}

function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = now.toLocaleString();
    }
}

async function loadStaffProfile() {
    try {
        const res = await fetch(`${window.BASE_URL}/api/staff/profile`, {
            credentials: 'include'
        });

        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = '/staff/login';
                return;
            }
            throw new Error('Failed to load profile');
        }

        const profile = await res.json();
        currentUser = profile;
        
        // Update UI with profile data
        const staffNameElement = document.getElementById('staffName');
        const userInitialElement = document.getElementById('userInitial');
        
        if (staffNameElement && profile.name) {
            staffNameElement.textContent = `${profile.name} - ${profile.position}`;
        }
        
        if (userInitialElement && profile.name) {
            userInitialElement.textContent = profile.name.charAt(0).toUpperCase();
        }

    } catch (error) {
        console.error('❌ Error loading staff profile:', error);
        const staffNameElement = document.getElementById('staffName');
        if (staffNameElement) {
            staffNameElement.textContent = 'Admin Assistant';
        }
    }
}

async function loadInventoryData() {
    try {
        // For now, using sample data - will be replaced with API calls
        inventoryData = [
            {
                id: 1,
                name: 'Wireless Router AC1900',
                category: 'routers',
                model: 'WR-AC1900',
                serial: 'WR190001',
                quantity: 45,
                minStock: 10,
                location: 'warehouse-a',
                supplier: 'TechCorp Ltd',
                status: 'available'
            },
            {
                id: 2,
                name: 'Ethernet Cable Cat6 - 2m',
                category: 'cables',
                model: 'CAT6-2M',
                serial: 'EC62001',
                quantity: 8,
                minStock: 50,
                location: 'warehouse-b',
                supplier: 'CableCo Inc',
                status: 'low-stock'
            },
            {
                id: 3,
                name: 'Fiber Optic Modem',
                category: 'modems',
                model: 'FOM-2000',
                serial: 'FOM2001',
                quantity: 23,
                minStock: 15,
                location: 'warehouse-a',
                supplier: 'FiberNet Solutions',
                status: 'available'
            },
            {
                id: 4,
                name: '24-Port Network Switch',
                category: 'switches',
                model: 'NS-24P',
                serial: 'NS24001',
                quantity: 12,
                minStock: 5,
                location: 'server-room',
                supplier: 'NetworkPro Ltd',
                status: 'available'
            },
            {
                id: 5,
                name: 'Wireless Access Point',
                category: 'accessories',
                model: 'WAP-AC1200',
                serial: 'WAP1201',
                quantity: 3,
                minStock: 8,
                location: 'office-storage',
                supplier: 'WifiMax Corp',
                status: 'low-stock'
            }
        ];

        updateInventoryStats();
        loadInventoryTable();
        populateItemSelects();
        
    } catch (error) {
        console.error('❌ Error loading inventory data:', error);
    }
}

function updateInventoryStats() {
    const totalItems = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventoryData.filter(item => item.quantity <= item.minStock).length;
    const itemsIssuedToday = 47; // Sample data
    const pendingReorders = 8; // Sample data

    document.getElementById('totalItems').textContent = totalItems.toLocaleString();
    document.getElementById('lowStockItems').textContent = lowStockItems;
    document.getElementById('itemsIssued').textContent = itemsIssuedToday;
    document.getElementById('pendingReorders').textContent = pendingReorders;
    document.getElementById('alertCount').textContent = lowStockItems;
}

function loadInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = inventoryData.map(item => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-900">${item.name}</td>
            <td class="px-4 py-3 text-sm text-gray-600 capitalize">${item.category}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${item.model}<br><small class="text-gray-400">${item.serial}</small></td>
            <td class="px-4 py-3 text-sm">
                <span class="font-medium ${item.quantity <= item.minStock ? 'text-red-600' : 'text-gray-900'}">${item.quantity}</span>
                <br><small class="text-gray-400">Min: ${item.minStock}</small>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 capitalize">${item.location.replace('-', ' ')}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}">${getStatusText(item.status)}</span>
            </td>
            <td class="px-4 py-3 text-sm">
                <button onclick="editItem(${item.id})" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                <button onclick="viewItemHistory(${item.id})" class="text-green-600 hover:text-green-800">History</button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    switch (status) {
        case 'available': return 'bg-green-100 text-green-800';
        case 'low-stock': return 'bg-yellow-100 text-yellow-800';
        case 'out-of-stock': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'available': return 'Available';
        case 'low-stock': return 'Low Stock';
        case 'out-of-stock': return 'Out of Stock';
        default: return 'Unknown';
    }
}

function populateItemSelects() {
    const issueSelect = document.getElementById('issueItem');
    const returnSelect = document.getElementById('returnItem');

    if (issueSelect) {
        issueSelect.innerHTML = '<option value="">Choose item to issue</option>' +
            inventoryData.map(item => 
                `<option value="${item.id}">${item.name} (Available: ${item.quantity})</option>`
            ).join('');
    }

    if (returnSelect) {
        returnSelect.innerHTML = '<option value="">Choose item to return</option>' +
            inventoryData.map(item => 
                `<option value="${item.id}">${item.name}</option>`
            ).join('');
    }
}

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const openSidebar = document.getElementById('openSidebar');
    const closeSidebar = document.getElementById('closeSidebar');

    if (openSidebar) {
        openSidebar.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }
}

function showSection(sectionId) {
    // Hide all content sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('hidden'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active', 'bg-white/20');
        item.classList.add('hover:bg-white/20');
    });
    
    // Add active class to current nav item
    const activeNav = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeNav) {
        activeNav.classList.add('active', 'bg-white/20');
        activeNav.classList.remove('hover:bg-white/20');
    }
}

function initCharts() {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;

    const categoryData = {
        'Routers': inventoryData.filter(item => item.category === 'routers').reduce((sum, item) => sum + item.quantity, 0),
        'Cables': inventoryData.filter(item => item.category === 'cables').reduce((sum, item) => sum + item.quantity, 0),
        'Modems': inventoryData.filter(item => item.category === 'modems').reduce((sum, item) => sum + item.quantity, 0),
        'Switches': inventoryData.filter(item => item.category === 'switches').reduce((sum, item) => sum + item.quantity, 0),
        'Accessories': inventoryData.filter(item => item.category === 'accessories').reduce((sum, item) => sum + item.quantity, 0)
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    '#3B82F6', // Blue
                    '#10B981', // Green
                    '#F59E0B', // Yellow
                    '#8B5CF6', // Purple
                    '#EF4444'  // Red
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function loadRecentActivities() {
    // Sample activities - will be replaced with real data
    const activities = [
        { action: 'Added 50x Ethernet Cables', details: 'Cat6 - 2 meters - 10:30 AM', type: 'add' },
        { action: 'Issued 5x Wireless Routers', details: 'To Technical Department - 9:45 AM', type: 'issue' },
        { action: 'Low Stock Alert: Fiber Modems', details: 'Only 8 units remaining - 8:30 AM', type: 'alert' },
        { action: 'Reorder Request Approved', details: '100x Network Switches - Yesterday', type: 'reorder' }
    ];

    // Activities are already loaded in HTML, this function can be used to dynamically update them
}

function checkLowStockAlerts() {
    const lowStockItems = inventoryData.filter(item => item.quantity <= item.minStock);
    
    if (lowStockItems.length > 0) {
        console.log(`⚠️ ${lowStockItems.length} items are running low on stock`);
        // Can add more sophisticated alerting here
    }
}

// Form handling functions
document.addEventListener('DOMContentLoaded', function() {
    // Add Item Form
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleAddItem();
        });
    }

    // Issue Item Form
    const issueItemForm = document.getElementById('issueItemForm');
    if (issueItemForm) {
        issueItemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleIssueItem();
        });
    }

    // Return Item Form
    const returnItemForm = document.getElementById('returnItemForm');
    if (returnItemForm) {
        returnItemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleReturnItem();
        });
    }
});

async function handleAddItem() {
    const formData = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        model: document.getElementById('itemModel').value,
        serial: document.getElementById('itemSerial').value,
        quantity: parseInt(document.getElementById('itemQuantity').value),
        supplier: document.getElementById('itemSupplier').value,
        location: document.getElementById('itemLocation').value,
        minStock: parseInt(document.getElementById('minStock').value) || 0,
        description: document.getElementById('itemDescription').value
    };

    try {
        // For now, add to local data - will be replaced with API call
        const newItem = {
            id: inventoryData.length + 1,
            ...formData,
            status: formData.quantity <= formData.minStock ? 'low-stock' : 'available'
        };
        
        inventoryData.push(newItem);
        
        // Update displays
        updateInventoryStats();
        loadInventoryTable();
        populateItemSelects();
        
        // Notify admin about the addition
        await notifyAdmin(`New inventory item added: ${formData.name} (Qty: ${formData.quantity})`, 'inventory_add');
        
        Swal.fire({
            icon: 'success',
            title: 'Item Added Successfully!',
            text: `${formData.name} has been added to inventory`,
            timer: 2000
        });

        document.getElementById('addItemForm').reset();
        
    } catch (error) {
        console.error('Error adding item:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add item to inventory'
        });
    }
}

async function handleIssueItem() {
    const itemId = parseInt(document.getElementById('issueItem').value);
    const quantity = parseInt(document.getElementById('issueQuantity').value);
    const issuedTo = document.getElementById('issuedTo').value;
    const purpose = document.getElementById('issuePurpose').value;

    if (!itemId || !quantity || !issuedTo) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Information',
            text: 'Please fill in all required fields'
        });
        return;
    }

    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
        Swal.fire({
            icon: 'error',
            title: 'Item Not Found',
            text: 'Selected item not found in inventory'
        });
        return;
    }

    if (quantity > item.quantity) {
        Swal.fire({
            icon: 'error',
            title: 'Insufficient Stock',
            text: `Only ${item.quantity} units available`
        });
        return;
    }

    try {
        // Update quantity
        item.quantity -= quantity;
        item.status = item.quantity <= item.minStock ? 'low-stock' : 'available';
        if (item.quantity === 0) item.status = 'out-of-stock';

        // Log movement
        const movement = {
            id: Date.now(),
            itemId: item.id,
            itemName: item.name,
            type: 'issue',
            quantity: quantity,
            user: currentUser ? currentUser.name : 'Admin Assistant',
            department: issuedTo,
            purpose: purpose,
            timestamp: new Date().toISOString()
        };
        movementHistory.unshift(movement);

        // Update displays
        updateInventoryStats();
        loadInventoryTable();
        populateItemSelects();

        // Notify admin
        await notifyAdmin(`Items issued: ${quantity}x ${item.name} to ${issuedTo}`, 'inventory_issue');

        Swal.fire({
            icon: 'success',
            title: 'Items Issued Successfully!',
            text: `${quantity}x ${item.name} issued to ${issuedTo}`,
            timer: 2000
        });

        document.getElementById('issueItemForm').reset();

    } catch (error) {
        console.error('Error issuing item:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to issue items'
        });
    }
}

async function handleReturnItem() {
    const itemId = parseInt(document.getElementById('returnItem').value);
    const quantity = parseInt(document.getElementById('returnQuantity').value);
    const returnedBy = document.getElementById('returnedBy').value;
    const condition = document.getElementById('itemCondition').value;
    const notes = document.getElementById('returnNotes').value;

    if (!itemId || !quantity || !returnedBy) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Information',
            text: 'Please fill in all required fields'
        });
        return;
    }

    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
        Swal.fire({
            icon: 'error',
            title: 'Item Not Found',
            text: 'Selected item not found in inventory'
        });
        return;
    }

    try {
        // Update quantity only if items are in good condition
        if (condition === 'good') {
            item.quantity += quantity;
            item.status = item.quantity <= item.minStock ? 'low-stock' : 'available';
        }

        // Log movement
        const movement = {
            id: Date.now(),
            itemId: item.id,
            itemName: item.name,
            type: 'return',
            quantity: quantity,
            user: currentUser ? currentUser.name : 'Admin Assistant',
            returnedBy: returnedBy,
            condition: condition,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        movementHistory.unshift(movement);

        // Update displays
        updateInventoryStats();
        loadInventoryTable();
        populateItemSelects();

        // Notify admin
        await notifyAdmin(`Items returned: ${quantity}x ${item.name} by ${returnedBy} (${condition})`, 'inventory_return');

        Swal.fire({
            icon: 'success',
            title: 'Items Returned Successfully!',
            text: `${quantity}x ${item.name} returned by ${returnedBy}`,
            timer: 2000
        });

        document.getElementById('returnItemForm').reset();

    } catch (error) {
        console.error('Error returning item:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to process return'
        });
    }
}

async function notifyAdmin(message, type) {
    try {
        // This will send notifications to admin about inventory changes
        await fetch(`${window.BASE_URL}/api/admin/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                message: message,
                type: type,
                from: currentUser ? currentUser.name : 'Admin Assistant',
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Failed to notify admin:', error);
    }
}

function editItem(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) return;

    Swal.fire({
        title: 'Edit Inventory Item',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                    <input id="edit-name" class="w-full p-2 border rounded" value="${item.name}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input id="edit-quantity" type="number" class="w-full p-2 border rounded" value="${item.quantity}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                    <input id="edit-minstock" type="number" class="w-full p-2 border rounded" value="${item.minStock}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select id="edit-location" class="w-full p-2 border rounded">
                        <option value="warehouse-a" ${item.location === 'warehouse-a' ? 'selected' : ''}>Warehouse A</option>
                        <option value="warehouse-b" ${item.location === 'warehouse-b' ? 'selected' : ''}>Warehouse B</option>
                        <option value="office-storage" ${item.location === 'office-storage' ? 'selected' : ''}>Office Storage</option>
                        <option value="server-room" ${item.location === 'server-room' ? 'selected' : ''}>Server Room</option>
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update Item',
        preConfirm: () => {
            const name = document.getElementById('edit-name').value;
            const quantity = parseInt(document.getElementById('edit-quantity').value);
            const minStock = parseInt(document.getElementById('edit-minstock').value);
            const location = document.getElementById('edit-location').value;
            
            if (!name.trim() || isNaN(quantity) || quantity < 0) {
                Swal.showValidationMessage('Please enter valid values');
                return false;
            }
            return { name, quantity, minStock, location };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { name, quantity, minStock, location } = result.value;
            
            // Update item
            item.name = name;
            item.quantity = quantity;
            item.minStock = minStock;
            item.location = location;
            item.status = quantity <= minStock ? 'low-stock' : 'available';
            if (quantity === 0) item.status = 'out-of-stock';

            // Update displays
            updateInventoryStats();
            loadInventoryTable();
            populateItemSelects();

            // Notify admin
            await notifyAdmin(`Inventory item updated: ${name}`, 'inventory_update');

            Swal.fire({
                icon: 'success',
                title: 'Item Updated!',
                text: `${name} has been updated successfully`,
                timer: 2000
            });
        }
    });
}

function viewItemHistory(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) return;

    const itemMovements = movementHistory.filter(m => m.itemId === itemId);
    
    const historyHtml = itemMovements.length > 0 
        ? itemMovements.map(m => `
            <div class="border-l-4 ${m.type === 'issue' ? 'border-red-500' : 'border-green-500'} pl-4 py-2 mb-3">
                <div class="font-medium">${m.type === 'issue' ? '📤 Issued' : '📥 Returned'}: ${m.quantity} units</div>
                <div class="text-sm text-gray-600">
                    ${m.type === 'issue' ? `To: ${m.department}` : `By: ${m.returnedBy}`}<br>
                    Date: ${new Date(m.timestamp).toLocaleString()}<br>
                    ${m.purpose || m.notes || 'No additional notes'}
                </div>
            </div>
        `).join('')
        : '<p class="text-gray-500 text-center py-4">No movement history available</p>';

    Swal.fire({
        title: `📋 Movement History: ${item.name}`,
        html: `
            <div class="text-left max-h-96 overflow-y-auto">
                <div class="bg-gray-50 p-3 rounded mb-4">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Current Stock:</strong> ${item.quantity}</div>
                        <div><strong>Minimum Stock:</strong> ${item.minStock}</div>
                        <div><strong>Location:</strong> ${item.location.replace('-', ' ')}</div>
                        <div><strong>Status:</strong> ${getStatusText(item.status)}</div>
                    </div>
                </div>
                ${historyHtml}
            </div>
        `,
        width: '600px',
        showConfirmButton: false,
        showCloseButton: true
    });
}

async function logout() {
    const result = await Swal.fire({
        title: 'Confirm Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Logout'
    });

    if (result.isConfirmed) {
        try {
            await fetch(`${window.BASE_URL}/api/staff/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            window.location.href = '/';
        }
    }
}

// Team Communication function
function showAdminAssistantCommunication() {
    window.location.href = 'staff-communication.html';
}