// Team Chat Management
let currentUser = { 
    role: 'staff', 
    name: 'Staff Member', 
    id: 'staff_001',
    position: 'General Staff' 
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initTeamChat();
});

// Initialize team chat
function initTeamChat() {
    // Try to get user info from common.js getCurrentUser first
    let userData;
    if (typeof getCurrentUser === 'function') {
        const commonUser = getCurrentUser();
        if (commonUser && commonUser.name) {
            userData = commonUser;
            currentUser = {
                name: commonUser.name,
                role: (commonUser.role || 'staff').toLowerCase(),
                id: commonUser.id || `staff_${Date.now()}`
            };
        }
    }
    
    // Fallback to localStorage userData
    if (!userData) {
        userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
            currentUser = {
                name: userData.name || 'Staff Member',
                role: (userData.role || 'staff').toLowerCase(),
                id: userData.id || `staff_${Date.now()}`
            };
        }
    }
    
    // Also try staffSession from localStorage
    if (!userData) {
        const staffSession = localStorage.getItem('staffSession');
        if (staffSession) {
            try {
                const sessionData = JSON.parse(staffSession);
                currentUser = {
                    name: sessionData.name || 'Staff Member',
                    role: (sessionData.role || 'staff').toLowerCase(),
                    id: sessionData.id || `staff_${Date.now()}`
                };
                userData = sessionData;
            } catch (e) {
                console.error('Error parsing staffSession:', e);
            }
        }
    }
    
    // Update UI elements if they exist
    if (currentUser && userData) {
        const roleDisplay = document.getElementById('userRole');
        const initialDisplay = document.getElementById('userInitial');
        const roleBadgeDisplay = document.getElementById('userRoleBadge');
        
        if (roleDisplay) roleDisplay.textContent = formatRole(currentUser.role);
        if (initialDisplay) initialDisplay.textContent = currentUser.name.charAt(0).toUpperCase();
        if (roleBadgeDisplay) roleBadgeDisplay.textContent = formatRole(currentUser.role);
    }
    
    // Setup form event listeners
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', sendStaffChatMessage);
    }
    
    // Setup Enter key for sending messages
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendStaffChatMessage(e);
            }
        });
    }
    
    // Load chat messages
    loadChatMessages();
    
    // Auto-refresh messages every 10 seconds
    setInterval(loadChatMessages, 10000);
}

// Send chat message - using common.js for synchronization
function sendStaffChatMessage(event) {
    event.preventDefault();
    
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    
    const messageText = chatInput.value.trim();
    
    if (!messageText) {
        Swal.fire({
            icon: 'warning',
            title: 'Empty Message',
            text: 'Please enter a message before sending',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    // Ensure currentUser role is lowercase for compatibility
    const senderRole = (currentUser.role || 'staff').toLowerCase();
    const senderName = currentUser.name || 'Staff Member';
    
    // Use common.js sendChatMessage function for synchronization
    let message;
    
    // Access the global sendChatMessage function from common.js
    if (typeof sendChatMessage === 'function') {
        message = sendChatMessage(senderName, senderRole, messageText);
    } else {
        // Fallback: Direct localStorage access using common.js format
        message = {
            id: 'MSG' + Date.now() + Math.random().toString(36).substr(2, 9),
            sender: senderName,
            role: senderRole,
            text: messageText,
            timestamp: new Date().toISOString(),
            deleted: false
        };
        let teamMessages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
        teamMessages.push(message);
        localStorage.setItem('teamChatMessages', JSON.stringify(teamMessages));
    }
    
    if (message) {
        // Clear input
        chatInput.value = '';
        
        // Reload chat
        loadChatMessages();
        
        // Scroll to bottom
        scrollToBottom();
        
        // Show success feedback
        Swal.fire({
            icon: 'success',
            title: 'Message Sent!',
            timer: 1000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Failed to Send',
            text: 'Please try again',
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// Load chat messages - using common.js for synchronization
function loadChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // Use common.js getActiveChatMessages for synchronization with CTIO and Supervisor
    let messages;
    if (typeof getActiveChatMessages === 'function') {
        messages = getActiveChatMessages();
    } else {
        // Fallback to direct localStorage access
        messages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
    }
    
    // Get current user for comparison
    let currentStaffUser;
    if (typeof getCurrentUser === 'function') {
        currentStaffUser = getCurrentUser();
    } else {
        currentStaffUser = currentUser;
    }
    
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-6xl mb-4">💬</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p>Start the conversation by sending a message!</p>
            </div>
        `;
        return;
    }
    
    // Group messages by day
    const messagesByDay = groupMessagesByDay(messages);
    
    let chatHTML = '';
    
    Object.keys(messagesByDay).forEach(day => {
        // Add day separator
        chatHTML += `
            <div class="flex items-center justify-center my-4">
                <div class="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    ${day}
                </div>
            </div>
        `;
        
        // Add messages for this day
        messagesByDay[day].forEach(msg => {
            // Handle both old format (from, fromRole) and new format (sender, role)
            const messageSender = msg.sender || msg.from || 'Unknown';
            const messageRole = (msg.role || msg.fromRole || 'staff').toLowerCase();
            const messageText = msg.text || msg.message || '';
            const messageTimestamp = msg.timestamp || new Date().toISOString();
            
            const isCurrentUser = messageSender === (currentStaffUser.name || currentUser.name);
            const time = dayjs(messageTimestamp).format('h:mm A');
            const roleColor = getRoleColor(messageRole);
            
            chatHTML += `
                <div class="flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3">
                    <div class="max-w-xs lg:max-w-md">
                        ${!isCurrentUser ? `
                            <div class="flex items-center mb-1">
                                <span class="text-xs font-medium ${roleColor} mr-2">${formatRole(messageRole)}</span>
                                <span class="text-xs text-gray-500">${messageSender}</span>
                            </div>
                        ` : ''}
                        <div class="px-4 py-2 rounded-lg ${isCurrentUser ? 
                            'bg-red-600 text-white ml-auto' : 
                            'bg-white border border-gray-200 text-gray-800'
                        }">
                            <p class="text-sm whitespace-pre-wrap">${messageText}</p>
                        </div>
                        <div class="text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}">
                            ${time}
                        </div>
                    </div>
                </div>
            `;
        });
    });
    
    chatMessages.innerHTML = chatHTML;
    
    // Auto scroll to bottom after loading messages
    setTimeout(scrollToBottom, 100);
}

// Helper function to group messages by day
function groupMessagesByDay(messages) {
    const groups = {};
    
    messages.forEach(message => {
        const date = dayjs(message.timestamp);
        const today = dayjs();
        const yesterday = dayjs().subtract(1, 'day');
        
        let dayKey;
        if (date.isSame(today, 'day')) {
            dayKey = 'Today';
        } else if (date.isSame(yesterday, 'day')) {
            dayKey = 'Yesterday';
        } else {
            dayKey = date.format('MMMM DD, YYYY');
        }
        
        if (!groups[dayKey]) {
            groups[dayKey] = [];
        }
        groups[dayKey].push(message);
    });
    
    return groups;
}

// Helper function to get role color (handles both uppercase and lowercase roles)
function getRoleColor(role) {
    const roleLower = role ? role.toLowerCase() : 'staff';
    switch (roleLower) {
        case 'ctio':
        case 'admin':
            return 'text-purple-600';
        case 'supervisor':
            return 'text-blue-600';
        case 'customer_care':
            return 'text-green-600';
        case 'admin_assistant':
            return 'text-orange-600';
        case 'staff':
        default:
            return 'text-gray-600';
    }
}

// Scroll to bottom of chat
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Refresh chat
function refreshChat() {
    loadChatMessages();
    Swal.fire({
        title: 'Chat Refreshed!',
        text: 'Chat messages have been refreshed',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

// Utility function to format role
function formatRole(role) {
    const roleMap = {
        'admin': 'CTIO Admin',
        'supervisor': 'Supervisor',
        'staff': 'Staff Member',
        'customer_care': 'Customer Care',
        'admin_assistant': 'Admin Assistant',
        'management': 'Management Team',
        'all_staff': 'All Staff',
        'supervisors': 'All Supervisors'
    };
    return roleMap[role] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Navigation functions
function goBackToDashboard() {
    window.location.href = 'staff-dashboard.html';
}

function showProfile() {
    Swal.fire({
        title: 'User Profile',
        html: `
            <div class="text-left space-y-2">
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Role:</strong> ${formatRole(currentUser.role)}</p>
                <p><strong>ID:</strong> ${currentUser.id}</p>
            </div>
        `,
        confirmButtonText: 'Close',
        confirmButtonColor: '#DC2626'
    });
}

function logout() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, logout'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('userData');
            window.location.href = 'staff-login.html';
        }
    });
}

// Function to show staff communication from staff dashboard
function showStaffCommunication() {
    window.location.href = 'staff-communication.html';
}