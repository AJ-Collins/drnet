// Service Assignments Management System
let assignments = [];
let clients = [];
let technicians = [];
let supervisors = [];

// Mock data for demonstration
const mockData = {
  assignments: [
    {
      id: 'SA-2025-001',
      serviceType: 'installation',
      priority: 'high',
      status: 'assigned',
      clientId: 'client_001',
      client: 'Sarah Johnson',
      clientName: 'Sarah Johnson',
      clientContact: '+254712345678',
      technicianId: 'tech_001',
      technicianName: 'Mike Wilson',
      assignedTo: 'Mike Wilson',
      supervisorId: 'sup_001',
      supervisorName: 'David Chen',
      serviceAddress: '123 Main Street, Downtown, Nairobi',
      description: 'Install fiber optic internet connection with 100Mbps package',
      requiredEquipment: 'Fiber optic cable, Router, Modem, Installation tools',
      scheduledDate: '2025-10-22T09:00:00',
      estimatedDuration: 3,
      createdDate: '2025-10-20T08:30:00',
      createdAt: '2025-10-20T08:30:00',
      createdBy: 'Julius Ojwang\'',
      assignmentNumber: 'SA-001'
    },
    {
      id: 'SA-2025-002',
      serviceType: 'maintenance',
      priority: 'medium',
      status: 'in_progress',
      clientId: 'client_002',
      client: 'Michael Brown',
      clientName: 'Michael Brown',
      clientContact: 'michael@techcorp.com',
      technicianId: 'tech_002',
      technicianName: 'John Smith',
      assignedTo: 'John Smith',
      supervisorId: 'sup_001',
      supervisorName: 'David Chen',
      serviceAddress: '456 Oak Avenue, Suburb Area, Nairobi',
      description: 'Routine maintenance check and speed optimization',
      requiredEquipment: 'Testing equipment, Cable tester, Laptop',
      scheduledDate: '2025-10-21T14:00:00',
      estimatedDuration: 2,
      createdDate: '2025-10-19T10:15:00',
      createdAt: '2025-10-19T10:15:00',
      createdBy: 'Julius Ojwang\'',
      assignmentNumber: 'SA-002'
    },
    {
      id: 'SA-2025-003',
      serviceType: 'asset_recovery',
      priority: 'urgent',
      status: 'pending_review',
      clientId: 'client_003',
      client: 'Jennifer Wilson',
      clientName: 'Jennifer Wilson',
      clientContact: '+254734567890',
      technicianId: 'tech_003',
      technicianName: 'Robert Davis',
      assignedTo: 'Robert Davis',
      supervisorId: 'sup_002',
      supervisorName: 'Lisa Rodriguez',
      serviceAddress: '789 Pine Street, Business District, Nairobi',
      description: 'Recover equipment from terminated client account',
      requiredEquipment: 'Van, Packing materials, Recovery documentation',
      scheduledDate: '2025-10-21T11:00:00',
      estimatedDuration: 1.5,
      createdDate: '2025-10-20T07:45:00',
      createdAt: '2025-10-20T07:45:00',
      createdBy: 'Julius Ojwang\'',
      assignmentNumber: 'SA-003'
    }
  ],
  
  clients: [
    { id: 'client_001', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '+254712345678' },
    { id: 'client_002', name: 'Michael Brown', email: 'michael@email.com', phone: '+254723456789' },
    { id: 'client_003', name: 'Jennifer Wilson', email: 'jennifer@email.com', phone: '+254734567890' },
    { id: 'client_004', name: 'David Martinez', email: 'david@email.com', phone: '+254745678901' },
    { id: 'client_005', name: 'Emily Thompson', email: 'emily@email.com', phone: '+254756789012' }
  ],
  
  technicians: [
    { id: 'tech_001', name: 'Mike Wilson', role: 'Senior Technician', department: 'Technical', phone: '+254701234567' },
    { id: 'tech_002', name: 'John Smith', role: 'Technician', department: 'Technical', phone: '+254702345678' },
    { id: 'tech_003', name: 'Robert Davis', role: 'Supervisor', department: 'Technical', phone: '+254703456789' },
    { id: 'tech_004', name: 'James Anderson', role: 'Technician', department: 'Technical', phone: '+254704567890' },
    { id: 'tech_005', name: 'William Garcia', role: 'Senior Technician', department: 'Technical', phone: '+254705678901' }
  ],
  
  supervisors: [
    { id: 'sup_001', name: 'David Chen', role: 'Supervisor', department: 'Technical', phone: '+254711234567' },
    { id: 'sup_002', name: 'Lisa Rodriguez', role: 'Lead Supervisor', department: 'Operations', phone: '+254712345678' },
    { id: 'sup_003', name: 'Mark Thompson', role: 'Supervisor', department: 'Technical', phone: '+254713456789' }
  ]
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  initializeServiceAssignments();
  setupEventListeners();
  loadDropdownData();
  updateStatistics();
  renderAssignments();
});

function initializeServiceAssignments() {
  // Load data from localStorage or use mock data
  const savedAssignments = localStorage.getItem('serviceAssignments');
  if (savedAssignments) {
    assignments = JSON.parse(savedAssignments);
  } else {
    assignments = [...mockData.assignments];
    saveAssignments();
  }
  
  clients = mockData.clients;
  technicians = mockData.technicians;
  supervisors = mockData.supervisors;
}

function setupEventListeners() {
  // Mobile menu functionality
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const closeSidebar = document.getElementById('closeSidebar');

  mobileMenuButton?.addEventListener('click', () => {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  });

  closeSidebar?.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  });

  // Search and filter event listeners
  document.getElementById('searchInput')?.addEventListener('input', renderAssignments);
  document.getElementById('serviceTypeFilter')?.addEventListener('change', renderAssignments);
  document.getElementById('statusFilter')?.addEventListener('change', renderAssignments);
  document.getElementById('technicianFilter')?.addEventListener('change', renderAssignments);

  // Form submission
  document.getElementById('assignmentForm')?.addEventListener('submit', handleCreateAssignment);
}

function loadDropdownData() {
  // Note: Client input is now manual, no longer using dropdown
  
  // Populate technician dropdowns
  const technicianSelects = [document.getElementById('technicianId'), document.getElementById('technicianFilter')];
  technicianSelects.forEach(select => {
    if (select) {
      const isFilter = select.id === 'technicianFilter';
      select.innerHTML = isFilter ? '<option value="all">All Technicians</option>' : '<option value="">Select technician</option>';
      
      technicians.forEach(tech => {
        const option = document.createElement('option');
        option.value = tech.id;
        option.textContent = `${tech.name} - ${tech.role}`;
        select.appendChild(option);
      });
    }
  });

  // Populate supervisor dropdown
  const supervisorSelect = document.getElementById('supervisorId');
  if (supervisorSelect) {
    supervisorSelect.innerHTML = '<option value="">Select supervisor</option>';
    supervisors.forEach(supervisor => {
      const option = document.createElement('option');
      option.value = supervisor.id;
      option.textContent = `${supervisor.name} - ${supervisor.role}`;
      supervisorSelect.appendChild(option);
    });
  }
}

function updateStatistics() {
  const totalCount = assignments.length;
  const activeCount = assignments.filter(a => a.status === 'assigned' || a.status === 'in_progress').length;
  const pendingCount = assignments.filter(a => a.status === 'pending_review').length;
  const completedTodayCount = assignments.filter(a => {
    return a.status === 'completed' && dayjs(a.scheduledDate).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  }).length;

  document.getElementById('totalAssignments').textContent = totalCount;
  document.getElementById('activeAssignments').textContent = activeCount;
  document.getElementById('pendingAssignments').textContent = pendingCount;
  document.getElementById('completedToday').textContent = completedTodayCount;

  // Update notification badge
  const notificationCount = pendingCount + assignments.filter(a => a.priority === 'urgent').length;
  const badge = document.getElementById('notificationBadge');
  if (notificationCount > 0) {
    badge.textContent = notificationCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderAssignments() {
  const container = document.getElementById('assignmentsContainer');
  if (!container) return;

  // Get filter values
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const serviceTypeFilter = document.getElementById('serviceTypeFilter')?.value || 'all';
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';
  const technicianFilter = document.getElementById('technicianFilter')?.value || 'all';

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.clientName.toLowerCase().includes(searchTerm) ||
                         assignment.technicianName.toLowerCase().includes(searchTerm) ||
                         assignment.id.toLowerCase().includes(searchTerm) ||
                         assignment.description.toLowerCase().includes(searchTerm);
    
    const matchesServiceType = serviceTypeFilter === 'all' || assignment.serviceType === serviceTypeFilter;
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesTechnician = technicianFilter === 'all' || assignment.technicianId === technicianFilter;

    return matchesSearch && matchesServiceType && matchesStatus && matchesTechnician;
  });

  if (filteredAssignments.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">📋</div>
        <h3 class="text-xl font-semibold text-gray-600">No assignments found</h3>
        <p class="text-gray-500 mt-2">Try adjusting your search criteria or create a new assignment.</p>
      </div>
    `;
    return;
  }

  // Sort assignments by created date (newest first)
  filteredAssignments.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

  container.innerHTML = filteredAssignments.map(assignment => {
    const statusColors = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      pending_review: 'bg-orange-100 text-orange-800'
    };

    const priorityColors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    const serviceTypeIcons = {
      installation: '🔧',
      maintenance: '🛠️',
      asset_recovery: '📦'
    };

    const scheduledDate = dayjs(assignment.scheduledDate);
    const createdDate = dayjs(assignment.createdDate);

    return `
      <div class="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="text-2xl">${serviceTypeIcons[assignment.serviceType]}</div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">${assignment.id}</h3>
              <p class="text-sm text-gray-600">Created ${createdDate.format('MMM D, YYYY')} by ${assignment.createdBy}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${priorityColors[assignment.priority]}">
              ${assignment.priority.toUpperCase()}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[assignment.status]}">
              ${assignment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <p class="text-sm font-medium text-gray-700">Client</p>
            <p class="text-sm text-gray-900">${assignment.clientName}</p>
            ${assignment.clientContact ? `<p class="text-xs text-gray-600">${assignment.clientContact}</p>` : ''}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">Technician</p>
            <p class="text-sm text-gray-900">${assignment.technicianName}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">Supervisor</p>
            <p class="text-sm text-gray-900">${assignment.supervisorName}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">Scheduled</p>
            <p class="text-sm text-gray-900">${scheduledDate.format('MMM D, YYYY [at] h:mm A')}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">Duration</p>
            <p class="text-sm text-gray-900">${assignment.estimatedDuration} hours</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">Service Type</p>
            <p class="text-sm text-gray-900">${assignment.serviceType.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>

        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-1">Description</p>
          <p class="text-sm text-gray-900">${assignment.description}</p>
        </div>

        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-1">Service Address</p>
          <p class="text-sm text-gray-900">${assignment.serviceAddress}</p>
        </div>

        ${assignment.requiredEquipment ? `
          <div class="mb-4">
            <p class="text-sm font-medium text-gray-700 mb-1">Required Equipment</p>
            <p class="text-sm text-gray-900">${assignment.requiredEquipment}</p>
          </div>
        ` : ''}

        <div class="flex items-center justify-between pt-4 border-t border-gray-200">
          <div class="flex space-x-2">
            <button onclick="viewAssignment('${assignment.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
              👁️ View Details
            </button>
            <button onclick="editAssignment('${assignment.id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
              ✏️ Edit
            </button>
          </div>
          <div class="flex space-x-2">
            ${assignment.status !== 'completed' ? `
              <button onclick="updateAssignmentStatus('${assignment.id}', 'completed')" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
                ✅ Mark Complete
              </button>
            ` : ''}
            <button onclick="deleteAssignment('${assignment.id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function showCreateAssignmentModal() {
  document.getElementById('createAssignmentModal').classList.remove('hidden');
  
  // Set default scheduled date to tomorrow at 9 AM
  const tomorrow = dayjs().add(1, 'day').hour(9).minute(0);
  document.getElementById('scheduledDate').value = tomorrow.format('YYYY-MM-DDTHH:mm');
}

function closeCreateAssignmentModal() {
  document.getElementById('createAssignmentModal').classList.add('hidden');
  document.getElementById('assignmentForm').reset();
}

function handleCreateAssignment(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const clientName = document.getElementById('clientName').value.trim();
  const clientContact = document.getElementById('clientContact').value.trim();
  
  // Validate client name is not empty
  if (!clientName) {
    Swal.fire({
      title: 'Invalid Client Name',
      text: 'Please enter a valid client name.',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }
  
  const assignment = {
    id: generateAssignmentId(),
    serviceType: document.getElementById('serviceType').value,
    priority: document.getElementById('priority').value,
    status: 'assigned',
    clientId: `client_${Date.now()}`, // Generate unique client ID
    client: clientName,
    clientName: clientName,
    clientContact: clientContact,
    technicianId: document.getElementById('technicianId').value,
    technicianName: technicians.find(t => t.id === document.getElementById('technicianId').value)?.name || '',
    assignedTo: technicians.find(t => t.id === document.getElementById('technicianId').value)?.name || '',
    supervisorId: document.getElementById('supervisorId').value,
    supervisorName: supervisors.find(s => s.id === document.getElementById('supervisorId').value)?.name || '',
    serviceAddress: document.getElementById('serviceAddress').value,
    description: document.getElementById('description').value,
    requiredEquipment: document.getElementById('requiredEquipment').value,
    scheduledDate: document.getElementById('scheduledDate').value,
    estimatedDuration: parseFloat(document.getElementById('estimatedDuration').value),
    createdDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: 'Julius Ojwang\'',
    assignmentNumber: `SA-${String(assignments.length + 1).padStart(3, '0')}`
  };

  assignments.push(assignment);
  saveAssignments();
  
  // Send notification to supervisor dashboard
  sendNotificationToSupervisor(assignment);
  
  Swal.fire({
    title: 'Assignment Created!',
    text: `Service assignment ${assignment.id} has been created and assigned to ${assignment.technicianName}.`,
    icon: 'success',
    confirmButtonColor: '#10B981'
  });

  closeCreateAssignmentModal();
  updateStatistics();
  renderAssignments();
}

function generateAssignmentId() {
  const year = new Date().getFullYear();
  const nextNumber = assignments.length + 1;
  return `SA-${year}-${String(nextNumber).padStart(3, '0')}`;
}

function saveAssignments() {
  localStorage.setItem('serviceAssignments', JSON.stringify(assignments));
}

function sendNotificationToSupervisor(assignment) {
  // Save notification for supervisor dashboard
  const notifications = JSON.parse(localStorage.getItem('supervisorNotifications') || '[]');
  
  const notification = {
    id: `notif_${Date.now()}`,
    type: 'assignment',
    title: 'New Service Assignment',
    message: `You have been assigned to supervise ${assignment.serviceType} for ${assignment.client}`,
    assignmentId: assignment.id,
    supervisorId: assignment.supervisorId,
    createdDate: new Date().toISOString(),
    read: false,
    priority: assignment.priority
  };
  
  notifications.push(notification);
  localStorage.setItem('supervisorNotifications', JSON.stringify(notifications));
  
  // Also save for admin dashboard notifications
  const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
  adminNotifications.push({
    ...notification,
    id: `admin_notif_${Date.now()}`,
    title: 'Assignment Created',
    message: `Service assignment ${assignment.id} created for ${assignment.client} (${assignment.serviceType})`
  });
  localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
}

function viewAssignment(assignmentId) {
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return;

  const scheduledDate = dayjs(assignment.scheduledDate);
  const createdDate = dayjs(assignment.createdDate);

  Swal.fire({
    title: assignment.id,
    html: `
      <div class="text-left space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Service Type:</strong> ${assignment.serviceType.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Priority:</strong> ${assignment.priority.toUpperCase()}</p>
            <p><strong>Status:</strong> ${assignment.status.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Client:</strong> ${assignment.clientName}</p>
            <p><strong>Technician:</strong> ${assignment.technicianName}</p>
          </div>
          <div>
            <p><strong>Supervisor:</strong> ${assignment.supervisorName}</p>
            <p><strong>Scheduled:</strong> ${scheduledDate.format('MMM D, YYYY [at] h:mm A')}</p>
            <p><strong>Duration:</strong> ${assignment.estimatedDuration} hours</p>
            <p><strong>Created:</strong> ${createdDate.format('MMM D, YYYY')}</p>
            <p><strong>Created By:</strong> ${assignment.createdBy}</p>
          </div>
        </div>
        <div>
          <p><strong>Description:</strong></p>
          <p class="text-sm bg-gray-100 p-2 rounded">${assignment.description}</p>
        </div>
        <div>
          <p><strong>Service Address:</strong></p>
          <p class="text-sm bg-gray-100 p-2 rounded">${assignment.serviceAddress}</p>
        </div>
        ${assignment.requiredEquipment ? `
          <div>
            <p><strong>Required Equipment:</strong></p>
            <p class="text-sm bg-gray-100 p-2 rounded">${assignment.requiredEquipment}</p>
          </div>
        ` : ''}
      </div>
    `,
    width: '800px',
    confirmButtonColor: '#3B82F6'
  });
}

function editAssignment(assignmentId) {
  // For now, show a message that editing will be implemented
  Swal.fire({
    title: 'Edit Assignment',
    text: 'Assignment editing functionality will be implemented in the next update.',
    icon: 'info',
    confirmButtonColor: '#3B82F6'
  });
}

function updateAssignmentStatus(assignmentId, newStatus) {
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return;

  Swal.fire({
    title: 'Update Assignment Status?',
    text: `Change status to ${newStatus.replace('_', ' ').toUpperCase()}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, Update Status',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      assignment.status = newStatus;
      if (newStatus === 'completed') {
        assignment.completedDate = new Date().toISOString();
      }
      
      saveAssignments();
      updateStatistics();
      renderAssignments();
      
      Swal.fire({
        title: 'Status Updated!',
        text: `Assignment ${assignment.id} status has been updated to ${newStatus.replace('_', ' ').toUpperCase()}.`,
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
    }
  });
}

function deleteAssignment(assignmentId) {
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return;

  Swal.fire({
    title: 'Delete Assignment?',
    text: `Are you sure you want to delete assignment ${assignment.id}? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      assignments = assignments.filter(a => a.id !== assignmentId);
      saveAssignments();
      updateStatistics();
      renderAssignments();
      
      Swal.fire({
        title: 'Assignment Deleted!',
        text: 'The assignment has been successfully deleted.',
        icon: 'success',
        confirmButtonColor: '#EF4444'
      });
    }
  });
}

function logout() {
  Swal.fire({
    title: 'Logout?',
    text: 'Are you sure you want to logout?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, Logout',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = 'admin-login.html';
    }
  });
}

// Export functions for global access
window.showCreateAssignmentModal = showCreateAssignmentModal;
window.closeCreateAssignmentModal = closeCreateAssignmentModal;
window.viewAssignment = viewAssignment;
window.editAssignment = editAssignment;
window.updateAssignmentStatus = updateAssignmentStatus;
window.deleteAssignment = deleteAssignment;
window.logout = logout;