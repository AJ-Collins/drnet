// Role-Based Staff Dashboard JavaScript

let staffData = null;
let userRole = null;

async function initStaffDashboard() {
    console.log('🚀 Staff Dashboard initializing...');
    updateTime();
    setInterval(updateTime, 1000);
    
    await loadStaffProfile();
    await loadStaffData();
    setupSidebar();
    setupRoleBasedContent();
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
        
        // Store user role for role-based content
        userRole = profile.position;
        
        // Update UI with profile data
        const staffNameElement = document.getElementById('staffName');
        const userInitialElement = document.getElementById('userInitial');
        const roleElement = document.getElementById('staffRole');
        
        if (staffNameElement && profile.name) {
            staffNameElement.textContent = `${profile.name} - ${profile.position || 'Staff Member'}`;
        }
        
        if (roleElement) {
            roleElement.textContent = profile.position || 'Staff Member';
        }
        
        if (userInitialElement && profile.name) {
            userInitialElement.textContent = profile.name.charAt(0).toUpperCase();
        }

        staffData = profile;
    } catch (error) {
        console.error('❌ Error loading staff profile:', error);
        // Use fallback data
        const staffNameElement = document.getElementById('staffName');
        if (staffNameElement) {
            staffNameElement.textContent = 'Staff Member';
        }
        userRole = 'New Employee'; // Default role
    }
}

function setupRoleBasedContent() {
    if (!userRole) return;
    
    console.log('Setting up role-based content for:', userRole);
    
    // Hide all role-specific sections first
    hideAllRoleSections();
    
    // Show content based on role
    switch (userRole) {
        case 'Supervisor':
            setupSupervisorDashboard();
            break;
        case 'Customer Care':
            setupCustomerCareDashboard();
            break;
        case 'Admin Assistant':
            setupAdminAssistantDashboard();
            break;
        case 'New Employee':
            setupNewEmployeeDashboard();
            break;
        default:
            setupGeneralStaffDashboard();
            break;
    }
}

function hideAllRoleSections() {
    const sections = [
        'lead-tech-section', 'customer-care-section', 
        'admin-assistant-section', 'new-employee-section', 'general-staff-section'
    ];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

function setupSupervisorDashboard() {
    console.log('🔧 Setting up Supervisor Dashboard');
    showSection('lead-tech-section');
    
    // Update dashboard title
    document.querySelector('h1').textContent = 'Supervisor Dashboard';
    
    // Customize stats for Supervisor
    updateRoleStats({
        assignedTechnicians: '8',
        criticalIssues: '3',
        projectsOverview: '5',
        teamPerformance: '94%'
    });
}

function setupCustomerCareDashboard() {
    console.log('📞 Setting up Customer Care Dashboard');
    showSection('customer-care-section');
    
    document.querySelector('h1').textContent = 'Customer Care Dashboard';
    
    updateRoleStats({
        activeTickets: '12',
        resolvedToday: '8',
        customerRating: '4.7★',
        callsHandled: '24'
    });
}

function setupAdminAssistantDashboard() {
    console.log('📋 Setting up Admin Assistant Dashboard');
    showSection('admin-assistant-section');
    
    document.querySelector('h1').textContent = 'Admin Assistant Dashboard';
    
    updateRoleStats({
        documentsProcessed: '15',
        meetingsScheduled: '6',
        reportsGenerated: '3',
        pendingApprovals: '4'
    });
}

function setupNewEmployeeDashboard() {
    console.log('🌟 Setting up New Employee Dashboard');
    showSection('new-employee-section');
    
    document.querySelector('h1').textContent = 'New Employee Dashboard';
    
    updateRoleStats({
        trainingProgress: '65%',
        coursesCompleted: '4/8',
        mentorMeetings: '3',
        daysEmployed: calculateDaysEmployed()
    });
}

function setupGeneralStaffDashboard() {
    console.log('👤 Setting up General Staff Dashboard');
    showSection('general-staff-section');
    
    updateRoleStats({
        assignedCustomers: '25',
        openTickets: '3',
        tasksCompleted: '18',
        performanceScore: '92%'
    });
}

function showSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.style.display = 'block';
    }
}

function updateRoleStats(stats) {
    // Update the stat cards with role-specific data
    const statElements = {
        'assignedCustomers': 'assignedCustomers',
        'openTickets': 'openTickets', 
        'tasksCompleted': 'tasksCompleted',
        'performanceScore': 'performanceScore',
        // Supervisor
        'assignedTechnicians': 'assignedCustomers',
        'criticalIssues': 'openTickets',
        'projectsOverview': 'tasksCompleted',
        'teamPerformance': 'performanceScore',
        // Customer Care
        'activeTickets': 'assignedCustomers',
        'resolvedToday': 'openTickets',
        'customerRating': 'tasksCompleted',
        'callsHandled': 'performanceScore',
        // Admin Assistant
        'documentsProcessed': 'assignedCustomers',
        'meetingsScheduled': 'openTickets',
        'reportsGenerated': 'tasksCompleted',
        'pendingApprovals': 'performanceScore',
        // New Employee
        'trainingProgress': 'assignedCustomers',
        'coursesCompleted': 'openTickets',
        'mentorMeetings': 'tasksCompleted',
        'daysEmployed': 'performanceScore'
    };

    Object.keys(stats).forEach(key => {
        const elementId = statElements[key];
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = stats[key];
        }
    });
    
    // Update stat labels based on role
    updateStatLabels(stats);
}

function updateStatLabels(stats) {
    const labels = document.querySelectorAll('.stat-label');
    const keys = Object.keys(stats);
    
    const labelTexts = {
        'assignedTechnicians': 'Assigned Technicians',
        'criticalIssues': 'Critical Issues',
        'projectsOverview': 'Active Projects',
        'teamPerformance': 'Team Performance',
        'activeTickets': 'Active Tickets',
        'resolvedToday': 'Resolved Today',
        'customerRating': 'Customer Rating',
        'callsHandled': 'Calls Handled',
        'documentsProcessed': 'Documents Processed',
        'meetingsScheduled': 'Meetings Scheduled',
        'reportsGenerated': 'Reports Generated',
        'pendingApprovals': 'Pending Approvals',
        'trainingProgress': 'Training Progress',
        'coursesCompleted': 'Courses Completed',
        'mentorMeetings': 'Mentor Meetings',
        'daysEmployed': 'Days Employed'
    };

    labels.forEach((label, index) => {
        if (keys[index] && labelTexts[keys[index]]) {
            label.textContent = labelTexts[keys[index]];
        }
    });
}

function calculateDaysEmployed() {
    if (staffData && staffData.hire_date) {
        const hireDate = new Date(staffData.hire_date);
        const today = new Date();
        const diffTime = Math.abs(today - hireDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays.toString();
    }
    return '13'; // Default fallback
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
        // Don't overwrite role-specific stats if they're already set
        if (!userRole || userRole === 'General Staff') {
            updateDashboardUI(data);
        }
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        // Use sample data as fallback only if no role-specific data
        if (!userRole) {
            const sampleData = {
                assignedCustomers: 25,
                openTickets: 3,
                tasksCompleted: 18,
                performanceScore: '92%'
            };
            updateDashboardUI(sampleData);
        }
    }
}

function updateDashboardUI(data) {
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

    // Customize chart data based on role
    let chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
            label: getChartLabel(),
            data: getChartData(),
            backgroundColor: getChartColor(),
            borderColor: getChartBorderColor(),
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'bar',
        data: chartData,
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
                        text: getYAxisLabel()
                    }
                }
            }
        }
    });
}

function getChartLabel() {
    switch (userRole) {
        case 'Supervisor': return 'Team Performance';
        case 'Customer Care': return 'Calls Handled';
        case 'Admin Assistant': return 'Documents Processed';
        case 'New Employee': return 'Training Modules';
        default: return 'Tasks Completed';
    }
}

function getChartData() {
    switch (userRole) {
        case 'Supervisor': return [95, 88, 92, 96, 90];
        case 'Customer Care': return [25, 30, 22, 35, 28];
        case 'Admin Assistant': return [12, 15, 10, 18, 14];
        case 'New Employee': return [2, 1, 3, 2, 1];
        default: return [8, 12, 6, 9, 15];
    }
}

function getChartColor() {
    switch (userRole) {
        case 'Supervisor': return 'rgba(34, 197, 94, 0.6)';
        case 'Customer Care': return 'rgba(59, 130, 246, 0.6)';
        case 'Admin Assistant': return 'rgba(168, 85, 247, 0.6)';
        case 'New Employee': return 'rgba(251, 191, 36, 0.6)';
        default: return 'rgba(147, 51, 234, 0.6)';
    }
}

function getChartBorderColor() {
    switch (userRole) {
        case 'Supervisor': return 'rgba(34, 197, 94, 1)';
        case 'Customer Care': return 'rgba(59, 130, 246, 1)';
        case 'Admin Assistant': return 'rgba(168, 85, 247, 1)';
        case 'New Employee': return 'rgba(251, 191, 36, 1)';
        default: return 'rgba(147, 51, 234, 1)';
    }
}

function getYAxisLabel() {
    switch (userRole) {
        case 'Supervisor': return 'Performance %';
        case 'Customer Care': return 'Calls';
        case 'Admin Assistant': return 'Documents';
        case 'New Employee': return 'Modules';
        default: return 'Tasks';
    }
}

// Role-specific functions
async function viewTeamPerformance() {
    if (userRole === 'Supervisor') {
        Swal.fire({
            title: '🔧 Team Performance Overview',
            html: `
                <div class="text-left space-y-3">
                    <div class="bg-green-50 p-3 rounded">
                        <strong>Alex Johnson - Senior Tech</strong><br>
                        <small class="text-gray-600">Performance: 96% | Tasks: 15/16</small>
                    </div>
                    <div class="bg-blue-50 p-3 rounded">
                        <strong>Maria Garcia - Field Tech</strong><br>
                        <small class="text-gray-600">Performance: 88% | Tasks: 12/14</small>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded">
                        <strong>Tom Wilson - Junior Tech</strong><br>
                        <small class="text-gray-600">Performance: 82% | Tasks: 8/10</small>
                    </div>
                </div>
            `,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false
        });
    } else {
        viewCustomers();
    }
}

async function manageCustomerTickets() {
    if (userRole === 'Customer Care') {
        Swal.fire({
            title: '📞 Active Customer Tickets',
            html: `
                <div class="text-left space-y-3">
                    <div class="bg-red-50 p-3 rounded border-l-4 border-red-500">
                        <strong>Ticket #1001 - High Priority</strong><br>
                        <small class="text-gray-600">Internet outage - John Smith - 2 hours ago</small>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                        <strong>Ticket #1002 - Medium Priority</strong><br>
                        <small class="text-gray-600">Slow connection - Sarah Davis - 4 hours ago</small>
                    </div>
                    <div class="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                        <strong>Ticket #1003 - Low Priority</strong><br>
                        <small class="text-gray-600">Billing inquiry - Mike Johnson - 1 day ago</small>
                    </div>
                </div>
            `,
            width: '700px',
            showCloseButton: true,
            showConfirmButton: false
        });
    } else {
        createTicket();
    }
}

async function processDocuments() {
    if (userRole === 'Admin Assistant') {
        Swal.fire({
            title: '📋 Document Processing Center',
            html: `
                <div class="text-left space-y-3">
                    <div class="bg-purple-50 p-3 rounded">
                        <strong>Pending Documents (4)</strong><br>
                        <small class="text-gray-600">• Employee contracts (2)<br>• Service agreements (1)<br>• Financial reports (1)</small>
                    </div>
                    <div class="bg-green-50 p-3 rounded">
                        <strong>Processed Today (15)</strong><br>
                        <small class="text-gray-600">• Invoices generated<br>• Contracts filed<br>• Reports submitted</small>
                    </div>
                </div>
            `,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false
        });
    } else {
        generateReport();
    }
}

async function viewTrainingProgress() {
    if (userRole === 'New Employee') {
        Swal.fire({
            title: '🌟 Your Training Progress',
            html: `
                <div class="text-left space-y-3">
                    <div class="bg-green-50 p-3 rounded">
                        <strong>Completed Courses (4/8)</strong><br>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: 50%"></div>
                        </div>
                    </div>
                    <div class="bg-blue-50 p-3 rounded">
                        <strong>Next: Customer Service Basics</strong><br>
                        <small class="text-gray-600">Due: Tomorrow | Duration: 2 hours</small>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded">
                        <strong>Mentor Check-in</strong><br>
                        <small class="text-gray-600">Scheduled: Friday 2:00 PM with Lisa Wang</small>
                    </div>
                </div>
            `,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false
        });
    } else {
        viewSchedule();
    }
}

// Existing functions with role-aware modifications
async function completeTask(taskId) {
    // Implementation stays the same
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

// Rest of the existing functions...
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

function viewCustomers() {
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