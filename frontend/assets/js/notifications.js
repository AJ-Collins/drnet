// Notification System for Staff Dashboards
// This handles displaying targeted messages and assignment notifications

let currentUserRole = null;
let currentUserName = null;

// Initialize notifications system
function initNotifications() {
    // Get current user info from localStorage
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData) {
        currentUserRole = userData.role;
        currentUserName = userData.name;
    }
    
    // Create notification container if it doesn't exist
    createNotificationContainer();
    
    // Load and display notifications
    loadNotifications();
    
    // Check for new notifications every 15 seconds
    setInterval(loadNotifications, 15000);
    
    console.log('🔔 Notification system initialized for:', currentUserName, '(' + currentUserRole + ')');
}

function createNotificationContainer() {
    // Check if container already exists
    if (document.getElementById('notificationContainer')) return;
    
    // Create notification container
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
    document.body.appendChild(container);
    
    // Add notification bell to navigation if it exists
    addNotificationBell();
}

function addNotificationBell() {
    // Look for navigation or header areas to add notification bell
    const navAreas = [
        document.querySelector('.navbar'),
        document.querySelector('nav'),
        document.querySelector('header'),
        document.querySelector('.header')
    ];
    
    for (const nav of navAreas) {
        if (nav) {
            const bellContainer = document.createElement('div');
            bellContainer.className = 'relative inline-block';
            bellContainer.innerHTML = `
                <button id="notificationBell" onclick="toggleNotificationPanel()" 
                        class="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <i class="fas fa-bell text-lg"></i>
                    <span id="notificationBadge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
                </button>
            `;
            nav.appendChild(bellContainer);
            break;
        }
    }
}

function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]');
    
    if (!currentUserName || !currentUserRole) return;
    
    // Filter notifications for current user
    const userNotifications = notifications.filter(notification => {
        // Check if notification is targeted to this specific user
        if (notification.targetUser === currentUserName) return true;
        
        // Check if notification is for this user's role
        if (notification.targetRole === currentUserRole) return true;
        
        // Check for broadcast messages (all staff)
        if (notification.targetRole === 'all_staff') return true;
        
        return false;
    }).filter(notification => !notification.isRead);
    
    // Update notification badge
    updateNotificationBadge(userNotifications.length);
    
    // Display new notifications as toasts
    userNotifications.slice(0, 3).forEach((notification, index) => {
        setTimeout(() => {
            showNotificationToast(notification);
        }, index * 1000); // Stagger notifications
    });
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function showNotificationToast(notification) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    // Check if this notification was already shown
    if (document.getElementById(`toast-${notification.id}`)) return;
    
    const priorityColors = {
        'low': 'bg-green-100 border-green-400 text-green-800',
        'medium': 'bg-yellow-100 border-yellow-400 text-yellow-800',
        'high': 'bg-red-100 border-red-400 text-red-800',
        'critical': 'bg-purple-100 border-purple-400 text-purple-800'
    };
    
    const typeIcons = {
        'targeted_message': '💬',
        'assignment': '📋',
        'assignment_alert': '📢',
        'status_update': '🔄',
        'broadcast': '📣'
    };
    
    const toast = document.createElement('div');
    toast.id = `toast-${notification.id}`;
    toast.className = `transform transition-all duration-300 translate-x-full opacity-0 bg-white border-l-4 ${priorityColors[notification.priority] || 'bg-blue-100 border-blue-400 text-blue-800'} rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl`;
    
    toast.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="text-2xl">${typeIcons[notification.type] || '📩'}</div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-gray-900 truncate">
                        ${notification.subject}
                    </p>
                    <button onclick="dismissNotification('${notification.id}')" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
                <p class="text-xs text-gray-600 mt-1">From: ${notification.from} (${notification.fromRole})</p>
                <p class="text-sm text-gray-700 mt-2 line-clamp-2">${notification.content}</p>
                <p class="text-xs text-gray-500 mt-2">${dayjs(notification.timestamp).fromNow()}</p>
            </div>
        </div>
    `;
    
    // Add click handler to view full notification
    toast.addEventListener('click', () => {
        viewNotificationDetails(notification.id);
    });
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    }, 100);
    
    // Auto dismiss after 8 seconds unless it's high priority
    if (notification.priority !== 'high' && notification.priority !== 'critical') {
        setTimeout(() => {
            dismissNotification(notification.id);
        }, 8000);
    }
}

function dismissNotification(notificationId) {
    const toast = document.getElementById(`toast-${notificationId}`);
    if (toast) {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
    
    // Mark as read in localStorage
    markNotificationAsRead(notificationId);
}

function markNotificationAsRead(notificationId) {
    let notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]');
    const notificationIndex = notifications.findIndex(n => n.id == notificationId);
    
    if (notificationIndex !== -1) {
        notifications[notificationIndex].isRead = true;
        notifications[notificationIndex].readAt = new Date().toISOString();
        notifications[notificationIndex].readBy = currentUserName;
        localStorage.setItem('staffNotifications', JSON.stringify(notifications));
        
        // Update badge count
        setTimeout(loadNotifications, 100);
    }
}

function viewNotificationDetails(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]');
    const notification = notifications.find(n => n.id == notificationId);
    
    if (!notification) return;
    
    const typeLabels = {
        'targeted_message': 'Personal Message',
        'assignment': 'New Assignment',
        'assignment_alert': 'Assignment Alert',
        'status_update': 'Status Update',
        'broadcast': 'Broadcast Message'
    };
    
    Swal.fire({
        title: typeLabels[notification.type] || 'Notification',
        html: `
            <div class="text-left space-y-3">
                <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="text-sm text-gray-600 space-y-1">
                        <p><strong>From:</strong> ${notification.from} (${notification.fromRole})</p>
                        <p><strong>Received:</strong> ${dayjs(notification.timestamp).format('MMM DD, YYYY [at] h:mm A')}</p>
                        <p><strong>Priority:</strong> <span class="capitalize">${notification.priority}</span></p>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">Subject</h4>
                    <p class="text-gray-700 bg-gray-50 p-3 rounded">${notification.subject}</p>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">Message</h4>
                    <p class="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">${notification.content}</p>
                </div>
                
                ${notification.assignmentId ? `
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p class="text-sm text-blue-700">
                        <i class="fas fa-info-circle mr-1"></i>
                        This notification is related to an assignment. Check the assignments section for more details.
                    </p>
                </div>
                ` : ''}
            </div>
        `,
        width: 600,
        confirmButtonText: 'Mark as Read',
        showCancelButton: true,
        cancelButtonText: 'Close'
    }).then((result) => {
        if (result.isConfirmed) {
            markNotificationAsRead(notificationId);
            dismissNotification(notificationId);
        }
    });
}

function toggleNotificationPanel() {
    // Create or toggle notification panel
    let panel = document.getElementById('notificationPanel');
    
    if (panel) {
        panel.remove();
        return;
    }
    
    panel = document.createElement('div');
    panel.id = 'notificationPanel';
    panel.className = 'fixed top-16 right-4 w-80 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden';
    
    const notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]')
        .filter(notification => {
            if (notification.targetUser === currentUserName) return true;
            if (notification.targetRole === currentUserRole) return true;
            if (notification.targetRole === 'all_staff') return true;
            return false;
        })
        .slice(0, 10); // Show last 10 notifications
    
    panel.innerHTML = `
        <div class="p-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">Notifications</h3>
                <button onclick="document.getElementById('notificationPanel').remove()" 
                        class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="max-h-80 overflow-y-auto">
            ${notifications.length === 0 ? `
                <div class="p-4 text-center text-gray-500">
                    <i class="fas fa-bell-slash text-2xl mb-2"></i>
                    <p>No notifications</p>
                </div>
            ` : notifications.map(notification => `
                <div class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}" 
                     onclick="viewNotificationDetails('${notification.id}')">
                    <div class="flex items-start space-x-2">
                        <div class="text-lg">${notification.type === 'assignment' ? '📋' : notification.type === 'targeted_message' ? '💬' : '📩'}</div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">${notification.subject}</p>
                            <p class="text-xs text-gray-600">From: ${notification.from}</p>
                            <p class="text-xs text-gray-500">${dayjs(notification.timestamp).fromNow()}</p>
                            ${!notification.isRead ? '<div class="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>' : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        ${notifications.length > 0 ? `
            <div class="p-3 border-t border-gray-200">
                <button onclick="markAllNotificationsAsRead()" 
                        class="w-full px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm">
                    Mark All as Read
                </button>
            </div>
        ` : ''}
    `;
    
    document.body.appendChild(panel);
}

function markAllNotificationsAsRead() {
    let notifications = JSON.parse(localStorage.getItem('staffNotifications') || '[]');
    
    notifications.forEach(notification => {
        if ((notification.targetUser === currentUserName || 
             notification.targetRole === currentUserRole || 
             notification.targetRole === 'all_staff') && 
            !notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            notification.readBy = currentUserName;
        }
    });
    
    localStorage.setItem('staffNotifications', JSON.stringify(notifications));
    
    // Close panel and update badge
    document.getElementById('notificationPanel').remove();
    loadNotifications();
    
    Swal.fire({
        title: 'Done!',
        text: 'All notifications marked as read',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

// Initialize notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure other systems are loaded
    setTimeout(initNotifications, 1000);
});

// Initialize dayjs plugin for relative time if available
if (typeof dayjs !== 'undefined' && dayjs.extend && typeof dayjs_plugin_relativeTime !== 'undefined') {
    dayjs.extend(dayjs_plugin_relativeTime);
}