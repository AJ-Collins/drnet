// Client Dashboard JavaScript

let clientData = null;

async function initClientDashboard() {
    console.log('🚀 Client Dashboard initializing...');
    updateTime();
    setInterval(updateTime, 1000);

    await loadClientProfile();
    await loadClientData();
    setupSidebar();
    initUsageChart();
}

function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = now.toLocaleString();
    }
}

async function loadClientProfile() {
    try {
        const res = await fetch(`${window.BASE_URL}/api/client/profile`, {
            credentials: 'include'
        });

        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = '/client/login';
                return;
            }
            throw new Error('Failed to load profile');
        }

        const profile = await res.json();

        // Update UI with profile data
        const clientNameElement = document.getElementById('clientName');
        const userInitialElement = document.getElementById('userInitial');

        if (clientNameElement && profile.name) {
            clientNameElement.textContent = profile.name;
        }

        if (userInitialElement && profile.name) {
            userInitialElement.textContent = profile.name.charAt(0).toUpperCase();
        }
        
        // Load and display profile image
        loadClientProfileImage(profile);

        clientData = profile;
    } catch (error) {
        console.error('❌ Error loading client profile:', error);
        // Use fallback data
        const clientNameElement = document.getElementById('clientName');
        if (clientNameElement) {
            clientNameElement.textContent = 'Client User';
        }
    }
}

// Load and display client profile image
function loadClientProfileImage(profile = null) {
    // Try to get profile image element (might be an img or a div with userInitial)
    const profileImageElement = document.getElementById('profileImage');
    const userInitialElement = document.getElementById('userInitial');
    const profileImageContainer = document.querySelector('.w-10.h-10.bg-teal-500');
    
    let imageUrl = null;
    if (window.ProfileImageManager) {
        imageUrl = window.ProfileImageManager.get();
    }
    
    if (imageUrl && profileImageContainer) {
        // Convert the initial circle to show image instead
        if (userInitialElement) {
            profileImageContainer.innerHTML = `<img src="${imageUrl}" alt="Profile" class="w-10 h-10 rounded-full object-cover" />`;
        }
    } else if (profileImageElement) {
        if (imageUrl) {
            profileImageElement.src = imageUrl;
            profileImageElement.style.display = 'block';
        } else {
            profileImageElement.style.display = 'none';
        }
    }
}

// Listen for profile image updates
if (window.addEventListener) {
    window.addEventListener('profileImageUpdated', () => {
        loadClientProfileImage();
    });
}

async function loadClientData() {
    try {
        const res = await fetch(`${window.BASE_URL}/api/client/dashboard-data`, {
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Failed to load dashboard data');
        }

        const data = await res.json();
        updateDashboardUI(data);
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        // Use sample data as fallback
        const sampleData = {
            currentPlan: 'High-Speed Plus',
            nextPayment: 'Jan 15, 2025',
            accountStatus: 'Active',
            outstandingBalance: 0,
            packageName: 'High-Speed Plus Internet',
            monthlyCost: '$49.99',
            startDate: 'Dec 15, 2024',
            expiryDate: 'Jan 15, 2025'
        };
        updateDashboardUI(sampleData);
    }
}

function updateDashboardUI(data) {
    // Update quick stats
    const elements = {
        currentPlan: document.getElementById('currentPlan'),
        nextPayment: document.getElementById('nextPayment'),
        accountStatus: document.getElementById('accountStatus'),
        outstandingBalance: document.getElementById('outstandingBalance'),
        packageName: document.getElementById('packageName'),
        monthlyCost: document.getElementById('monthlyCost'),
        startDate: document.getElementById('startDate'),
        expiryDate: document.getElementById('expiryDate')
    };

    Object.keys(elements).forEach(key => {
        if (elements[key] && data[key] !== undefined) {
            elements[key].textContent = data[key];
        }
    });

    // Update outstanding balance formatting
    if (elements.outstandingBalance) {
        const balance = parseFloat(data.outstandingBalance) || 0;
        elements.outstandingBalance.textContent = `$${balance.toFixed(2)}`;

        // Change color based on balance
        if (balance > 0) {
            elements.outstandingBalance.classList.add('text-red-600');
        } else {
            elements.outstandingBalance.classList.add('text-green-600');
        }
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

function initUsageChart() {
    const ctx = document.getElementById('usageChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Data Usage (GB)',
                data: [45, 52, 38, 61],
                borderColor: 'rgb(20, 184, 166)',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'GB Used'
                    }
                }
            }
        }
    });
}

// Quick Action Functions
async function makePayment() {
    const { value: amount } = await Swal.fire({
        title: '💳 Make Payment',
        input: 'number',
        inputLabel: 'Payment Amount ($)',
        inputPlaceholder: 'Enter amount',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value || value <= 0) {
                return 'Please enter a valid amount!';
            }
        }
    });

    if (amount) {
        try {
            const res = await fetch(`${window.BASE_URL}/api/client/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ amount: parseFloat(amount) })
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Payment Successful!',
                    text: `Payment of $${amount} has been processed.`,
                    timer: 3000
                });
                // Reload dashboard data
                await loadClientData();
            } else {
                throw new Error('Payment failed');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Payment Failed',
                text: 'There was an error processing your payment. Please try again.'
            });
        }
    }
}

async function renewSubscription() {
    const result = await Swal.fire({
        title: '🔄 Renew Subscription',
        text: 'Renew your current subscription for another month?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0d9488',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Renew!'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${window.BASE_URL}/api/client/renew`, {
                method: 'POST',
                credentials: 'include'
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Subscription Renewed!',
                    text: 'Your subscription has been renewed successfully.',
                    timer: 3000
                });
                await loadClientData();
            } else {
                throw new Error('Renewal failed');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Renewal Failed',
                text: 'There was an error renewing your subscription. Please try again.'
            });
        }
    }
}

function upgradePackage() {
    Swal.fire({
        title: '⬆️ Upgrade Package',
        html: `
            <div class="text-left">
                <h4 class="font-bold mb-3">Available Upgrades:</h4>
                <div class="space-y-2">
                    <div class="p-3 border rounded-lg">
                        <strong>Premium Plus - $79.99/month</strong><br>
                        <small class="text-gray-600">100 Mbps, Unlimited Data</small>
                    </div>
                    <div class="p-3 border rounded-lg">
                        <strong>Business Pro - $149.99/month</strong><br>
                        <small class="text-gray-600">500 Mbps, Priority Support</small>
                    </div>
                </div>
                <p class="mt-3 text-sm text-gray-600">Contact support to upgrade your package.</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Contact Support',
        cancelButtonText: 'Maybe Later'
    }).then((result) => {
        if (result.isConfirmed) {
            contactSupport();
        }
    });
}

function createSupportTicket() {
    Swal.fire({
        title: '🎫 Create Support Ticket',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                    <select id="issueType" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="Internet Connection Problems">Internet Connection Problems</option>
                        <option value="Slow Internet Speed">Slow Internet Speed</option>
                        <option value="Router/Equipment Issues">Router/Equipment Issues</option>
                        <option value="Service Outage">Service Outage</option>
                        <option value="Billing Questions">Billing Questions</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                    <select id="priority" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="Low">Low</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Issue Description</label>
                    <textarea id="issueDescription" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows="4" placeholder="Describe your issue in detail..."></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                    <input type="text" id="contactInfo" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Phone number or email for follow-up">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Support Ticket',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        preConfirm: () => {
            const issueType = document.getElementById('issueType').value;
            const priority = document.getElementById('priority').value;
            const description = document.getElementById('issueDescription').value.trim();
            const contactInfo = document.getElementById('contactInfo').value.trim();

            if (!description) {
                Swal.showValidationMessage('Please describe your issue');
                return false;
            }

            return { issueType, priority, description, contactInfo };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const ticketData = result.value;

            try {
                // Generate unique support ticket ID
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                const ticketId = `ST${timestamp}${random}`;

                // Get client information
                const clientName = document.getElementById('clientName').textContent || 'Client';

                // Create support ticket object
                const newSupportTicket = {
                    id: ticketId,
                    issueType: ticketData.issueType,
                    priority: ticketData.priority,
                    client: clientName,
                    description: ticketData.description,
                    contactInfo: ticketData.contactInfo,
                    status: 'Pending',
                    source: 'client',
                    createdBy: 'Client',
                    assignedTo: 'Support Team',
                    ticketType: 'client', // Client-created ticket
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Save to centralized support tickets storage
                let allSupportTickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
                allSupportTickets.unshift(newSupportTicket);
                localStorage.setItem('supportTickets', JSON.stringify(allSupportTickets));

                // Notify CTIO (client tickets go to both CTIO and Supervisor)
                let ctioNotifications = JSON.parse(localStorage.getItem('ctioNotifications') || '[]');
                const ctioNotification = {
                    id: `CTIO${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                    type: 'support_ticket_created',
                    title: `New Support Ticket from Client`,
                    message: `${newSupportTicket.issueType} from ${newSupportTicket.client}: ${newSupportTicket.description.substring(0, 80)}...`,
                    ticketId: newSupportTicket.id,
                    priority: newSupportTicket.priority,
                    clientName: newSupportTicket.client,
                    timestamp: Date.now(),
                    isRead: false,
                    createdBy: 'Client',
                    ticketType: 'client',
                    createdAt: new Date().toISOString()
                };

                ctioNotifications.unshift(ctioNotification);
                if (ctioNotifications.length > 100) {
                    ctioNotifications = ctioNotifications.slice(0, 100);
                }
                localStorage.setItem('ctioNotifications', JSON.stringify(ctioNotifications));

                // Notify Supervisor (client tickets go to both CTIO and Supervisor)
                let supervisorNotifications = JSON.parse(localStorage.getItem('supervisorNotifications') || '[]');
                const supervisorNotification = {
                    id: `SUP${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                    type: 'support_ticket_created',
                    title: `New Support Ticket from Client`,
                    message: `${newSupportTicket.issueType} from ${newSupportTicket.client}: ${newSupportTicket.description.substring(0, 80)}...`,
                    ticketId: newSupportTicket.id,
                    priority: newSupportTicket.priority,
                    clientName: newSupportTicket.client,
                    timestamp: Date.now(),
                    isRead: false,
                    createdBy: 'Client',
                    ticketType: 'client',
                    createdAt: new Date().toISOString()
                };

                supervisorNotifications.unshift(supervisorNotification);
                if (supervisorNotifications.length > 100) {
                    supervisorNotifications = supervisorNotifications.slice(0, 100);
                }
                localStorage.setItem('supervisorNotifications', JSON.stringify(supervisorNotifications));

                // Show success message
                Swal.fire({
                    title: 'Support Ticket Created Successfully! 🎉',
                    html: `
                        <div class="text-center">
                            <p class="text-lg mb-2">Support Ticket #${newSupportTicket.id} has been created</p>
                            <p class="text-sm text-gray-600">Both CTIO and Supervisor have been notified</p>
                            <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p class="text-sm"><strong>Issue:</strong> ${newSupportTicket.issueType}</p>
                                <p class="text-sm"><strong>Priority:</strong> ${newSupportTicket.priority}</p>
                                <p class="text-sm"><strong>Status:</strong> Pending</p>
                                <p class="text-sm"><strong>Response Time:</strong> Within 24 hours</p>
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    timer: 5000,
                    showConfirmButton: false
                });

            } catch (error) {
                console.error('Error creating support ticket:', error);
                Swal.fire({
                    title: 'Error Creating Support Ticket',
                    text: 'There was an error creating the support ticket. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#dc2626'
                });
            }
        }
    });
}

function contactSupport() {
    Swal.fire({
        title: '📞 Contact Support',
        html: `
            <div class="text-left space-y-3">
                <div class="bg-gray-50 p-3 rounded">
                    <strong>Phone Support:</strong><br>
                    📞 +1-234-567-8900<br>
                    <small class="text-gray-600">Mon-Fri: 9AM-6PM</small>
                </div>
                <div class="bg-gray-50 p-3 rounded">
                    <strong>Email Support:</strong><br>
                    ✉️ support@drnet.com<br>
                    <small class="text-gray-600">Response within 4 hours</small>
                </div>
                <div class="bg-gray-50 p-3 rounded">
                    <strong>Emergency Support:</strong><br>
                    🚨 +1-234-567-911<br>
                    <small class="text-gray-600">24/7 Available</small>
                </div>
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: false
    });
}

function downloadInvoice() {
    Swal.fire({
        title: '📄 Download Invoice',
        text: 'Which invoice would you like to download?',
        input: 'select',
        inputOptions: {
            'current': 'Current Month (December 2024)',
            'last': 'Last Month (November 2024)',
            'previous': 'October 2024'
        },
        inputPlaceholder: 'Select invoice period',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'Please select an invoice period!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate invoice download
            Swal.fire({
                icon: 'success',
                title: 'Downloading Invoice...',
                text: 'Your invoice is being prepared for download.',
                timer: 2000,
                showConfirmButton: false
            });
        }
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
            await fetch(`${window.BASE_URL}/api/client/logout`, {
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

// View My Support Tickets Function
function viewMyTickets() {
    try {
        // Get all support tickets
        const allTickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
        
        // Get client name to filter tickets
        const clientName = document.getElementById('clientName').textContent || 'Client';
        
        // Filter tickets created by this client
        const myTickets = allTickets.filter(ticket => 
            ticket.client === clientName || 
            ticket.createdBy === 'Client'
        );

        if (myTickets.length === 0) {
            Swal.fire({
                title: '📋 My Support Tickets',
                html: `
                    <div class="text-center py-8">
                        <div class="text-6xl mb-4">🎫</div>
                        <p class="text-gray-500 mb-4">You haven't created any support tickets yet.</p>
                        <button onclick="createSupportTicket()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200">
                            Create Your First Ticket
                        </button>
                    </div>
                `,
                showCloseButton: true,
                showConfirmButton: false,
                width: '600px'
            });
            return;
        }

        // Create tickets display HTML
        const ticketsHTML = myTickets.map(ticket => {
            const statusColors = {
                'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
                'Completed': 'bg-green-100 text-green-800 border-green-200',
                'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
            };

            const priorityColors = {
                'Low': 'bg-green-100 text-green-700',
                'Medium': 'bg-yellow-100 text-yellow-700',
                'High': 'bg-orange-100 text-orange-700',
                'Critical': 'bg-red-100 text-red-700'
            };

            const createdDate = new Date(ticket.createdAt).toLocaleDateString();
            const createdTime = new Date(ticket.createdAt).toLocaleTimeString();

            return `
                <div class="border rounded-lg p-4 mb-4 bg-white hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-2">
                                <span class="px-2 py-1 rounded text-xs font-medium ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}">
                                    ${ticket.status}
                                </span>
                                <span class="px-2 py-1 rounded text-xs font-medium ${priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800'}">
                                    ${ticket.priority}
                                </span>
                                <span class="text-xs text-gray-500">ID: ${ticket.id}</span>
                            </div>
                            <h4 class="font-semibold text-gray-900">${ticket.issueType}</h4>
                            <p class="text-sm text-gray-600 mt-1 line-clamp-2">${ticket.description}</p>
                        </div>
                    </div>
                    <div class="border-t pt-3 mt-3">
                        <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
                            <div>
                                <span class="font-medium">Created:</span> ${createdDate} ${createdTime}
                            </div>
                            <div>
                                <span class="font-medium">Assigned to:</span> ${ticket.assignedTechnician || 'Support Team'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        Swal.fire({
            title: `📋 My Support Tickets (${myTickets.length})`,
            html: `
                <div class="max-h-96 overflow-y-auto">
                    ${ticketsHTML}
                </div>
                <div class="mt-4 text-center">
                    <button onclick="createSupportTicket()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200">
                        Create New Ticket
                    </button>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: '700px'
        });

    } catch (error) {
        console.error('Error loading support tickets:', error);
        Swal.fire({
            title: 'Error',
            text: 'Unable to load your support tickets. Please try again.',
            icon: 'error',
            confirmButtonColor: '#dc2626'
        });
    }
}