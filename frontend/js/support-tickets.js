// ============================================
// SIMPLE SUPPORT TICKET MANAGEMENT SYSTEM
// ============================================
// Workflow:
// 1. Clients create tickets → Notifies CTIO & Supervisor
// 2. CTIO creates tickets → Can assign to Supervisor
// 3. Supervisor creates tickets → Notifies CTIO
// 4. All tickets stored centrally in localStorage

let allTickets = [];
let selectedTickets = new Set();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎫 Support Tickets System Initialized');
    loadTickets();
    updateStats();
    displayTickets();
});

// ============================================
// LOAD TICKETS
// ============================================
function loadTickets() {
    allTickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
    console.log(`📊 Loaded ${allTickets.length} tickets`);
}

// ============================================
// UPDATE STATISTICS
// ============================================
function updateStats() {
    const total = allTickets.length;
    const open = allTickets.filter(t => t.status === 'open').length;
    const inProgress = allTickets.filter(t => t.status === 'in-progress').length;
    const resolved = allTickets.filter(t => t.status === 'resolved').length;

    document.getElementById('totalTickets').textContent = total;
    document.getElementById('openTickets').textContent = open;
    document.getElementById('inProgressTickets').textContent = inProgress;
    document.getElementById('resolvedTickets').textContent = resolved;
}

// ============================================
// DISPLAY TICKETS
// ============================================
function displayTickets() {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;

    const filtered = getFilteredTickets();

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-12 text-center text-white/70">
                    <div class="text-5xl mb-4">🎫</div>
                    <p class="text-lg">No tickets found</p>
                    <p class="text-sm mt-2">Create a new ticket or adjust your filters</p>
                </td>
            </tr>
        `;
        updateDeleteButton();
        return;
    }

    tbody.innerHTML = filtered.map(ticket => {
        const priorityColors = {
            low: 'bg-green-500/80',
            medium: 'bg-yellow-500/80',
            high: 'bg-orange-500/80',
            critical: 'bg-red-500/80'
        };

        const statusColors = {
            open: 'bg-blue-500/80',
            'in-progress': 'bg-purple-500/80',
            resolved: 'bg-green-500/80',
            closed: 'bg-gray-500/80'
        };

        const sourceIcons = {
            client: '👤',
            supervisor: '👨‍💼',
            ctio: '🎯'
        };

        const isSelected = selectedTickets.has(ticket.id);
        return `
            <tr class="hover:bg-white/5 transition-colors duration-200">
                <td class="px-6 py-4">
                    <input type="checkbox" 
                           class="ticket-checkbox w-5 h-5 rounded border-white/30 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer" 
                           data-ticket-id="${ticket.id}"
                           onchange="toggleTicketSelection('${ticket.id}')"
                           ${isSelected ? 'checked' : ''}>
                </td>
                <td class="px-6 py-4 text-white font-mono text-sm">#${ticket.id}</td>
                <td class="px-6 py-4">
                    <div class="text-white font-medium">${ticket.clientName || ticket.client || ticket.subject || 'Unknown Client'}</div>
                    <div class="text-white/70 text-sm">${(ticket.description || '').substring(0, 50)}...</div>
                </td>
                <td class="px-6 py-4 text-white/90">${ticket.issueType || 'Unknown Issue'}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-white text-xs font-semibold ${priorityColors[ticket.priority?.toLowerCase()] || 'bg-gray-500/80'}">
                        ${(ticket.priority || 'Unknown').toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-white text-xs font-semibold ${statusColors[ticket.status?.toLowerCase()] || 'bg-gray-500/80'}">
                        ${(ticket.status || 'Unknown').toUpperCase().replace('-', ' ')}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-2xl" title="${ticket.source || 'Unknown'}">${sourceIcons[ticket.source] || '❓'}</span>
                    <span class="text-white/70 text-xs block">${ticket.createdBy || 'Unknown'}</span>
                </td>
                <td class="px-6 py-4 text-white/90 text-sm">${ticket.createdAt ? dayjs(ticket.createdAt).format('MMM D, YYYY h:mm A') : 'Unknown Date'}</td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="viewTicket('${ticket.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition-colors" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="updateTicketStatus('${ticket.id}')" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg text-xs transition-colors" title="Update Status">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${ticket.source === 'client' && ticket.status === 'open' ? `
                            <button onclick="forwardToSupervisor('${ticket.id}')" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-xs transition-colors" title="Forward to Supervisor">
                                <i class="fas fa-share"></i>
                            </button>
                        ` : ''}
                        <button onclick="deleteTicket('${ticket.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs transition-colors" title="Delete Ticket">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    updateDeleteButton();
}

// ============================================
// FILTER TICKETS
// ============================================
function getFilteredTickets() {
    const status = document.getElementById('filterStatus')?.value || 'all';
    const priority = document.getElementById('filterPriority')?.value || 'all';
    const source = document.getElementById('filterSource')?.value || 'all';
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

    return allTickets.filter(ticket => {
        const matchesStatus = status === 'all' || ticket.status === status;
        const matchesPriority = priority === 'all' || ticket.priority === priority;
        const matchesSource = source === 'all' || ticket.source === source;
        const matchesSearch = search === '' || 
            ticket.id.toLowerCase().includes(search) ||
            (ticket.clientName && ticket.clientName.toLowerCase().includes(search)) ||
            (ticket.subject && ticket.subject.toLowerCase().includes(search)) ||
            ticket.description.toLowerCase().includes(search) ||
            ticket.issueType.toLowerCase().includes(search);

        return matchesStatus && matchesPriority && matchesSource && matchesSearch;
    });
}

function filterTickets() {
    displayTickets();
}

// ============================================
// CREATE NEW TICKET (CTIO)
// ============================================
function createNewTicket() {
    Swal.fire({
        title: '🎫 Create Support Ticket',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Client Name / Subject</label>
                    <input type="text" id="ticketClient" class="w-full p-3 border rounded-lg" placeholder="Enter client name or ticket subject">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Issue Type</label>
                    <select id="ticketIssueType" class="w-full p-3 border rounded-lg">
                        <option value="Connection Issue">Connection Issue</option>
                        <option value="Slow Speed">Slow Speed</option>
                        <option value="No Internet">No Internet</option>
                        <option value="Billing Query">Billing Query</option>
                        <option value="Equipment Problem">Equipment Problem</option>
                        <option value="Installation Request">Installation Request</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Priority</label>
                    <select id="ticketPriority" class="w-full p-3 border rounded-lg">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Description</label>
                    <textarea id="ticketDescription" class="w-full p-3 border rounded-lg" rows="4" placeholder="Describe the issue in detail..."></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Assign To</label>
                    <select id="ticketAssignTo" class="w-full p-3 border rounded-lg">
                        <option value="ctio">Keep with CTIO</option>
                        <option value="supervisor">Assign to Supervisor</option>
                    </select>
                </div>
            </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Create Ticket',
        confirmButtonColor: '#667eea',
        preConfirm: () => {
            const client = document.getElementById('ticketClient').value;
            const issueType = document.getElementById('ticketIssueType').value;
            const priority = document.getElementById('ticketPriority').value;
            const description = document.getElementById('ticketDescription').value;
            const assignTo = document.getElementById('ticketAssignTo').value;

            if (!client || !description) {
                Swal.showValidationMessage('Please fill in all required fields');
                return false;
            }

            return { client, issueType, priority, description, assignTo };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const data = result.value;
            const newTicket = {
                id: generateTicketId(),
                clientName: data.client,
                subject: data.client,
                issueType: data.issueType,
                priority: data.priority,
                description: data.description,
                status: 'open',
                source: 'ctio',
                createdBy: 'CTIO Admin',
                assignedTo: data.assignTo === 'supervisor' ? 'Supervisor' : 'CTIO',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            allTickets.unshift(newTicket);
            localStorage.setItem('supportTickets', JSON.stringify(allTickets));

            // Notify Supervisor if assigned
            if (data.assignTo === 'supervisor') {
                notifySupervisor(newTicket);
            }

            displayTickets();
            updateStats();

            Swal.fire({
                icon: 'success',
                title: 'Ticket Created!',
                text: `Ticket #${newTicket.id} has been created successfully.`,
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

// ============================================
// VIEW TICKET DETAILS
// ============================================
function viewTicket(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const statusColors = {
        open: 'bg-blue-500',
        'in-progress': 'bg-purple-500',
        resolved: 'bg-green-500',
        closed: 'bg-gray-500'
    };

    const priorityColors = {
        low: 'bg-green-500',
        medium: 'bg-yellow-500',
        high: 'bg-orange-500',
        critical: 'bg-red-500'
    };

    Swal.fire({
        title: `🎫 Ticket #${ticket.id}`,
        html: `
            <div class="text-left space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Client/Subject</p>
                            <p class="font-semibold">${ticket.clientName || ticket.subject}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Issue Type</p>
                            <p class="font-semibold">${ticket.issueType}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Priority</p>
                            <span class="px-3 py-1 rounded-full text-white text-xs font-semibold ${priorityColors[ticket.priority]}">${ticket.priority.toUpperCase()}</span>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Status</p>
                            <span class="px-3 py-1 rounded-full text-white text-xs font-semibold ${statusColors[ticket.status]}">${ticket.status.toUpperCase().replace('-', ' ')}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <p class="text-xs text-gray-500 mb-2">Description</p>
                    <p class="bg-gray-50 p-4 rounded-lg">${ticket.description}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Created By</p>
                        <p class="font-semibold">${ticket.createdBy}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Assigned To</p>
                        <p class="font-semibold">${ticket.assignedTo || 'Not assigned'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Created</p>
                        <p class="text-sm">${dayjs(ticket.createdAt).format('MMM D, YYYY h:mm A')}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Last Updated</p>
                        <p class="text-sm">${dayjs(ticket.updatedAt).format('MMM D, YYYY h:mm A')}</p>
                    </div>
                </div>
            </div>
        `,
        width: '700px',
        confirmButtonText: 'Close',
        confirmButtonColor: '#667eea'
    });
}

// ============================================
// UPDATE TICKET STATUS
// ============================================
function updateTicketStatus(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    Swal.fire({
        title: 'Update Ticket Status',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Current Status: <strong>${ticket.status.toUpperCase()}</strong></label>
                    <select id="newStatus" class="w-full p-3 border rounded-lg">
                        <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                        <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Notes (Optional)</label>
                    <textarea id="statusNotes" class="w-full p-3 border rounded-lg" rows="3" placeholder="Add any notes about this status change..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update Status',
        confirmButtonColor: '#667eea',
        preConfirm: () => {
            const newStatus = document.getElementById('newStatus').value;
            const notes = document.getElementById('statusNotes').value;
            return { newStatus, notes };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { newStatus, notes } = result.value;
            const oldStatus = ticket.status;

            // Update ticket
            ticket.status = newStatus;
            ticket.updatedAt = new Date().toISOString();
            if (notes) {
                ticket.statusNotes = ticket.statusNotes || [];
                ticket.statusNotes.push({
                    status: newStatus,
                    notes: notes,
                    updatedBy: 'CTIO Admin',
                    timestamp: new Date().toISOString()
                });
            }

            localStorage.setItem('supportTickets', JSON.stringify(allTickets));
            displayTickets();
            updateStats();

            // Notify source if status changed significantly
            if (ticket.source === 'client' && (newStatus === 'resolved' || newStatus === 'closed')) {
                console.log(`✅ Ticket #${ticketId} ${newStatus} - Client should be notified`);
            }

            Swal.fire({
                icon: 'success',
                title: 'Status Updated!',
                text: `Ticket #${ticketId} status changed from "${oldStatus}" to "${newStatus}"`,
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

// ============================================
// FORWARD TO SUPERVISOR
// ============================================
function forwardToSupervisor(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    Swal.fire({
        title: 'Forward to Supervisor',
        html: `
            <div class="text-left space-y-3">
                <p>Forward ticket <strong>#${ticketId}</strong> to the Supervisor?</p>
                <div class="bg-blue-50 p-3 rounded">
                    <p class="text-sm"><strong>Client:</strong> ${ticket.clientName}</p>
                    <p class="text-sm"><strong>Issue:</strong> ${ticket.issueType}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Instructions for Supervisor</label>
                    <textarea id="supervisorInstructions" class="w-full p-3 border rounded-lg" rows="3" placeholder="Add any special instructions..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Forward to Supervisor',
        confirmButtonColor: '#667eea',
        preConfirm: () => {
            return document.getElementById('supervisorInstructions').value;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const instructions = result.value;

            // Update ticket
            ticket.assignedTo = 'Supervisor';
            ticket.status = 'in-progress';
            ticket.supervisorInstructions = instructions;
            ticket.forwardedAt = new Date().toISOString();
            ticket.updatedAt = new Date().toISOString();

            localStorage.setItem('supportTickets', JSON.stringify(allTickets));

            // Notify supervisor
            notifySupervisor(ticket, instructions);

            displayTickets();
            updateStats();

            Swal.fire({
                icon: 'success',
                title: 'Forwarded!',
                text: `Ticket #${ticketId} has been forwarded to the Supervisor`,
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateTicketId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}${random}`;
}

function notifySupervisor(ticket, instructions = '') {
    let supervisorNotifications = JSON.parse(localStorage.getItem('supervisorNotifications') || '[]');
    
    supervisorNotifications.unshift({
        id: `SN${Date.now()}`,
        type: 'ticket_assigned',
        ticketId: ticket.id,
        title: `New Ticket Assigned: ${ticket.issueType}`,
        message: `Ticket #${ticket.id} from ${ticket.clientName || 'CTIO'} - Priority: ${ticket.priority}`,
        instructions: instructions,
        priority: ticket.priority,
        timestamp: new Date().toISOString(),
        read: false
    });

    // Keep last 100 notifications
    if (supervisorNotifications.length > 100) {
        supervisorNotifications = supervisorNotifications.slice(0, 100);
    }

    localStorage.setItem('supervisorNotifications', JSON.stringify(supervisorNotifications));
    console.log('🔔 Supervisor notified about ticket #' + ticket.id);
}

// ============================================
// DELETE TICKET
// ============================================
function deleteTicket(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    Swal.fire({
        title: 'Delete Ticket?',
        html: `
            <div class="text-left space-y-3">
                <p class="text-red-600 font-semibold">⚠️ Warning: This action cannot be undone!</p>
                <div class="bg-gray-50 p-3 rounded">
                    <p class="text-sm"><strong>Ticket ID:</strong> #${ticket.id}</p>
                    <p class="text-sm"><strong>Client:</strong> ${ticket.clientName || ticket.subject}</p>
                    <p class="text-sm"><strong>Issue:</strong> ${ticket.issueType}</p>
                    <p class="text-sm"><strong>Status:</strong> ${ticket.status.toUpperCase()}</p>
                </div>
                <p>Are you sure you want to permanently delete this ticket?</p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete It',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280'
    }).then((result) => {
        if (result.isConfirmed) {
            // Remove ticket from array
            const index = allTickets.findIndex(t => t.id === ticketId);
            if (index > -1) {
                allTickets.splice(index, 1);
                localStorage.setItem('supportTickets', JSON.stringify(allTickets));
                
                displayTickets();
                updateStats();

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: `Ticket #${ticketId} has been permanently deleted.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        }
    });
}

// ============================================
// SELECT ALL / DELETE SELECTED FUNCTIONALITY
// ============================================
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const isChecked = selectAllCheckbox.checked;
    
    if (isChecked) {
        // Select all visible tickets
        const filtered = getFilteredTickets();
        filtered.forEach(ticket => selectedTickets.add(ticket.id));
    } else {
        // Deselect all
        selectedTickets.clear();
    }
    
    displayTickets();
}

function toggleTicketSelection(ticketId) {
    if (selectedTickets.has(ticketId)) {
        selectedTickets.delete(ticketId);
    } else {
        selectedTickets.add(ticketId);
    }
    updateDeleteButton();
    updateSelectAllCheckbox();
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllCheckbox) return;
    
    const filtered = getFilteredTickets();
    const allSelected = filtered.length > 0 && filtered.every(ticket => selectedTickets.has(ticket.id));
    selectAllCheckbox.checked = allSelected;
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const countSpan = document.getElementById('selectedCount');
    
    if (selectedTickets.size > 0) {
        deleteBtn.classList.remove('hidden');
        deleteBtn.classList.add('flex');
        countSpan.textContent = selectedTickets.size;
    } else {
        deleteBtn.classList.add('hidden');
        deleteBtn.classList.remove('flex');
    }
}

function deleteSelectedTickets() {
    if (selectedTickets.size === 0) return;
    
    const ticketIds = Array.from(selectedTickets);
    const tickets = allTickets.filter(t => ticketIds.includes(t.id));
    
    Swal.fire({
        title: 'Delete Selected Tickets?',
        html: `
            <div class="text-left space-y-3">
                <p class="text-red-600 font-semibold">⚠️ Warning: This action cannot be undone!</p>
                <div class="bg-gray-50 p-3 rounded">
                    <p class="text-sm font-semibold mb-2">You are about to delete ${selectedTickets.size} ticket(s):</p>
                    <ul class="list-disc list-inside text-sm space-y-1 max-h-48 overflow-y-auto">
                        ${tickets.map(t => `
                            <li><strong>#${t.id}</strong> - ${t.clientName || t.subject} (${t.issueType})</li>
                        `).join('')}
                    </ul>
                </div>
                <p>Are you sure you want to permanently delete these tickets?</p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Yes, Delete ${selectedTickets.size} Ticket(s)`,
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        width: '600px'
    }).then((result) => {
        if (result.isConfirmed) {
            // Remove all selected tickets
            allTickets = allTickets.filter(t => !selectedTickets.has(t.id));
            localStorage.setItem('supportTickets', JSON.stringify(allTickets));
            
            const deletedCount = selectedTickets.size;
            selectedTickets.clear();
            
            displayTickets();
            updateStats();

            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: `${deletedCount} ticket(s) have been permanently deleted.`,
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

// Make functions globally available
window.createNewTicket = createNewTicket;
window.viewTicket = viewTicket;
window.updateTicketStatus = updateTicketStatus;
window.forwardToSupervisor = forwardToSupervisor;
window.deleteTicket = deleteTicket;
window.filterTickets = filterTickets;
window.toggleSelectAll = toggleSelectAll;
window.toggleTicketSelection = toggleTicketSelection;
window.deleteSelectedTickets = deleteSelectedTickets;
