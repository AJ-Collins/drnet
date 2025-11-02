// Staff Dashboard JavaScript

let staffData = null;

async function initStaffDashboard() {
    console.log('🚀 Staff Dashboard initializing...');
    updateTime();
    setInterval(updateTime, 1000);

    await loadStaffProfile();
    await loadStaffData();
    setupSidebar();
    initPerformanceChart();
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

        // Update UI with profile data
        const staffNameElement = document.getElementById('staffName');
        const userInitialElement = document.getElementById('userInitial');

        if (staffNameElement && profile.name) {
            staffNameElement.textContent = `${profile.name} - ${profile.position || 'Staff Member'}`;
        }

        if (userInitialElement && profile.name) {
            userInitialElement.textContent = profile.name.charAt(0).toUpperCase();
        }
        
        // Load and display profile image
        loadStaffProfileImage(profile);

        staffData = profile;
    } catch (error) {
        console.error('❌ Error loading staff profile:', error);
        // Use fallback data
        const staffNameElement = document.getElementById('staffName');
        if (staffNameElement) {
            staffNameElement.textContent = 'Staff Member';
        }
    }
}

// Load and display staff profile image
function loadStaffProfileImage(profile = null) {
    const profileImageElement = document.getElementById('profileImage');
    const userInitialElement = document.getElementById('userInitial');
    const profileImageContainer = document.querySelector('.w-10.h-10.bg-purple-500');
    
    let imageUrl = null;
    if (window.ProfileImageManager) {
        imageUrl = window.ProfileImageManager.get();
    }
    
    if (imageUrl && profileImageContainer) {
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
        loadStaffProfileImage();
    });
}

async function loadStaffData() {
    try {
        const res = await fetch(`${window.BASE_URL}/api/staff/dashboard-data`, {
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
            assignedCustomers: 25,
            openTickets: 3,
            tasksCompleted: 18,
            performanceScore: '92%'
        };
        updateDashboardUI(sampleData);
    }
}

function updateDashboardUI(data) {
    // Update quick stats
    const elements = {
        assignedCustomers: document.getElementById('assignedCustomers'),
        openTickets: document.getElementById('openTickets'),
        tasksCompleted: document.getElementById('tasksCompleted'),
        performanceScore: document.getElementById('performanceScore')
    };

    Object.keys(elements).forEach(key => {
        if (elements[key] && data[key] !== undefined) {
            elements[key].textContent = data[key];
        }
    });
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

function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
                label: 'Tasks Completed',
                data: [8, 12, 6, 9, 15],
                backgroundColor: 'rgba(147, 51, 234, 0.6)',
                borderColor: 'rgba(147, 51, 234, 1)',
                borderWidth: 1
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
                        text: 'Tasks'
                    }
                }
            }
        }
    });
}

// Task Management Functions
async function completeTask(taskId) {
    const result = await Swal.fire({
        title: '✅ Complete Task',
        text: 'Mark this task as completed?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Complete!'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${window.BASE_URL}/api/staff/tasks/${taskId}/complete`, {
                method: 'POST',
                credentials: 'include'
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Task Completed!',
                    text: 'The task has been marked as completed.',
                    timer: 2000
                });
                // Reload dashboard data
                await loadStaffData();
            } else {
                throw new Error('Failed to complete task');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to complete task. Please try again.'
            });
        }
    }
}

async function addNewTask() {
    const { value: formValues } = await Swal.fire({
        title: '➕ Add New Task',
        html: `
            <div class="text-left space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                    <select id="taskType" class="w-full p-2 border rounded">
                        <option>Installation</option>
                        <option>Technical Support</option>
                        <option>Customer Visit</option>
                        <option>Follow-up Call</option>
                        <option>Maintenance</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input id="customerName" class="w-full p-2 border rounded" placeholder="Enter customer name">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="taskDescription" class="w-full p-2 border rounded" rows="3" placeholder="Task details..."></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                    <input id="scheduleTime" type="datetime-local" class="w-full p-2 border rounded">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Task',
        preConfirm: () => {
            const type = document.getElementById('taskType').value;
            const customer = document.getElementById('customerName').value;
            const description = document.getElementById('taskDescription').value;
            const time = document.getElementById('scheduleTime').value;

            if (!customer.trim() || !description.trim()) {
                Swal.showValidationMessage('Please fill in all required fields');
                return false;
            }
            return { type, customer, description, time };
        }
    });

    if (formValues) {
        try {
            const res = await fetch(`${window.BASE_URL}/api/staff/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formValues)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Task Created!',
                    text: 'Your new task has been added to your schedule.',
                    timer: 2000
                });
                await loadStaffData();
            } else {
                throw new Error('Failed to create task');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to create task. Please try again.'
            });
        }
    }
}

// Quick Action Functions
function viewCustomers() {
    // This would typically navigate to a full customers page
    Swal.fire({
        title: '👥 My Customers',
        html: `
            <div class="text-left space-y-3">
                <div class="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                    <strong>John Smith</strong><br>
                    <small class="text-gray-600">Package: Premium | Status: Active</small><br>
                    <small class="text-gray-600">Phone: +1-234-567-1001</small>
                </div>
                <div class="bg-gray-50 p-3 rounded border-l-4 border-green-500">
                    <strong>Sarah Johnson</strong><br>
                    <small class="text-gray-600">Package: Standard | Status: Active</small><br>
                    <small class="text-gray-600">Phone: +1-234-567-1002</small>
                </div>
                <div class="bg-gray-50 p-3 rounded border-l-4 border-yellow-500">
                    <strong>Mike Davis</strong><br>
                    <small class="text-gray-600">Package: Basic | Status: Pending</small><br>
                    <small class="text-gray-600">Phone: +1-234-567-1003</small>
                </div>
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: '600px'
    });
}

async function createTicket() {
    const { value: formValues } = await Swal.fire({
        title: '🎫 Create Support Ticket',
        html: `
            <div class="text-left space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                    <select id="ticketCustomer" class="w-full p-2 border rounded">
                        <option>John Smith</option>
                        <option>Sarah Johnson</option>
                        <option>Mike Davis</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                    <select id="issueType" class="w-full p-2 border rounded">
                        <option>Internet Connection</option>
                        <option>Speed Issues</option>
                        <option>Equipment Problem</option>
                        <option>Billing Inquiry</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select id="priority" class="w-full p-2 border rounded">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="ticketDescription" class="w-full p-2 border rounded" rows="4" placeholder="Describe the issue..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Ticket',
        preConfirm: () => {
            const customer = document.getElementById('ticketCustomer').value;
            const issue = document.getElementById('issueType').value;
            const priority = document.getElementById('priority').value;
            const description = document.getElementById('ticketDescription').value;

            if (!description.trim()) {
                Swal.showValidationMessage('Please describe the issue');
                return false;
            }
            return { customer, issue, priority, description };
        }
    });

    if (formValues) {
        Swal.fire({
            icon: 'success',
            title: 'Ticket Created!',
            text: 'Support ticket has been created and assigned.',
            timer: 2000
        });
    }
}

function updateCustomer() {
    Swal.fire({
        title: '✏️ Update Customer Information',
        html: `
            <div class="text-left space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                    <select id="updateCustomer" class="w-full p-2 border rounded">
                        <option>John Smith</option>
                        <option>Sarah Johnson</option>
                        <option>Mike Davis</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Update Type</label>
                    <select id="updateType" class="w-full p-2 border rounded">
                        <option>Contact Information</option>
                        <option>Service Address</option>
                        <option>Package Details</option>
                        <option>Payment Information</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="updateNotes" class="w-full p-2 border rounded" rows="3" placeholder="Update details..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit Update'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Customer Updated!',
                text: 'Customer information has been updated successfully.',
                timer: 2000
            });
        }
    });
}

function generateReport() {
    Swal.fire({
        title: '📊 Generate Report',
        input: 'select',
        inputOptions: {
            'daily': 'Daily Activity Report',
            'weekly': 'Weekly Performance Report',
            'monthly': 'Monthly Summary Report',
            'customer': 'Customer Service Report'
        },
        inputPlaceholder: 'Select report type',
        showCancelButton: true,
        confirmButtonText: 'Generate Report',
        inputValidator: (value) => {
            if (!value) {
                return 'Please select a report type!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Report Generated!',
                text: 'Your report is being prepared and will be available shortly.',
                timer: 2000
            });
        }
    });
}

function viewSchedule() {
    Swal.fire({
        title: '📅 My Work Schedule',
        html: `
            <div class="text-left space-y-3">
                <div class="bg-blue-50 p-3 rounded">
                    <strong>Today (Monday)</strong><br>
                    <small class="text-gray-600">9:00 AM - 5:00 PM</small><br>
                    <small class="text-gray-600">3 appointments scheduled</small>
                </div>
                <div class="bg-green-50 p-3 rounded">
                    <strong>Tuesday</strong><br>
                    <small class="text-gray-600">9:00 AM - 5:00 PM</small><br>
                    <small class="text-gray-600">5 appointments scheduled</small>
                </div>
                <div class="bg-yellow-50 p-3 rounded">
                    <strong>Wednesday</strong><br>
                    <small class="text-gray-600">10:00 AM - 6:00 PM</small><br>
                    <small class="text-gray-600">2 appointments scheduled</small>
                </div>
                <div class="bg-purple-50 p-3 rounded">
                    <strong>Thursday</strong><br>
                    <small class="text-gray-600">9:00 AM - 5:00 PM</small><br>
                    <small class="text-gray-600">4 appointments scheduled</small>
                </div>
                <div class="bg-gray-50 p-3 rounded">
                    <strong>Friday</strong><br>
                    <small class="text-gray-600">9:00 AM - 4:00 PM</small><br>
                    <small class="text-gray-600">1 appointment scheduled</small>
                </div>
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: '500px'
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
function showStaffCommunication() {
    window.location.href = 'staff-communication.html';
}