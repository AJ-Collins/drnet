// Team Communication JavaScript
// Handles messages, daily reports, and broadcasts across all dashboards

let teamMessages = JSON.parse(localStorage.getItem('teamMessages')) || [];
let dailyReports = JSON.parse(localStorage.getItem('dailyReports')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || { role: 'admin', name: 'CTIO Admin' };

document.addEventListener('DOMContentLoaded', function() {
    console.log('🗣️ Team Communication System initialized');
    initTeamCommunication();
});

function initTeamCommunication() {
    updateTime();
    setInterval(updateTime, 1000);
    
    // Load messages, reports, and assignments
    loadMessages();
    loadReports();
    loadAssignments();
    updateUnreadCount();
    
    // Setup form event listeners
    setupEventListeners();
    
    // Show messages tab by default
    showTab('messages');
    
    // Check for new messages every 30 seconds
    setInterval(() => {
        loadMessages();
        updateUnreadCount();
        loadAssignments(); // Also refresh assignments
    }, 30000);
}

function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = now.toLocaleString();
    }
}

function setupEventListeners() {
    // Modern sidebar toggle functionality
    const toggleSidebar = document.getElementById('toggleSidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    
    if (toggleSidebar && sidebar) {
        toggleSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = sidebar.classList.contains('sidebar-open');
            if (isOpen) {
                sidebar.classList.remove('sidebar-open');
                if (backdrop) {
                    backdrop.classList.add('hidden');
                }
            } else {
                sidebar.classList.add('sidebar-open');
                if (backdrop && window.innerWidth < 1024) {
                    backdrop.classList.remove('hidden');
                }
            }
        });
    }
    
    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sidebar.classList.remove('sidebar-open');
            if (backdrop) {
                backdrop.classList.add('hidden');
            }
        });
    }
    
    // Close sidebar when clicking backdrop
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('sidebar-open');
            backdrop.classList.add('hidden');
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            if (backdrop) {
                backdrop.classList.add('hidden');
            }
            if (sidebar) {
                sidebar.classList.remove('sidebar-open');
            }
        }
    });
    
    // Enhanced tab functionality with modern styling
    function updateTabStyles(activeTab) {
        const tabs = ['messagesTab', 'reportsTab', 'broadcastTab', 'assignmentsTab'];
        tabs.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) {
                if (tabId === activeTab) {
                    tab.className = 'tab-button px-6 py-3 rounded-xl font-semibold transition-all duration-300 ctio-gradient text-white shadow-lg transform scale-105';
                } else {
                    tab.className = 'tab-button px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-white/80 text-gray-700 hover:bg-white hover:shadow-lg transform hover:scale-105';
                }
            }
        });
    }
    
    // Override global showTab function
    window.showTab = function(tabName) {
        // Hide all sections
        const sections = ['messagesSection', 'reportsSection', 'broadcastSection', 'assignmentsSection'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('hidden');
            }
        });
        
        // Show selected section
        const selectedSection = document.getElementById(tabName + 'Section');
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
        }
        
        // Update tab styles
        updateTabStyles(tabName + 'Tab');
        
        // Load content based on tab
        switch(tabName) {
            case 'messages':
                loadMessages();
                updateUnreadCount();
                break;
            case 'reports':
                loadReports();
                break;
            case 'assignments':
                loadAssignments();
                break;
        }
    };
    
    // Message form
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', sendMessage);
    }
    
    // Broadcast form
    const broadcastForm = document.getElementById('broadcastForm');
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', sendBroadcast);
    }
    
    // Filters
    const messageFilter = document.getElementById('messageFilter');
    if (messageFilter) {
        messageFilter.addEventListener('change', loadMessages);
    }
    
    const reportDateFilter = document.getElementById('reportDateFilter');
    if (reportDateFilter) {
        reportDateFilter.addEventListener('change', loadReports);
    }
    
    const reportStatusFilter = document.getElementById('reportStatusFilter');
    if (reportStatusFilter) {
        reportStatusFilter.addEventListener('change', loadReports);
    }
}

// Tab Management
function showTab(tabName) {
    // Hide all sections
    document.getElementById('messagesSection').classList.add('hidden');
    document.getElementById('reportsSection').classList.add('hidden');
    document.getElementById('broadcastSection').classList.add('hidden');
    document.getElementById('assignmentsSection').classList.add('hidden');
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white');
        tab.classList.add('bg-white/80', 'text-gray-700');
    });
    
    // Show selected section
    document.getElementById(tabName + 'Section').classList.remove('hidden');
    
    // Add active class to selected tab
    const activeTab = document.getElementById(tabName + 'Tab');
    if (activeTab) {
        activeTab.classList.remove('bg-white/80', 'text-gray-700');
        activeTab.classList.add('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white');
    }
    
    // Load data for the selected tab
    if (tabName === 'messages') {
        loadMessages();
    } else if (tabName === 'reports') {
        loadReports();
    } else if (tabName === 'assignments') {
        setMinimumDueDate();
        loadAssignments();
    }
}

// Message Management
function sendMessage(event) {
    event.preventDefault();
    
    const recipient = document.getElementById('messageRecipient').value;
    const subject = document.getElementById('messageSubject').value;
    const content = document.getElementById('messageContent').value;
    const priority = document.getElementById('messagePriority').value;
    
    if (!recipient || !subject || !content) {
        Swal.fire({
            title: 'Missing Information',
            text: 'Please fill in all required fields',
            icon: 'warning',
            confirmButtonColor: '#F59E0B'
        });
        return;
    }
    
    const message = {
        id: Date.now(),
        from: currentUser.name,
        fromRole: currentUser.role,
        to: recipient,
        subject: subject,
        content: content,
        priority: priority,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'message'
    };
    
    teamMessages.unshift(message);
    localStorage.setItem('teamMessages', JSON.stringify(teamMessages));
    
    // Create targeted notification if sending to specific staff member
    if (!recipient.includes('all_') && !recipient.includes('s_')) { // Single staff member
        createTargetedNotification(message);
    }
    
    // Clear form
    document.getElementById('messageForm').reset();
    
    // Reload messages
    loadMessages();
    
    Swal.fire({
        title: 'Message Sent!',
        text: `Message sent to ${recipient}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

function sendBroadcast(event) {
    event.preventDefault();
    
    const type = document.getElementById('broadcastType').value;
    const subject = document.getElementById('broadcastSubject').value;
    const content = document.getElementById('broadcastContent').value;
    
    if (!subject || !content) {
        Swal.fire({
            title: 'Missing Information',
            text: 'Please fill in subject and message',
            icon: 'warning',
            confirmButtonColor: '#F59E0B'
        });
        return;
    }
    
    const broadcast = {
        id: Date.now(),
        from: currentUser.name,
        fromRole: currentUser.role,
        to: 'all_staff',
        subject: `[${type.toUpperCase()}] ${subject}`,
        content: content,
        priority: 'high',
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'broadcast',
        broadcastType: type
    };
    
    teamMessages.unshift(broadcast);
    localStorage.setItem('teamMessages', JSON.stringify(teamMessages));
    
    // Clear form
    document.getElementById('broadcastForm').reset();
    
    // Switch to messages tab to show the broadcast
    showTab('messages');
    
    Swal.fire({
        title: 'Broadcast Sent!',
        text: 'Message has been broadcast to all staff members',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    const filter = document.getElementById('messageFilter')?.value || 'all';
    
    if (!messagesList) return;
    
    let filteredMessages = [...teamMessages];
    
    // Apply filters
    if (filter === 'unread') {
        filteredMessages = filteredMessages.filter(msg => !msg.isRead);
    } else if (filter === 'sent') {
        filteredMessages = filteredMessages.filter(msg => msg.fromRole === currentUser.role);
    } else if (filter === 'received') {
        filteredMessages = filteredMessages.filter(msg => msg.fromRole !== currentUser.role);
    }
    
    if (filteredMessages.length === 0) {
        messagesList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-6xl mb-4">💬</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                <p>No messages match the current filter.</p>
            </div>
        `;
        return;
    }
    
    messagesList.innerHTML = filteredMessages.map(message => {
        const timeAgo = dayjs(message.timestamp).fromNow();
        const isUnread = !message.isRead && message.fromRole !== currentUser.role;
        const priorityColor = getPriorityColor(message.priority);
        const typeIcon = message.type === 'broadcast' ? '📢' : '💬';
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50 border-blue-200' : ''}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-lg">${typeIcon}</span>
                            <span class="font-medium text-gray-900">${message.subject}</span>
                            ${isUnread ? '<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>' : ''}
                            <span class="text-xs px-2 py-1 rounded-full ${priorityColor}">${message.priority.toUpperCase()}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${message.content}</p>
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <span>From: ${message.from} | To: ${formatRecipient(message.to)}</span>
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        <button onclick="viewMessage('${message.id}')" class="text-blue-600 hover:text-blue-800 transition-colors" title="View">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                        </button>
                        ${message.fromRole !== currentUser.role ? `<button onclick="replyToMessage('${message.id}')" class="text-green-600 hover:text-green-800 transition-colors" title="Reply">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                            </svg>
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadReports() {
    const reportsTable = document.getElementById('reportsTable');
    const dateFilter = document.getElementById('reportDateFilter')?.value;
    const statusFilter = document.getElementById('reportStatusFilter')?.value || 'all';
    
    if (!reportsTable) return;
    
    let filteredReports = [...dailyReports];
    
    // Apply filters
    if (dateFilter) {
        filteredReports = filteredReports.filter(report => report.date === dateFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === statusFilter);
    }
    
    if (filteredReports.length === 0) {
        reportsTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-2">📊</div>
                    <p>No daily reports found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    reportsTable.innerHTML = filteredReports.map(report => {
        const statusColor = report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900">${dayjs(report.date).format('MMM DD, YYYY')}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${report.technician}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${report.summary}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                        ${report.status}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center space-x-2">
                        <button onclick="viewReport('${report.id}')" class="text-blue-600 hover:text-blue-800 transition-colors" title="View Report">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </button>
                        ${report.status === 'pending' ? `<button onclick="markReportReviewed('${report.id}')" class="text-green-600 hover:text-green-800 transition-colors" title="Mark as Reviewed">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateUnreadCount() {
    const unreadCount = teamMessages.filter(msg => !msg.isRead && msg.fromRole !== currentUser.role).length;
    const unreadElement = document.getElementById('unreadCount');
    if (unreadElement) {
        unreadElement.textContent = unreadCount;
    }
}

function viewMessage(messageId) {
    const message = teamMessages.find(msg => msg.id == messageId);
    if (!message) return;
    
    // Mark as read if not from current user
    if (message.fromRole !== currentUser.role && !message.isRead) {
        message.isRead = true;
        localStorage.setItem('teamMessages', JSON.stringify(teamMessages));
        updateUnreadCount();
        loadMessages();
    }
    
    const priorityColor = getPriorityColor(message.priority);
    const typeIcon = message.type === 'broadcast' ? '📢' : '💬';
    
    Swal.fire({
        title: `${typeIcon} ${message.subject}`,
        html: `
            <div class="text-left space-y-4">
                <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="text-sm text-gray-600 space-y-1">
                        <p><strong>From:</strong> ${message.from}</p>
                        <p><strong>To:</strong> ${formatRecipient(message.to)}</p>
                        <p><strong>Priority:</strong> <span class="px-2 py-1 rounded-full text-xs ${priorityColor}">${message.priority.toUpperCase()}</span></p>
                        <p><strong>Sent:</strong> ${dayjs(message.timestamp).format('MMMM DD, YYYY [at] h:mm A')}</p>
                        ${message.type === 'broadcast' ? `<p><strong>Type:</strong> ${message.broadcastType}</p>` : ''}
                    </div>
                </div>
                <div class="bg-white p-4 border border-gray-200 rounded-lg">
                    <p class="text-gray-800 whitespace-pre-wrap">${message.content}</p>
                </div>
            </div>
        `,
        width: 600,
        confirmButtonText: 'Close',
        confirmButtonColor: '#6B7280'
    });
}

function replyToMessage(messageId) {
    const message = teamMessages.find(msg => msg.id == messageId);
    if (!message) return;
    
    // Pre-fill reply form
    document.getElementById('messageRecipient').value = message.fromRole === 'admin' ? 'all_staff' : 'admin';
    document.getElementById('messageSubject').value = `Re: ${message.subject}`;
    document.getElementById('messageContent').value = `\n\n--- Original Message ---\nFrom: ${message.from}\nSubject: ${message.subject}\n\n${message.content}`;
    
    // Switch to messages tab
    showTab('messages');
    
    // Focus on content field
    document.getElementById('messageContent').focus();
}

function viewReport(reportId) {
    const report = dailyReports.find(r => r.id == reportId);
    if (!report) return;
    
    Swal.fire({
        title: `📊 Daily Report - ${dayjs(report.date).format('MMMM DD, YYYY')}`,
        html: `
            <div class="text-left space-y-4">
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div class="text-sm text-blue-700 space-y-1">
                        <p><strong>Supervisor:</strong> ${report.technician}</p>
                        <p><strong>Department:</strong> ${report.department}</p>
                        <p><strong>Report Date:</strong> ${dayjs(report.date).format('MMMM DD, YYYY')}</p>
                        <p><strong>Submitted:</strong> ${dayjs(report.submittedAt).format('MMMM DD, YYYY [at] h:mm A')}</p>
                        <p><strong>Status:</strong> <span class="px-2 py-1 rounded-full text-xs ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">${report.status}</span></p>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-2">📋 Summary</h4>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded">${report.summary}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-2">✅ Tasks Completed</h4>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded">${report.tasksCompleted}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-2">⚠️ Issues Encountered</h4>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded">${report.issues || 'No issues reported'}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-2">📈 Performance Metrics</h4>
                        <div class="bg-gray-50 p-3 rounded space-y-1 text-sm">
                            <p><strong>Tickets Resolved:</strong> ${report.metrics.ticketsResolved || 0}</p>
                            <p><strong>Installations Completed:</strong> ${report.metrics.installations || 0}</p>
                            <p><strong>Client Satisfaction:</strong> ${report.metrics.satisfaction || 'N/A'}%</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-2">📝 Additional Notes</h4>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded">${report.notes || 'No additional notes'}</p>
                    </div>
                </div>
            </div>
        `,
        width: 700,
        confirmButtonText: report.status === 'pending' ? 'Mark as Reviewed' : 'Close',
        confirmButtonColor: report.status === 'pending' ? '#10B981' : '#6B7280',
        showCancelButton: report.status === 'pending',
        cancelButtonText: 'Close'
    }).then((result) => {
        if (result.isConfirmed && report.status === 'pending') {
            markReportReviewed(reportId);
        }
    });
}

function markReportReviewed(reportId) {
    const reportIndex = dailyReports.findIndex(r => r.id == reportId);
    if (reportIndex === -1) return;
    
    dailyReports[reportIndex].status = 'reviewed';
    dailyReports[reportIndex].reviewedBy = currentUser.name;
    dailyReports[reportIndex].reviewedAt = new Date().toISOString();
    
    localStorage.setItem('dailyReports', JSON.stringify(dailyReports));
    
    loadReports();
    
    Swal.fire({
        title: 'Report Reviewed!',
        text: 'Daily report has been marked as reviewed',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

function refreshMessages() {
    loadMessages();
    updateUnreadCount();
    
    Swal.fire({
        title: 'Refreshed!',
        text: 'Messages have been refreshed',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

function refreshReports() {
    loadReports();
    
    Swal.fire({
        title: 'Refreshed!',
        text: 'Reports have been refreshed',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

// Utility functions
function getPriorityColor(priority) {
    const colors = {
        'normal': 'bg-gray-100 text-gray-800',
        'high': 'bg-orange-100 text-orange-800',
        'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors['normal'];
}

function formatRecipient(recipient) {
    const recipients = {
        'all_staff': 'All Staff',
        'supervisors': 'Supervisors',
        'technicians': 'Technicians',
        'customer_service': 'Customer Service',
        'admin_assistants': 'Admin Assistants',
        'admin': 'CTIO Admin'
    };
    return recipients[recipient] || recipient;
}

// Create targeted notification for specific staff member
function createTargetedNotification(message) {
    let notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]');
    
    // Create notification for the targeted recipient
    const notification = {
        id: Date.now() + Math.random(),
        targetUser: message.to,
        from: message.from,
        fromRole: message.fromRole,
        subject: message.subject,
        content: message.content,
        priority: message.priority,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'targeted_message'
    };
    
    notifications.unshift(notification);
    localStorage.setItem('staffNotifications', JSON.stringify(notifications));
}

// Assignment Management Functions
function createAssignment() {
    const form = document.getElementById('assignmentForm');
    const formData = new FormData(form);
    
    // Get notification recipients
    const notificationCheckboxes = document.querySelectorAll('input[name="notifyRoles"]:checked');
    const notifyRoles = Array.from(notificationCheckboxes).map(cb => cb.value);
    
    const assignment = {
        id: Date.now(),
        title: formData.get('assignmentTitle'),
        type: formData.get('assignmentType'),
        description: formData.get('assignmentDescription'),
        assignedTo: formData.get('assignedTo'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate'),
        location: formData.get('location'),
        status: 'pending',
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
        notifyRoles: notifyRoles
    };
    
    // Save assignment
    let assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    assignments.unshift(assignment);
    localStorage.setItem('assignments', JSON.stringify(assignments));
    
    // Create notifications for assigned staff and notification roles
    createAssignmentNotifications(assignment);
    
    // Reset form and show success
    form.reset();
    Swal.fire('Success', 'Assignment created successfully!', 'success');
    
    // Refresh assignments display
    loadAssignments();
}

function createAssignmentNotifications(assignment) {
    let notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]');
    
    // Notify assigned person
    if (assignment.assignedTo && assignment.assignedTo !== 'all_staff') {
        const assignmentNotification = {
            id: Date.now() + Math.random(),
            targetUser: assignment.assignedTo,
            from: assignment.createdBy,
            fromRole: 'CTIO',
            subject: `New Assignment: ${assignment.title}`,
            content: `You have been assigned a new ${assignment.type} task. Priority: ${assignment.priority}. Due: ${dayjs(assignment.dueDate).format('MMM DD, YYYY')}`,
            priority: assignment.priority,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'assignment',
            assignmentId: assignment.id
        };
        
        notifications.unshift(assignmentNotification);
    }
    
    // Notify selected roles
    assignment.notifyRoles.forEach(role => {
        const roleNotification = {
            id: Date.now() + Math.random() + Math.random(),
            targetRole: role,
            from: assignment.createdBy,
            fromRole: 'CTIO',
            subject: `New Assignment Alert: ${assignment.title}`,
            content: `A new ${assignment.type} assignment has been created. Assigned to: ${assignment.assignedTo || 'All Staff'}. Priority: ${assignment.priority}.`,
            priority: assignment.priority,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'assignment_alert',
            assignmentId: assignment.id
        };
        
        notifications.unshift(roleNotification);
    });
    
    localStorage.setItem('staffNotifications', JSON.stringify(notifications));
}

function loadAssignments() {
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const assignmentsContainer = document.getElementById('assignmentsList');
    
    if (assignments.length === 0) {
        assignmentsContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-clipboard-list text-4xl mb-4"></i>
                <p>No assignments created yet</p>
            </div>
        `;
        return;
    }
    
    assignmentsContainer.innerHTML = assignments.map(assignment => {
        const priorityColors = {
            'low': 'bg-green-100 text-green-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'high': 'bg-red-100 text-red-800',
            'critical': 'bg-purple-100 text-purple-800'
        };
        
        const statusColors = {
            'pending': 'bg-gray-100 text-gray-800',
            'in_progress': 'bg-blue-100 text-blue-800',
            'completed': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        
        return `
            <div class="bg-white rounded-lg shadow-sm border p-4 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-900">${assignment.title}</h4>
                    <div class="flex gap-2">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${priorityColors[assignment.priority]}">
                            ${assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
                        </span>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[assignment.status]}">
                            ${assignment.status.replace('_', ' ').charAt(0).toUpperCase() + assignment.status.replace('_', ' ').slice(1)}
                        </span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-3">${assignment.description}</p>
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                        <strong>Type:</strong> ${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
                    </div>
                    <div>
                        <strong>Assigned to:</strong> ${assignment.assignedTo || 'All Staff'}
                    </div>
                    <div>
                        <strong>Due Date:</strong> ${dayjs(assignment.dueDate).format('MMM DD, YYYY')}
                    </div>
                    <div>
                        <strong>Location:</strong> ${assignment.location || 'Not specified'}
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span class="text-xs text-gray-400">
                        Created by ${assignment.createdBy} on ${dayjs(assignment.createdAt).format('MMM DD, YYYY HH:mm')}
                    </span>
                    <div class="flex gap-2">
                        <button onclick="updateAssignmentStatus('${assignment.id}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                            Update Status
                        </button>
                        <button onclick="viewAssignmentDetails('${assignment.id}')" 
                                class="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateAssignmentStatus(assignmentId) {
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const assignment = assignments.find(a => a.id == assignmentId);
    
    if (!assignment) return;
    
    Swal.fire({
        title: 'Update Assignment Status',
        input: 'select',
        inputOptions: {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        },
        inputValue: assignment.status,
        showCancelButton: true,
        confirmButtonText: 'Update',
        inputValidator: (value) => {
            if (!value) {
                return 'Please select a status!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            assignment.status = result.value;
            assignment.updatedAt = new Date().toISOString();
            assignment.updatedBy = currentUser.name;
            
            localStorage.setItem('assignments', JSON.stringify(assignments));
            
            // Create notification for status update
            if (assignment.assignedTo && assignment.assignedTo !== 'all_staff') {
                createStatusUpdateNotification(assignment);
            }
            
            loadAssignments();
            Swal.fire('Success', 'Assignment status updated!', 'success');
        }
    });
}

function createStatusUpdateNotification(assignment) {
    let notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]');
    
    const statusNotification = {
        id: Date.now() + Math.random(),
        targetUser: assignment.assignedTo,
        from: assignment.updatedBy,
        fromRole: 'CTIO',
        subject: `Assignment Status Updated: ${assignment.title}`,
        content: `Your assignment status has been updated to: ${assignment.status.replace('_', ' ').charAt(0).toUpperCase() + assignment.status.replace('_', ' ').slice(1)}`,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'status_update',
        assignmentId: assignment.id
    };
    
    notifications.unshift(statusNotification);
    localStorage.setItem('staffNotifications', JSON.stringify(notifications));
}

function viewAssignmentDetails(assignmentId) {
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const assignment = assignments.find(a => a.id == assignmentId);
    
    if (!assignment) return;
    
    const notifyRolesText = assignment.notifyRoles && assignment.notifyRoles.length > 0 
        ? assignment.notifyRoles.join(', ') 
        : 'None';
    
    Swal.fire({
        title: assignment.title,
        html: `
            <div class="text-left space-y-3">
                <div><strong>Type:</strong> ${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}</div>
                <div><strong>Description:</strong> ${assignment.description}</div>
                <div><strong>Assigned to:</strong> ${assignment.assignedTo || 'All Staff'}</div>
                <div><strong>Priority:</strong> ${assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}</div>
                <div><strong>Due Date:</strong> ${dayjs(assignment.dueDate).format('MMM DD, YYYY')}</div>
                <div><strong>Location:</strong> ${assignment.location || 'Not specified'}</div>
                <div><strong>Status:</strong> ${assignment.status.replace('_', ' ').charAt(0).toUpperCase() + assignment.status.replace('_', ' ').slice(1)}</div>
                <div><strong>Notified Roles:</strong> ${notifyRolesText}</div>
                <div><strong>Created by:</strong> ${assignment.createdBy} on ${dayjs(assignment.createdAt).format('MMM DD, YYYY HH:mm')}</div>
                ${assignment.updatedAt ? `<div><strong>Last Updated:</strong> ${assignment.updatedBy} on ${dayjs(assignment.updatedAt).format('MMM DD, YYYY HH:mm')}</div>` : ''}
            </div>
        `,
        width: 600,
        confirmButtonText: 'Close'
    });
}

function refreshAssignments() {
    loadAssignments();
    Swal.fire({
        title: 'Refreshed',
        text: 'Assignments list has been updated',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

// Initialize dayjs plugin for relative time
if (typeof dayjs !== 'undefined' && dayjs.extend) {
    dayjs.extend(dayjs_plugin_relativeTime);
}