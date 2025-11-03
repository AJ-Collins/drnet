// Customer Care Dashboard JavaScript

let ticketsData = [];
let customersData = [];
let currentUser = null;

async function initCustomerCareDashboard() {
    console.log('🚀 Customer Care Dashboard initializing...');
    updateTime();
    setInterval(updateTime, 1000);
    
    await loadStaffProfile();
    await loadTicketsData();
    await loadCustomersData();
    setupSidebar();
    initCharts();
    loadRecentTickets();
    updateDashboardStats();
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
            staffNameElement.textContent = 'Customer Care Agent';
        }
    }
}

async function loadTicketsData() {
    try {
        // Sample tickets data - will be replaced with API calls
        ticketsData = [
            {
                id: 'TCK-1001',
                customerId: 1,
                customerName: 'John Smith',
                subject: 'Internet Outage in Building',
                category: 'connectivity',
                priority: 'high',
                status: 'open',
                description: 'Complete internet outage affecting entire apartment building on Main Street',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                assignedTo: 'tech1',
                contactMethod: 'phone',
                expectedResolution: 4
            },
            {
                id: 'TCK-1002',
                customerId: 2,
                customerName: 'Sarah Davis',
                subject: 'Slow Internet Speed',
                category: 'speed',
                priority: 'medium',
                status: 'pending',
                description: 'Customer experiencing significantly slower speeds than subscribed package',
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
                assignedTo: 'tech2',
                contactMethod: 'email',
                expectedResolution: 24
            },
            {
                id: 'TCK-1003',
                customerId: 3,
                customerName: 'Mike Johnson',
                subject: 'Billing Inquiry - Overcharge',
                category: 'billing',
                priority: 'low',
                status: 'resolved',
                description: 'Customer questioning charges on latest invoice',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                assignedTo: 'billing',
                contactMethod: 'chat',
                expectedResolution: 72,
                resolution: 'Billing error corrected, refund processed'
            },
            {
                id: 'TCK-1004',
                customerId: 4,
                customerName: 'Lisa Wang',
                subject: 'Router Replacement Needed',
                category: 'equipment',
                priority: 'medium',
                status: 'open',
                description: 'Customer router appears to be malfunctioning, frequent disconnections',
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
                assignedTo: 'tech1',
                contactMethod: 'phone',
                expectedResolution: 48
            },
            {
                id: 'TCK-1005',
                customerId: 5,
                customerName: 'David Brown',
                subject: 'New Installation Request',
                category: 'installation',
                priority: 'low',
                status: 'pending',
                description: 'Customer requesting new internet connection at secondary residence',
                createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                assignedTo: 'tech2',
                contactMethod: 'email',
                expectedResolution: 168
            }
        ];

        loadTicketsTable();
        
    } catch (error) {
        console.error('❌ Error loading tickets data:', error);
    }
}

async function loadCustomersData() {
    try {
        // Sample customers data - will be replaced with API calls
        customersData = [
            {
                id: 1,
                name: 'John Smith',
                email: 'john.smith@email.com',
                phone: '+1-234-567-1001',
                address: '123 Main Street, Apt 4B',
                package: 'Premium Plus',
                status: 'active',
                lastContact: new Date(Date.now() - 2 * 60 * 60 * 1000),
                serviceHistory: ['Router installation', 'Speed upgrade', 'Technical support'],
                notes: 'VIP customer, priority support'
            },
            {
                id: 2,
                name: 'Sarah Davis',
                email: 'sarah.davis@email.com',
                phone: '+1-234-567-1002',
                address: '456 Oak Avenue',
                package: 'Standard',
                status: 'active',
                lastContact: new Date(Date.now() - 4 * 60 * 60 * 1000),
                serviceHistory: ['Initial setup', 'Billing inquiry'],
                notes: 'Regular customer, no special requirements'
            },
            {
                id: 3,
                name: 'Mike Johnson',
                email: 'mike.johnson@email.com',
                phone: '+1-234-567-1003',
                address: '789 Pine Street',
                package: 'Basic',
                status: 'active',
                lastContact: new Date(Date.now() - 24 * 60 * 60 * 1000),
                serviceHistory: ['Installation', 'Payment assistance', 'Technical support'],
                notes: 'Occasional payment delays, but generally reliable'
            },
            {
                id: 4,
                name: 'Lisa Wang',
                email: 'lisa.wang@email.com',
                phone: '+1-234-567-1004',
                address: '321 Elm Drive',
                package: 'Premium',
                status: 'active',
                lastContact: new Date(Date.now() - 6 * 60 * 60 * 1000),
                serviceHistory: ['Setup', 'Router replacement', 'Speed test'],
                notes: 'Tech-savvy customer, provides detailed issue descriptions'
            },
            {
                id: 5,
                name: 'David Brown',
                email: 'david.brown@email.com',
                phone: '+1-234-567-1005',
                address: '654 Maple Lane',
                package: 'Standard',
                status: 'pending',
                lastContact: new Date(Date.now() - 8 * 60 * 60 * 1000),
                serviceHistory: ['Initial consultation'],
                notes: 'New customer, installation pending'
            }
        ];

        loadCustomersTable();
        
    } catch (error) {
        console.error('❌ Error loading customers data:', error);
    }
}

function updateDashboardStats() {
    const activeTickets = ticketsData.filter(t => t.status === 'open' || t.status === 'pending').length;
    const resolvedToday = ticketsData.filter(t => {
        const today = new Date();
        const ticketDate = new Date(t.updatedAt);
        return t.status === 'resolved' && 
               ticketDate.toDateString() === today.toDateString();
    }).length;
    
    const urgentTickets = ticketsData.filter(t => t.priority === 'high' || t.priority === 'critical').length;
    
    document.getElementById('activeTicketsCount').textContent = activeTickets;
    document.getElementById('resolvedToday').textContent = resolvedToday;
    document.getElementById('urgentTickets').textContent = urgentTickets;
    document.getElementById('avgResponseTime').textContent = '15m';
    document.getElementById('customerRating').textContent = '4.8★';
    document.getElementById('activeChats').textContent = '3';
}

function loadTicketsTable() {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;

    tbody.innerHTML = ticketsData.map(ticket => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-medium text-blue-600">${ticket.id}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${ticket.customerName}</td>
            <td class="px-4 py-3 text-sm text-gray-600 capitalize">${ticket.category}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}">${ticket.priority}</span>
            </td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}">${ticket.status}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">${formatRelativeTime(ticket.createdAt)}</td>
            <td class="px-4 py-3 text-sm">
                <button onclick="viewTicket('${ticket.id}')" class="text-blue-600 hover:text-blue-800 mr-2">View</button>
                <button onclick="updateTicket('${ticket.id}')" class="text-green-600 hover:text-green-800">Update</button>
            </td>
        </tr>
    `).join('');
}

function loadCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    tbody.innerHTML = customersData.map(customer => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
                <div>
                    <div class="text-sm font-medium text-gray-900">${customer.name}</div>
                    <div class="text-sm text-gray-500">${customer.email}</div>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">${customer.phone}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${customer.package}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getCustomerStatusBadge(customer.status)}">${customer.status}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">${formatRelativeTime(customer.lastContact)}</td>
            <td class="px-4 py-3 text-sm">
                <button onclick="viewCustomer(${customer.id})" class="text-blue-600 hover:text-blue-800 mr-2">View</button>
                <button onclick="contactCustomer('${customer.phone}', '${customer.name}')" class="text-green-600 hover:text-green-800">Contact</button>
            </td>
        </tr>
    `).join('');
}

function getPriorityBadge(priority) {
    switch (priority) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'high': return 'bg-orange-100 text-orange-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusBadge(status) {
    switch (status) {
        case 'open': return 'bg-red-100 text-red-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'resolved': return 'bg-green-100 text-green-800';
        case 'closed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-blue-100 text-blue-800';
    }
}

function getCustomerStatusBadge(status) {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'suspended': return 'bg-red-100 text-red-800';
        case 'inactive': return 'bg-gray-100 text-gray-800';
        default: return 'bg-blue-100 text-blue-800';
    }
}

function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
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
    const ctx = document.getElementById('ticketChart');
    if (!ctx) return;

    // Sample data for daily ticket resolution
    const dailyData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Tickets Resolved',
            data: [12, 18, 15, 22, 16, 8, 5],
            backgroundColor: 'rgba(20, 184, 166, 0.6)',
            borderColor: 'rgba(20, 184, 166, 1)',
            borderWidth: 2,
            fill: true
        }, {
            label: 'New Tickets',
            data: [8, 15, 12, 18, 14, 6, 3],
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            fill: true
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: dailyData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Tickets'
                    }
                }
            }
        }
    });
}

function loadRecentTickets() {
    // Recent tickets are already displayed in the HTML
    // This function can be used to dynamically update them
}

// Form handling
document.addEventListener('DOMContentLoaded', function() {
    const newTicketForm = document.getElementById('newTicketForm');
    if (newTicketForm) {
        newTicketForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleCreateTicket();
        });
    }
});

async function handleCreateTicket() {
    const formData = {
        customerId: document.getElementById('ticketCustomer').value,
        category: document.getElementById('issueCategory').value,
        priority: document.getElementById('priorityLevel').value,
        subject: document.getElementById('issueSubject').value,
        description: document.getElementById('issueDescription').value,
        contactMethod: document.getElementById('contactMethod').value,
        expectedResolution: document.getElementById('expectedResolution').value,
        assignedTo: document.getElementById('assignTicket').value
    };

    if (!formData.customerId || !formData.category || !formData.priority || 
        !formData.subject || !formData.description) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Information',
            text: 'Please fill in all required fields'
        });
        return;
    }

    try {
        // Generate ticket ID
        const ticketId = `TCK-${Date.now().toString().slice(-4)}`;
        
        // Find customer name
        const customer = customersData.find(c => c.id == formData.customerId);
        const customerName = customer ? customer.name : 'Unknown Customer';

        // Create new ticket object
        const newTicket = {
            id: ticketId,
            customerId: parseInt(formData.customerId),
            customerName: customerName,
            subject: formData.subject,
            category: formData.category,
            priority: formData.priority,
            status: 'open',
            description: formData.description,
            createdAt: new Date(),
            updatedAt: new Date(),
            assignedTo: formData.assignedTo || 'auto',
            contactMethod: formData.contactMethod,
            expectedResolution: parseInt(formData.expectedResolution)
        };

        // Add to tickets array
        ticketsData.unshift(newTicket);

        // Update displays
        updateDashboardStats();
        loadTicketsTable();

        // Notify admin about the new ticket
        await notifyAdmin(`New support ticket created: ${ticketId} - ${formData.subject}`, 'ticket_create');

        Swal.fire({
            icon: 'success',
            title: 'Ticket Created Successfully!',
            html: `
                <div class="text-left">
                    <p><strong>Ticket ID:</strong> ${ticketId}</p>
                    <p><strong>Customer:</strong> ${customerName}</p>
                    <p><strong>Priority:</strong> ${formData.priority}</p>
                    <p><strong>Expected Resolution:</strong> ${formData.expectedResolution} hours</p>
                </div>
            `,
            timer: 3000
        });

        document.getElementById('newTicketForm').reset();
        
    } catch (error) {
        console.error('Error creating ticket:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create support ticket'
        });
    }
}

function viewTicket(ticketId) {
    const ticket = ticketsData.find(t => t.id === ticketId);
    if (!ticket) return;

    const customer = customersData.find(c => c.id === ticket.customerId);
    
    Swal.fire({
        title: `🎫 Ticket Details: ${ticket.id}`,
        html: `
            <div class="text-left space-y-4">
                <div class="bg-gray-50 p-4 rounded">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Customer:</strong> ${ticket.customerName}</div>
                        <div><strong>Priority:</strong> <span class="px-2 py-1 rounded text-xs ${getPriorityBadge(ticket.priority)}">${ticket.priority}</span></div>
                        <div><strong>Status:</strong> <span class="px-2 py-1 rounded text-xs ${getStatusBadge(ticket.status)}">${ticket.status}</span></div>
                        <div><strong>Category:</strong> ${ticket.category}</div>
                        <div><strong>Created:</strong> ${ticket.createdAt.toLocaleString()}</div>
                        <div><strong>Contact:</strong> ${ticket.contactMethod}</div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Subject:</h4>
                    <p class="bg-blue-50 p-2 rounded">${ticket.subject}</p>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Description:</h4>
                    <p class="bg-gray-50 p-2 rounded">${ticket.description}</p>
                </div>
                
                ${customer ? `
                <div>
                    <h4 class="font-semibold mb-2">Customer Info:</h4>
                    <div class="bg-green-50 p-2 rounded text-sm">
                        <p><strong>Phone:</strong> ${customer.phone}</p>
                        <p><strong>Email:</strong> ${customer.email}</p>
                        <p><strong>Package:</strong> ${customer.package}</p>
                    </div>
                </div>
                ` : ''}
                
                ${ticket.resolution ? `
                <div>
                    <h4 class="font-semibold mb-2">Resolution:</h4>
                    <p class="bg-green-50 p-2 rounded">${ticket.resolution}</p>
                </div>
                ` : ''}
            </div>
        `,
        width: '700px',
        showCancelButton: ticket.status !== 'resolved',
        confirmButtonText: ticket.status === 'resolved' ? 'Close' : 'Update Ticket',
        cancelButtonText: 'Contact Customer'
    }).then((result) => {
        if (result.isConfirmed && ticket.status !== 'resolved') {
            updateTicket(ticketId);
        } else if (result.dismiss === Swal.DismissReason.cancel && customer) {
            contactCustomer(customer.phone, customer.name);
        }
    });
}

function updateTicket(ticketId) {
    const ticket = ticketsData.find(t => t.id === ticketId);
    if (!ticket) return;

    Swal.fire({
        title: `Update Ticket: ${ticketId}`,
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select id="update-status" class="w-full p-2 border rounded">
                        <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                        <option value="pending" ${ticket.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select id="update-priority" class="w-full p-2 border rounded">
                        <option value="low" ${ticket.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${ticket.priority === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${ticket.priority === 'high' ? 'selected' : ''}>High</option>
                        <option value="critical" ${ticket.priority === 'critical' ? 'selected' : ''}>Critical</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Update Notes</label>
                    <textarea id="update-notes" rows="4" class="w-full p-2 border rounded" placeholder="Add update or resolution notes..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update Ticket',
        preConfirm: () => {
            const status = document.getElementById('update-status').value;
            const priority = document.getElementById('update-priority').value;
            const notes = document.getElementById('update-notes').value;
            
            return { status, priority, notes };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { status, priority, notes } = result.value;
            
            // Update ticket
            ticket.status = status;
            ticket.priority = priority;
            ticket.updatedAt = new Date();
            if (notes && status === 'resolved') {
                ticket.resolution = notes;
            }

            // Update displays
            updateDashboardStats();
            loadTicketsTable();

            // Notify admin
            await notifyAdmin(`Ticket updated: ${ticketId} - Status: ${status}`, 'ticket_update');

            Swal.fire({
                icon: 'success',
                title: 'Ticket Updated!',
                text: `Ticket ${ticketId} has been updated successfully`,
                timer: 2000
            });
        }
    });
}

function viewCustomer(customerId) {
    const customer = customersData.find(c => c.id === customerId);
    if (!customer) return;

    const customerTickets = ticketsData.filter(t => t.customerId === customerId);
    
    Swal.fire({
        title: `👤 Customer Profile: ${customer.name}`,
        html: `
            <div class="text-left space-y-4">
                <div class="bg-blue-50 p-4 rounded">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Phone:</strong> ${customer.phone}</div>
                        <div><strong>Email:</strong> ${customer.email}</div>
                        <div><strong>Package:</strong> ${customer.package}</div>
                        <div><strong>Status:</strong> <span class="px-2 py-1 rounded text-xs ${getCustomerStatusBadge(customer.status)}">${customer.status}</span></div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Address:</h4>
                    <p class="bg-gray-50 p-2 rounded">${customer.address}</p>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Service History:</h4>
                    <ul class="bg-green-50 p-2 rounded text-sm">
                        ${customer.serviceHistory.map(service => `<li>• ${service}</li>`).join('')}
                    </ul>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Recent Tickets (${customerTickets.length}):</h4>
                    <div class="bg-yellow-50 p-2 rounded text-sm max-h-32 overflow-y-auto">
                        ${customerTickets.length > 0 
                            ? customerTickets.map(t => `
                                <div class="mb-1">
                                    <strong>${t.id}:</strong> ${t.subject} 
                                    <span class="px-1 rounded text-xs ${getStatusBadge(t.status)}">${t.status}</span>
                                </div>
                            `).join('')
                            : '<p>No tickets found</p>'
                        }
                    </div>
                </div>
                
                ${customer.notes ? `
                <div>
                    <h4 class="font-semibold mb-2">Notes:</h4>
                    <p class="bg-purple-50 p-2 rounded text-sm">${customer.notes}</p>
                </div>
                ` : ''}
            </div>
        `,
        width: '700px',
        showCancelButton: true,
        confirmButtonText: 'Contact Customer',
        cancelButtonText: 'Create Ticket'
    }).then((result) => {
        if (result.isConfirmed) {
            contactCustomer(customer.phone, customer.name);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            showSection('new-ticket');
            // Pre-select customer in the form
            setTimeout(() => {
                const customerSelect = document.getElementById('ticketCustomer');
                if (customerSelect) {
                    customerSelect.value = customerId;
                }
            }, 100);
        }
    });
}

function searchCustomer() {
    Swal.fire({
        title: '🔍 Search Customer',
        input: 'text',
        inputPlaceholder: 'Enter customer name or phone number',
        showCancelButton: true,
        confirmButtonText: 'Search',
        inputValidator: (value) => {
            if (!value) {
                return 'Please enter a search term';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const searchTerm = result.value.toLowerCase();
            const matchedCustomers = customersData.filter(customer => 
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.phone.includes(searchTerm) ||
                customer.email.toLowerCase().includes(searchTerm)
            );

            if (matchedCustomers.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'No Results',
                    text: 'No customers found matching your search criteria'
                });
            } else if (matchedCustomers.length === 1) {
                viewCustomer(matchedCustomers[0].id);
            } else {
                // Show multiple results
                const resultsHtml = matchedCustomers.map(customer => `
                    <div class="border p-2 rounded mb-2 cursor-pointer hover:bg-gray-50" onclick="viewCustomer(${customer.id})">
                        <div class="font-medium">${customer.name}</div>
                        <div class="text-sm text-gray-600">${customer.phone} • ${customer.package}</div>
                    </div>
                `).join('');

                Swal.fire({
                    title: `Found ${matchedCustomers.length} customers`,
                    html: `<div class="text-left max-h-64 overflow-y-auto">${resultsHtml}</div>`,
                    showConfirmButton: false,
                    showCloseButton: true,
                    width: '500px'
                });
            }
        }
    });
}

function escalateIssue() {
    Swal.fire({
        title: '🚨 Escalate Issue',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ticket ID (if applicable)</label>
                    <input type="text" id="escalate-ticket" class="w-full p-2 border rounded" placeholder="TCK-XXXX">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Escalation Type</label>
                    <select id="escalate-type" class="w-full p-2 border rounded">
                        <option value="">Select type</option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing Problem</option>
                        <option value="management">Management Decision Required</option>
                        <option value="emergency">Emergency/Critical</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Escalate To</label>
                    <select id="escalate-to" class="w-full p-2 border rounded">
                        <option value="">Select department</option>
                        <option value="tech-lead">Technical Lead</option>
                        <option value="supervisor">Customer Care Supervisor</option>
                        <option value="manager">Operations Manager</option>
                        <option value="admin">System Administrator</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Reason for Escalation</label>
                    <textarea id="escalate-reason" rows="4" class="w-full p-2 border rounded" placeholder="Explain why this issue needs escalation..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Escalate Issue',
        preConfirm: () => {
            const ticketId = document.getElementById('escalate-ticket').value;
            const type = document.getElementById('escalate-type').value;
            const escalateTo = document.getElementById('escalate-to').value;
            const reason = document.getElementById('escalate-reason').value;
            
            if (!type || !escalateTo || !reason) {
                Swal.showValidationMessage('Please fill in all required fields');
                return false;
            }
            return { ticketId, type, escalateTo, reason };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { ticketId, type, escalateTo, reason } = result.value;
            
            // Notify admin about escalation
            await notifyAdmin(`Issue escalated: ${type} to ${escalateTo} - ${reason}`, 'escalation');

            Swal.fire({
                icon: 'success',
                title: 'Issue Escalated!',
                text: `The issue has been escalated to ${escalateTo} successfully`,
                timer: 2000
            });
        }
    });
}

function contactCustomer(phone, name) {
    Swal.fire({
        title: `Contact ${name}`,
        html: `
            <p class="mb-4">Phone: <strong>${phone}</strong></p>
            <div class="space-y-2">
                <button onclick="window.open('tel:${phone}')" class="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    📞 Call Customer
                </button>
                <button onclick="window.open('sms:${phone}')" class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    💬 Send SMS
                </button>
                <button onclick="window.open('https://wa.me/${phone.replace(/[^0-9]/g, '')}')" class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    📱 WhatsApp
                </button>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true
    });
}

async function notifyAdmin(message, type) {
    try {
        await fetch(`${window.BASE_URL}/api/admin/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                message: message,
                type: type,
                from: currentUser ? currentUser.name : 'Customer Care',
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Failed to notify admin:', error);
    }
}

function refreshCustomers() {
    loadCustomersData();
    Swal.fire({
        icon: 'success',
        title: 'Refreshed!',
        text: 'Customer data has been refreshed',
        timer: 1500
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
function showCustomerCareCommunication() {
    window.location.href = 'staff-communication.html';
}