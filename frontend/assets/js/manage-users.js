let expandedCard = null;
let viewingUser = null;

let currentTab = 'clients';

document.addEventListener('DOMContentLoaded', async () => {
  const sidebar = document.getElementById('sidebar');
  const toggleSidebar = document.getElementById('toggleSidebar');
  const closeSidebar = document.getElementById('closeSidebar');
  
  // Client search and filters
  const clientSearchInput = document.getElementById('clientSearchInput');
  const subscriptionFilter = document.getElementById('subscriptionFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  // Staff search and filters
  const staffSearchInput = document.getElementById('staffSearchInput');
  const departmentFilter = document.getElementById('departmentFilter');
  const staffStatusFilter = document.getElementById('staffStatusFilter');

  toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
  });

  closeSidebar.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
  });

  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && !sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.add('-translate-x-full');
    }
  });

  // Event listeners for client search and filters
  clientSearchInput.addEventListener('input', renderManageUsers);
  subscriptionFilter.addEventListener('change', renderManageUsers);
  statusFilter.addEventListener('change', renderManageUsers);
  
  // Event listeners for staff search and filters
  staffSearchInput.addEventListener('input', renderManageStaff);
  departmentFilter.addEventListener('change', renderManageStaff);
  staffStatusFilter.addEventListener('change', renderManageStaff);
  
  // Event listener for attendance date picker
  const attendanceDate = document.getElementById('attendanceDate');
  if (attendanceDate) {
    attendanceDate.addEventListener('change', loadAttendanceData);
  } else {
    // Section removed, remove event listeners
    window.removeEventListener('attendanceUpdated', loadAttendanceData);
    window.removeEventListener('storage', () => {
      // Handler removed
    });
  }
  
  // Real-time synchronization for attendance updates
  window.addEventListener('attendanceUpdated', () => {
    loadAttendanceData();
  });
  
  // Listen for storage changes (cross-tab synchronization)
  window.addEventListener('storage', (e) => {
    if (e.key === 'attendanceHistory' || e.key === 'staffRegister' || e.key === 'ctioAttendance') {
      loadAttendanceData();
    }
  });
  
  // Initialize the page
  await initializeManageUsers();
});

async function renderManageUsers() {
  const container = document.getElementById('clientListContent');
  const searchInput = document.getElementById('clientSearchInput').value.toLowerCase();
  const subscriptionFilter = document.getElementById('subscriptionFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;

  container.innerHTML = '<div class="text-center text-gray-500 py-8">⏳ Loading clients...</div>';

  try {
    await fetchData();
    let filteredUsers = users.filter(u => u.is_deleted !== 1);

    // Apply search filter
    if (searchInput) {
      filteredUsers = filteredUsers.filter(u =>
        u.name.toLowerCase().includes(searchInput) ||
        u.phone.toLowerCase().includes(searchInput) ||
        u.location.toLowerCase().includes(searchInput)
      );
    }

    // Apply subscription filter
    if (subscriptionFilter !== 'all') {
      filteredUsers = filteredUsers.filter(u =>
        subscriptionFilter === 'paid' ? u.paid_subscription : !u.paid_subscription
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredUsers = filteredUsers.filter(u => {
        const paymentDate = dayjs(u.payment_date);
        const expiryDate = paymentDate.add(30, 'day');
        const daysRemaining = expiryDate.diff(dayjs(), 'day');
        const isActive = daysRemaining >= 0;
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    if (filteredUsers.length === 0) {
      container.innerHTML = `<p class="text-gray-500 text-center py-8">No users found.</p>`;
      return;
    }

    container.innerHTML = filteredUsers.map(user => {
      // Calculate expiry date and days remaining
      const paymentDate = dayjs(user.payment_date);
      const expiryDate = paymentDate.add(30, 'day');
      const daysRemaining = expiryDate.diff(dayjs(), 'day');
      const isActive = daysRemaining >= 0;
      const statusColor = isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700';

      return `
        <div id="user-card-${user.id}" class="relative overflow-hidden bg-gradient-to-r from-white via-gray-50 to-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50">
          <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-100/30 to-transparent rounded-full blur-xl"></div>
          <div class="relative z-10">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h5 class="font-semibold text-lg text-gray-800">${user.name}</h5>
                  <span class="px-3 py-1 text-xs rounded-full font-medium ${statusColor}">
                    ${isActive ? 'Active' : 'Expired'}
                  </span>
                </div>
                <p class="text-gray-600 font-medium">${user.phone} • ${user.location}</p>
                <p class="text-sm text-gray-500">${user.package}</p>
                <div class="flex items-center mt-2">
                  <span class="text-sm text-gray-600">Expires: ${expiryDate.format('MMM D, YYYY')}</span>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-lg text-gray-800">KSH ${Number(user.subscription_amount).toLocaleString()}</p>
                ${user.router_cost > 0 ? `<p class="text-sm text-gray-600">Router: KSH ${Number(user.router_cost).toLocaleString()}</p>` : ''}
                <div class="flex flex-wrap gap-2 mt-3">
                  <button onclick="viewUser('${user.id}')" class="p-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all duration-200 text-sm shadow-sm" title="View Details">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm6 0c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z"></path></svg>
                  </button>
                  <button onclick="DeleteUser('${user.id}')" class="p-2 bg-gradient-to-r from-red-100 to-pink-200 text-red-700 rounded-lg hover:from-red-200 hover:to-pink-300 transition-all duration-200 text-sm shadow-sm" title="Delete User">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M7 7h10"></path></svg>
                  </button>
                </div>
              </div>
            </div>
            <div id="expandable-details-${user.id}" class="hidden mt-4 pt-4 border-t border-gray-200">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Payment Date:</strong> ${paymentDate.format('MMM D, YYYY')}</p>
                  <p><strong>Expiry Date:</strong> ${expiryDate.format('MMM D, YYYY')}</p>
                </div>
                <div>
                  <p><strong>Days Remaining:</strong> ${daysRemaining} days</p>
                  <p><strong>Subscription Status:</strong> ${user.paid_subscription ? 'Paid' : 'Unpaid'}</p>
                </div>
              </div>
            </div>
            <button onclick="toggleExpandCard('${user.id}')" class="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-200">
              ${expandedCard === user.id ? 'Show Less' : 'Show More Details'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading users:', err);
    container.innerHTML = `<p class="text-red-600 text-center py-8">Failed to load users. Please try again later.</p>`;
  }
}

// Tab switching functionality
function switchUserTab(tab) {
  const clientsSection = document.getElementById('clientsSection');
  const staffSection = document.getElementById('staffSection');
  const attendanceSection = document.getElementById('staffAttendanceSection');
  const clientsTab = document.getElementById('clientsTab');
  const staffTab = document.getElementById('staffTab');
  const attendanceTab = document.getElementById('attendanceTab');
  const exportButton = document.getElementById('exportButton');

  currentTab = tab;

  // Hide all sections first
  clientsSection.classList.add('hidden');
  staffSection.classList.add('hidden');
  attendanceSection.classList.add('hidden');

  // Remove active state from all tabs
  [clientsTab, staffTab, attendanceTab].forEach(tabElement => {
    tabElement.classList.remove('bg-white', 'text-blue-600', 'shadow-sm', 'active');
    tabElement.classList.add('text-gray-600', 'hover:text-blue-600');
  });

  if (tab === 'clients') {
    clientsSection.classList.remove('hidden');
    clientsTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm', 'active');
    clientsTab.classList.remove('text-gray-600', 'hover:text-blue-600');
    exportButton.innerHTML = '<i class="fas fa-download mr-2"></i> Export Clients to CSV';
    renderManageUsers();
  } else if (tab === 'staff') {
    staffSection.classList.remove('hidden');
    staffTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm', 'active');
    staffTab.classList.remove('text-gray-600', 'hover:text-blue-600');
    exportButton.innerHTML = '<i class="fas fa-download mr-2"></i> Export Staff to CSV';
    renderManageStaff();
  } else if (tab === 'attendance') {
    attendanceSection.classList.remove('hidden');
    attendanceTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm', 'active');
    attendanceTab.classList.remove('text-gray-600', 'hover:text-blue-600');
    exportButton.innerHTML = '<i class="fas fa-download mr-2"></i> Export Attendance to CSV';
    loadAttendanceData();
  }
}

// Staff management functions
async function renderManageStaff() {
  const container = document.getElementById('staffListContent');
  const searchInput = document.getElementById('staffSearchInput').value.toLowerCase();
  const departmentFilter = document.getElementById('departmentFilter').value;
  const staffStatusFilter = document.getElementById('staffStatusFilter').value;

  container.innerHTML = '<div class="text-center text-gray-500 py-8">⏳ Loading staff...</div>';

  try {
    await fetchData();
    let filteredStaff = staff.filter(s => s.is_deleted !== 1);

    // Apply search filter
    if (searchInput) {
      filteredStaff = filteredStaff.filter(s =>
        s.name.toLowerCase().includes(searchInput) ||
        s.employee_id.toLowerCase().includes(searchInput) ||
        s.role.toLowerCase().includes(searchInput) ||
        s.department.toLowerCase().includes(searchInput) ||
        s.email.toLowerCase().includes(searchInput)
      );
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filteredStaff = filteredStaff.filter(s => s.department === departmentFilter);
    }

    // Apply status filter
    if (staffStatusFilter !== 'all') {
      filteredStaff = filteredStaff.filter(s => 
        staffStatusFilter === 'active' ? s.status === 'active' : s.status !== 'active'
      );
    }

    if (filteredStaff.length === 0) {
      container.innerHTML = `<p class="text-gray-500 text-center py-8">No staff members found.</p>`;
      return;
    }

    container.innerHTML = filteredStaff.map(staffMember => {
      const hireDate = dayjs(staffMember.hire_date);
      const statusColor = staffMember.status === 'active'
        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' 
        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700';

      return `
        <div id="staff-card-${staffMember.id}" class="relative overflow-hidden bg-gradient-to-r from-white via-gray-50 to-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50">
          <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-100/30 to-transparent rounded-full blur-xl"></div>
          <div class="relative z-10">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h5 class="font-semibold text-lg text-gray-800">${staffMember.name}</h5>
                  <span class="px-3 py-1 text-xs rounded-full font-medium ${statusColor}">
                    ${staffMember.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p class="text-gray-600 font-medium">${staffMember.employee_id} • ${staffMember.email}</p>
                <p class="text-sm text-gray-500">${staffMember.role} - ${staffMember.department}</p>
                <div class="flex items-center mt-2">
                  <span class="text-sm text-gray-600">Hired: ${hireDate.format('MMM D, YYYY')}</span>
                  ${staffMember.salary ? `<span class="ml-4 text-sm text-gray-600">Salary: KSH ${parseFloat(staffMember.salary).toLocaleString()}</span>` : ''}
                </div>
              </div>
              <div class="flex space-x-2">
                <button onclick="viewStaff('${staffMember.id}')" class="p-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all duration-200 text-sm shadow-sm" title="View Details">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm6 0c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z"></path></svg>
                </button>
                <button onclick="editStaff('${staffMember.id}')" class="p-2 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-lg hover:from-green-200 hover:to-green-300 transition-all duration-200 text-sm shadow-sm" title="Edit Staff">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="toggleStaffStatus('${staffMember.id}')" class="p-2 bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-700 rounded-lg hover:from-yellow-200 hover:to-orange-300 transition-all duration-200 text-sm shadow-sm" title="${staffMember.status === 'active' ? 'Deactivate' : 'Activate'} Staff">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>
                <button onclick="DeleteStaff('${staffMember.id}')" class="p-2 bg-gradient-to-r from-red-100 to-pink-200 text-red-700 rounded-lg hover:from-red-200 hover:to-pink-300 transition-all duration-200 text-sm shadow-sm" title="Delete Staff">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading staff:', err);
    container.innerHTML = `<p class="text-red-600 text-center py-8">Failed to load staff. Please try again later.</p>`;
  }
}

// Staff view function
async function viewStaff(staffId) {
  const staffMember = staff.find(s => s.id == staffId);
  if (!staffMember) return;

  const hireDate = dayjs(staffMember.hire_date);
  
  Swal.fire({
    title: `${staffMember.name}`,
    html: `
      <div class="text-left space-y-3">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Employee ID:</strong> ${staffMember.employee_id}</p>
            <p><strong>Position:</strong> ${staffMember.role}</p>
            <p><strong>Department:</strong> ${staffMember.department}</p>
            <p><strong>Email:</strong> ${staffMember.email}</p>
          </div>
          <div>
            <p><strong>Phone:</strong> ${staffMember.phone || 'N/A'}</p>
            <p><strong>Hire Date:</strong> ${hireDate.format('MMM D, YYYY')}</p>
            <p><strong>Salary:</strong> ${staffMember.salary ? `KSH ${parseFloat(staffMember.salary).toLocaleString()}` : 'N/A'}</p>
            <p><strong>Status:</strong> <span class="${staffMember.status === 'active' ? 'text-green-600' : 'text-red-600'}">${staffMember.status === 'active' ? 'Active' : 'Inactive'}</span></p>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Edit Staff',
    cancelButtonText: 'Close',
    confirmButtonColor: '#10B981'
  }).then((result) => {
    if (result.isConfirmed) {
      editStaff(staffId);
    }
  });
}

// Edit staff function
async function editStaff(staffId) {
  const staffMember = staff.find(s => s.id == staffId);
  if (!staffMember) {
    Swal.fire('Error', 'Staff member not found', 'error');
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: `Edit Staff: ${staffMember.name}`,
    html: `
      <div class="text-left space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input id="edit-name" class="w-full p-2 border border-gray-300 rounded-lg" value="${staffMember.name}" type="text">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input id="edit-employee-id" class="w-full p-2 border border-gray-300 rounded-lg" value="${staffMember.employee_id}" type="text">
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="edit-email" class="w-full p-2 border border-gray-300 rounded-lg" value="${staffMember.email}" type="email">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input id="edit-phone" class="w-full p-2 border border-gray-300 rounded-lg" value="${staffMember.phone || ''}" type="tel">
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Position/Role</label>
            <select id="edit-position" class="w-full p-2 border border-gray-300 rounded-lg">
              <option value="Supervisor" ${staffMember.role === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
              <option value="Customer Care" ${staffMember.role === 'Customer Care' ? 'selected' : ''}>Customer Care</option>
              <option value="Sales Representative" ${staffMember.role === 'Sales Representative' ? 'selected' : ''}>Sales Representative</option>
              <option value="Technician" ${staffMember.role === 'Technician' ? 'selected' : ''}>Technician</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select id="edit-department" class="w-full p-2 border border-gray-300 rounded-lg">
              <option value="Technical" ${staffMember.department === 'Technical' ? 'selected' : ''}>Technical</option>
              <option value="Customer Service" ${staffMember.department === 'Customer Service' ? 'selected' : ''}>Customer Service</option>
              <option value="Sales" ${staffMember.department === 'Sales' ? 'selected' : ''}>Sales</option>
              <option value="Administration" ${staffMember.department === 'Administration' ? 'selected' : ''}>Administration</option>
              <option value="Operations" ${staffMember.department === 'Operations' ? 'selected' : ''}>Operations</option>
              <option value="Finance" ${staffMember.department === 'Finance' ? 'selected' : ''}>Finance</option>
              <option value="Marketing" ${staffMember.department === 'Marketing' ? 'selected' : ''}>Marketing</option>
              <option value="Human Resources" ${staffMember.department === 'Human Resources' ? 'selected' : ''}>Human Resources</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Salary (KSH)</label>
            <input id="edit-salary" class="w-full p-2 border border-gray-300 rounded-lg" value="${staffMember.salary || ''}" type="number" min="0">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
            <input id="edit-hire-date" class="w-full p-2 border border-gray-300 rounded-lg" value="${dayjs(staffMember.hire_date).format('YYYY-MM-DD')}" type="date">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="edit-status" class="w-full p-2 border border-gray-300 rounded-lg">
            <option value="active" ${staffMember.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${staffMember.status !== 'active' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save Changes',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#10B981',
    width: '600px',
    preConfirm: () => {
      const name = document.getElementById('edit-name').value.trim();
      const employeeId = document.getElementById('edit-employee-id').value.trim();
      const email = document.getElementById('edit-email').value.trim();
      const phone = document.getElementById('edit-phone').value.trim();
      const position = document.getElementById('edit-position').value;
      const department = document.getElementById('edit-department').value;
      const salary = document.getElementById('edit-salary').value;
      const hireDate = document.getElementById('edit-hire-date').value;
      const status = document.getElementById('edit-status').value;

      // Validation
      if (!name || !employeeId || !email || !position || !department || !hireDate) {
        Swal.showValidationMessage('Please fill in all required fields');
        return false;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Swal.showValidationMessage('Please enter a valid email address');
        return false;
      }

      if (phone && !/^[0-9+\-\s()]+$/.test(phone)) {
        Swal.showValidationMessage('Please enter a valid phone number');
        return false;
      }

      if (salary && (isNaN(salary) || parseFloat(salary) < 0)) {
        Swal.showValidationMessage('Please enter a valid salary amount');
        return false;
      }

      return {
        name,
        employee_id: employeeId,
        email,
        phone,
        role: position,
        department,
        salary: salary ? parseFloat(salary) : null,
        hire_date: hireDate,
        status: status
      };
    }
  });

  if (formValues) {
    try {
      console.log('🔄 Mock updating staff:', staffMember.name);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the staff member in mock data
      Object.assign(staffMember, formValues);
      
      Swal.fire({
        title: 'Success!',
        text: `✅ Staff member updated successfully (Mock Mode)`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Refresh the staff list
      renderManageStaff();
      
    } catch (error) {
      console.error('Error updating staff:', error);
      Swal.fire('Error', 'Failed to update staff member', 'error');
    }
  }
}

// Toggle staff status function
async function toggleStaffStatus(staffId) {
  const staffMember = staff.find(s => s.id == staffId);
  if (!staffMember) return;

  const action = staffMember.status === 'active' ? 'deactivate' : 'activate';
  
  Swal.fire({
    title: `${action.charAt(0).toUpperCase() + action.slice(1)} Staff?`,
    text: `Are you sure you want to ${action} ${staffMember.name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `Yes, ${action}!`,
    cancelButtonText: 'Cancel'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        console.log(`🔄 Mock ${action} staff:`, staffMember.name);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Update the staff member status in mock data
        staffMember.status = staffMember.status === 'active' ? 'inactive' : 'active';
        
        Swal.fire('Success', `✅ Staff ${action}d successfully (Mock Mode)`, 'success');
        renderManageStaff();
      } catch (err) {
        console.error('Error toggling staff status:', err);
        Swal.fire('Error', 'Mock operation error', 'error');
      }
    }
  });
}

// Initialize the page
async function initializeManageUsers() {
  try {
    // Load data first
    await fetchData();
    currentTab = 'clients';
    renderManageUsers();
  } catch (error) {
    console.error('Error initializing manage users:', error);
    Swal.fire({
      title: 'Error',
      text: 'Failed to load data. Please refresh the page.',
      icon: 'error'
    });
  }
}

// Make functions globally available
window.switchUserTab = switchUserTab;
window.viewStaff = viewStaff;
window.toggleStaffStatus = toggleStaffStatus;
window.initializeManageUsers = initializeManageUsers;
window.DeleteUser = DeleteUser;
window.DeleteStaff = DeleteStaff;

async function DeleteUser(userId) {
  Swal.fire({
    title: 'Delete User?',
    text: 'This will move the user to the deleted users section. You can recover them later if needed.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete user',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // In mock mode, update the user in local data
        const user = users.find(u => u.id == userId);
        if (user) {
          user.is_deleted = 1;
          user.deleted_date = new Date().toISOString();
          
          // Save to localStorage for persistence across pages
          const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers') || '[]');
          const existingIndex = deletedUsers.findIndex(d => d.id === userId);
          if (existingIndex === -1) {
            deletedUsers.push({
              ...user,
              user_type: 'client',
              deleted_date: user.deleted_date
            });
            localStorage.setItem('deletedUsers', JSON.stringify(deletedUsers));
          }
          
          Swal.fire({
            title: 'User Deleted!',
            text: 'User has been moved to deleted users. You can recover them from the Deleted Users section.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            confirmButtonColor: '#10B981'
          });
          await renderManageUsers();
        }
        
        // In production, this would make an API call to soft delete:
        // const res = await fetch(`${window.BASE_URL}/api/users/${userId}/soft-delete`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' }
        // });
        
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire('Error', 'Failed to delete user.', 'error');
      }
    }
  });
}

async function DeleteStaff(staffId) {
  Swal.fire({
    title: 'Delete Staff Member?',
    text: 'This will move the staff member to the deleted users section. You can recover them later if needed.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete staff',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // In mock mode, update the staff in local data
        const staffMember = staff.find(s => s.id == staffId);
        if (staffMember) {
          staffMember.is_deleted = 1;
          staffMember.deleted_date = new Date().toISOString();
          
          // Save to localStorage for persistence across pages
          const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers') || '[]');
          const existingIndex = deletedUsers.findIndex(d => d.id === staffId && d.user_type === 'staff');
          if (existingIndex === -1) {
            deletedUsers.push({
              ...staffMember,
              user_type: 'staff',
              deleted_date: staffMember.deleted_date
            });
            localStorage.setItem('deletedUsers', JSON.stringify(deletedUsers));
          }
          
          Swal.fire({
            title: 'Staff Deleted!',
            text: 'Staff member has been moved to deleted users. You can recover them from the Deleted Users section.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            confirmButtonColor: '#10B981'
          });
          await renderManageStaff();
        }
        
        // In production, this would make an API call to soft delete:
        // const res = await fetch(`${window.BASE_URL}/api/staff/${staffId}/soft-delete`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' }
        // });
        
      } catch (err) {
        console.error('Delete staff error:', err);
        Swal.fire('Error', 'Failed to delete staff member.', 'error');
      }
    }
  });
}

async function editUser(userId) {
  const user = users.find(u => u.id == userId);
  if (!user) {
    Swal.fire('Error', 'User not found.', 'error');
    return;
  }

  Swal.fire({
    title: 'Edit User',
    html: `
      <div class="text-left space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input id="editName" value="${user.name}" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input id="editPhone" value="${user.phone}" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input id="editLocation" value="${user.location}" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Package</label>
          <select id="editPackage" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900">
            <option value="Bronze Plan - Up to 5 Mbps (Ksh 1,500/Month)" ${user.package === 'Bronze Plan - Up to 5 Mbps (Ksh 1,500/Month)' ? 'selected' : ''}>Bronze Plan - Up to 5 Mbps (Ksh 1,500/Month)</option>
            <option value="Silver Plan - Up to 10 Mbps (Ksh 2,000/Month)" ${user.package === 'Silver Plan - Up to 10 Mbps (Ksh 2,000/Month)' ? 'selected' : ''}>Silver Plan - Up to 10 Mbps (Ksh 2,000/Month)</option>
            <option value="Gold Plan - Up to 15 Mbps (Ksh 2,500/Month)" ${user.package === 'Gold Plan - Up to 15 Mbps (Ksh 2,500/Month)' ? 'selected' : ''}>Gold Plan - Up to 15 Mbps (Ksh 2,500/Month)</option>
            <option value="Platinum Plan - Up to 20 Mbps (Ksh 3,000/Month)" ${user.package === 'Platinum Plan - Up to 20 Mbps (Ksh 3,000/Month)' ? 'selected' : ''}>Platinum Plan - Up to 20 Mbps (Ksh 3,000/Month)</option>
            <option value="Super Plan - Up to 35 Mbps (Ksh 4,500/Month)" ${user.package === 'Super Plan - Up to 35 Mbps (Ksh 4,500/Month)' ? 'selected' : ''}>Super Plan - Up to 35 Mbps (Ksh 4,500/Month)</option>
            <option value="Dedicated Link - Up to 200 Mbps (Contact for Quote)" ${user.package === 'Dedicated Link - Up to 200 Mbps (Contact for Quote)' ? 'selected' : ''}>Dedicated Link - Up to 200 Mbps (Contact for Quote)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Subscription Amount</label>
          <input id="editSubscriptionAmount" type="number" value="${user.subscription_amount}" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Router Cost</label>
          <input id="editRouterCost" type="number" value="${user.router_cost || 0}" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" required />
        </div>
        <div class="flex items-center space-x-3">
          <input type="checkbox" id="editPaidSubscription" ${user.paid_subscription ? 'checked' : ''} class="w-4 h-4 text-indigo-600">
          <label class="text-sm text-gray-700">Paid Subscription</label>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save Changes',
    cancelButtonText: 'Cancel',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    preConfirm: () => {
      const name = document.getElementById('editName').value.trim();
      const phone = document.getElementById('editPhone').value.trim();
      const location = document.getElementById('editLocation').value.trim();
      const packageVal = document.getElementById('editPackage').value;
      const subAmount = document.getElementById('editSubscriptionAmount').value;
      const routerCost = document.getElementById('editRouterCost').value;

      if (!name || !phone || !location || !packageVal || !subAmount || !routerCost) {
        Swal.showValidationMessage('Please fill in all required fields.');
        return false;
      }

      return {
        name,
        phone,
        location,
        package: packageVal,
        subscription_amount: parseFloat(subAmount),
        router_cost: parseFloat(routerCost),
        paid_subscription: document.getElementById('editPaidSubscription').checked,
        payment_date: dayjs(user.payment_date).format('YYYY-MM-DD'),
        expiry_date: dayjs(user.payment_date).add(30, 'day').format('YYYY-MM-DD')
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${window.BASE_URL}/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.value)
        });

        if (res.ok) {
          Swal.fire({
            title: 'Success!',
            text: 'User details updated successfully!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          });
          await fetchData(true);
          await renderManageUsers();
        } else {
          Swal.fire('Error', 'Failed to update user.', 'error');
        }
      } catch (err) {
        console.error('Update error:', err);
        Swal.fire('Error', 'Server error occurred.', 'error');
      }
    }
  });
}

async function renewUserQuick(userId) {
  const user = users.find(u => u.id == userId);
  if (!user) {
    Swal.fire('Error', 'User not found.', 'error');
    return;
  }

  Swal.fire({
    title: `Renew Subscription for ${user.name}`,
    html: `
      <div class="text-left">
        <label class="block text-sm font-medium text-gray-700 mb-2">Renewal Amount (KSH)</label>
        <input id="renewAmount" type="number" value="${user.subscription_amount}" class="w-full p-3 border rounded-lg bg-white text-gray-900" placeholder="Enter amount">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Renew',
    cancelButtonText: 'Cancel',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    preConfirm: () => {
      const amount = document.getElementById('renewAmount').value;
      if (!amount || parseFloat(amount) <= 0) {
        Swal.showValidationMessage('Please enter a valid amount');
        return false;
      }
      return {
        userId: userId,
        amount: parseFloat(amount),
        renewalDate: dayjs().format('YYYY-MM-DD'),
        paidSubscription: true
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${window.BASE_URL}/api/renewals/renew`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.value)
        });

        if (res.ok) {
          Swal.fire({
            title: 'Success!',
            text: 'Subscription renewed successfully!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          });
          await fetchData(true);
          await renderManageUsers();
        } else {
          Swal.fire('Error', 'Failed to renew subscription.', 'error');
        }
      } catch (err) {
        console.error('Renew error:', err);
        Swal.fire('Error', 'Server error occurred.', 'error');
      }
    }
  });
}

async function upgradePackage(userId) {
  const user = users.find(u => u.id == userId);
  if (!user) {
    Swal.fire('Error', 'User not found.', 'error');
    return;
  }

  const packages = [
    { name: 'Bronze Plan - Up to 5 Mbps', amount: 1500 },
    { name: 'Silver Plan - Up to 10 Mbps', amount: 2000 },
    { name: 'Gold Plan - Up to 15 Mbps', amount: 2500 },
    { name: 'Platinum Plan - Up to 20 Mbps', amount: 3000 },
    { name: 'Super Plan - Up to 35 Mbps', amount: 4500 },
    { name: 'Dedicated Link - Up to 200 Mbps', amount: 8000 }
  ];

  const packageOptions = packages.map(pkg =>
    `<option value="${pkg.amount}" ${user.package.includes(pkg.name) ? 'selected' : ''}>${pkg.name} (KSH ${pkg.amount.toLocaleString()}/Month)</option>`
  ).join('');

  Swal.fire({
    title: `Upgrade Package for ${user.name}`,
    html: `
      <div class="text-left">
        <label class="block text-sm font-medium text-gray-700 mb-2">Select New Package</label>
        <select id="packageSelect" class="w-full p-3 border rounded-lg bg-white text-gray-900">
          <option value="" disabled>Choose a package</option>
          ${packageOptions}
        </select>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Upgrade',
    cancelButtonText: 'Cancel',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    preConfirm: () => {
      const select = document.getElementById('packageSelect');
      const amount = select.value;
      const packageName = select.options[select.selectedIndex].text.split(' (')[0];
      if (!amount) {
        Swal.showValidationMessage('Please select a package');
        return false;
      }
      return {
        subscription_amount: parseFloat(amount),
        package: packageName,
        payment_date: dayjs().format('YYYY-MM-DD'),
        expiry_date: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        paid_subscription: true
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${window.BASE_URL}/api/users/package/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.value)
        });

        if (res.ok) {
          Swal.fire({
            title: 'Success!',
            text: 'Package upgraded successfully!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          });
          await fetchData(true);
          await renderManageUsers();
        } else {
          Swal.fire('Error', 'Failed to upgrade package.', 'error');
        }
      } catch (err) {
        console.error('Upgrade error:', err);
        Swal.fire('Error', 'Server error occurred.', 'error');
      }
    }
  });
}

function exportToCSV() {
  let csvContent, filename, successMessage;

  if (currentTab === 'clients') {
    const activeUsers = users.filter(u => u.is_deleted !== 1);
    const headers = ['ID', 'Name', 'Phone', 'Location', 'Package', 'Subscription Amount', 'Router Cost', 'Payment Date', 'Expiry Date', 'Subscription Status'];
    csvContent = [
      headers.join(','),
      ...activeUsers.map(u => {
        const paymentDate = dayjs(u.payment_date);
        const expiryDate = paymentDate.add(30, 'day');
        return [
          u.id,
          `"${u.name}"`,
          u.phone,
          `"${u.location}"`,
          `"${u.package}"`,
          u.subscription_amount,
          u.router_cost || 0,
          paymentDate.format('YYYY-MM-DD'),
          expiryDate.format('YYYY-MM-DD'),
          u.paid_subscription ? 'Paid' : 'Unpaid'
        ].join(',');
      })
    ].join('\n');
    filename = `dr-net-clients-${dayjs().format('YYYY-MM-DD')}.csv`;
    successMessage = 'Clients exported to CSV successfully!';
  } else if (currentTab === 'staff') {
    const headers = ['ID', 'Name', 'Employee ID', 'Email', 'Phone', 'Position', 'Department', 'Salary', 'Hire Date', 'Status'];
    csvContent = [
      headers.join(','),
      ...staff.map(s => {
        const hireDate = dayjs(s.hire_date);
        return [
          s.id,
          `"${s.name}"`,
          s.employee_id,
          s.email || '',
          s.phone || '',
          `"${s.position}"`,
          `"${s.department}"`,
          s.salary || 0,
          hireDate.format('YYYY-MM-DD'),
          s.is_active ? 'Active' : 'Inactive'
        ].join(',');
      })
    ].join('\n');
    filename = `dr-net-staff-${dayjs().format('YYYY-MM-DD')}.csv`;
    successMessage = 'Staff exported to CSV successfully!';
  } else if (currentTab === 'attendance') {
    exportAttendanceToCSV();
    return; // Exit early since exportAttendanceToCSV handles its own success message
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  Swal.fire({
    title: 'Success!',
    text: successMessage,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  });
}

function toggleExpandCard(userId) {
  expandedCard = expandedCard === Number(userId) ? null : Number(userId);
  const details = document.getElementById(`expandable-details-${userId}`);
  const button = document.querySelector(`#user-card-${userId} button[onclick="toggleExpandCard('${userId}')"]`);
  if (details && button) {
    details.classList.toggle('hidden');
    button.textContent = expandedCard === userId ? 'Show Less' : 'Show More Details';
  }
}

function viewUser(userId) {
  const user = users.find(u => u.id == userId);
  if (!user) {
    Swal.fire('Error', 'User not found.', 'error');
    return;
  }

  viewingUser = user;
  const modal = document.getElementById('viewUserModal');
  const modalContent = document.getElementById('viewUserModalContent');
  const paymentDate = dayjs(user.payment_date);
  const expiryDate = paymentDate.add(30, 'day');
  const daysRemaining = expiryDate.diff(dayjs(), 'day');
  const isActive = daysRemaining >= 0;

  modalContent.innerHTML = `
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">User Profile</h2>
        <button onclick="closeViewModal()" class="p-2 hover:bg-white/20 rounded-full transition-colors duration-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold text-gray-800 mb-4">Personal Information</h3>
          <div class="space-y-3">
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
            <p><strong>Location:</strong> ${user.location}</p>
            <p><strong>Package:</strong> ${user.package}</p>
          </div>
        </div>
        <div>
          <h3 class="font-semibold text-gray-800 mb-4">Subscription Details</h3>
          <div class="space-y-3">
            <p><strong>Monthly Amount:</strong> KSH ${Number(user.subscription_amount).toLocaleString()}</p>
            <p><strong>Router Cost:</strong> KSH ${Number(user.router_cost || 0).toLocaleString()}</p>
            <p><strong>Payment Date:</strong> ${paymentDate.format('MMMM D, YYYY')}</p>
            <p><strong>Expiry Date:</strong> ${expiryDate.format('MMMM D, YYYY')}</p>
            <p><strong>Status:</strong> 
              <span class="ml-2 px-2 py-1 rounded-full text-sm ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                ${isActive ? 'Active' : 'Expired'}
              </span>
            </p>
            <p><strong>Subscription Status:</strong> 
              <span class="ml-2 px-2 py-1 rounded-full text-sm ${user.paid_subscription ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                ${user.paid_subscription ? 'Paid' : 'Unpaid'}
              </span>
            </p>
          </div>
        </div>
      </div>
      <div class="mt-6 pt-6 border-t">
        <h3 class="font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div class="flex flex-wrap gap-3">
          <button onclick="closeViewModal(); renewUserQuick('${user.id}')" class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span>Renew Subscription</span>
          </button>
          <button onclick="closeViewModal(); upgradePackage('${user.id}')" class="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 flex items-center space-x-2 shadow-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
            <span>Upgrade Package</span>
          </button>
          <button onclick="closeViewModal(); editUser('${user.id}')" class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span>Edit Details</span>
          </button>
        </div>
      </div>
    </div>
    <div class="bg-gray-50 px-6 py-4 border-t flex justify-end">
      <button onclick="closeViewModal()" class="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
        Close
      </button>
    </div>
  `;
  modal.classList.remove('hidden');
}

function closeViewModal() {
  viewingUser = null;
  const modal = document.getElementById('viewUserModal');
  modal.classList.add('hidden');
}

// ===================== STAFF ATTENDANCE FUNCTIONS =====================

// Load attendance data for the selected date
async function loadAttendanceData() {
  const attendanceDate = document.getElementById('attendanceDate');
  const tableBody = document.getElementById('attendanceTableBody');
  const noDataMessage = document.getElementById('noAttendanceData');
  
  // If elements don't exist, return early (section was removed)
  if (!attendanceDate || !tableBody) {
    return;
  }
  
  // Set today's date as default
  if (!attendanceDate.value) {
    attendanceDate.value = new Date().toISOString().split('T')[0];
  }
  
  try {
    // Get staff register and attendance history
    const staffRegister = JSON.parse(localStorage.getItem('staffRegister') || '[]');
    const attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory') || '[]');
    
    // Get attendance data sent from supervisor (stored in ctioAttendance)
    const ctioAttendance = JSON.parse(localStorage.getItem('ctioAttendance') || '[]');
    
    const selectedDate = attendanceDate.value;
    
    // Merge supervisor's attendance data with local attendance history
    // Priority: ctioAttendance (from supervisor) > attendanceHistory (local)
    const allAttendanceRecords = [...ctioAttendance, ...attendanceHistory];
    
    // Filter staff by status
    const filteredStaff = staffRegister.filter(s => s.status === 'active');
    
    if (filteredStaff.length === 0) {
      tableBody.innerHTML = '';
      noDataMessage.classList.remove('hidden');
      updateAttendanceCounts({});
      return;
    }
    
    // Generate table rows
    const tableRows = filteredStaff.map(member => {
      // Find today's attendance for this staff member (prioritize supervisor's data)
      const todayAttendance = allAttendanceRecords.find(record => 
        record.employeeId === member.staffId && 
        record.date === selectedDate
      );
      
      const attendance = todayAttendance || { status: 'Not Marked', timestamp: null, timeIn: null, timeOut: null };
      const statusClass = getAttendanceStatusClass(attendance.status);
      
      // Format time display
      const timeInDisplay = attendance.timeIn || 'N/A';
      const timeOutDisplay = attendance.timeOut || 'N/A';
      
      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="p-3 text-sm text-gray-700 border-b">${member.staffId}</td>
          <td class="p-3 text-sm text-gray-700 border-b font-medium">${member.staffName}</td>
          <td class="p-3 text-sm text-gray-700 border-b">${member.department}</td>
          <td class="p-3 text-sm text-gray-700 border-b">${member.role}</td>
          <td class="p-3 text-sm text-gray-700 border-b">${member.phone || 'N/A'}</td>
          <td class="p-3 text-sm text-gray-700 border-b">${member.email || 'N/A'}</td>
          <td class="p-3 text-sm text-gray-700 border-b">
            <span class="px-2 py-1 text-xs font-medium ${timeInDisplay !== 'N/A' ? 'text-green-600' : 'text-gray-400'}">
              ${timeInDisplay}
            </span>
          </td>
          <td class="p-3 text-sm text-gray-700 border-b">
            <span class="px-2 py-1 text-xs font-medium ${timeOutDisplay !== 'N/A' ? 'text-blue-600' : 'text-gray-400'}">
              ${timeOutDisplay}
            </span>
          </td>
          <td class="p-3 text-sm text-gray-700 border-b">
            <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </td>
          <td class="p-3 text-sm border-b">
            <span class="px-3 py-1 text-xs rounded-full font-medium ${statusClass}">
              ${attendance.status}
            </span>
          </td>
          <td class="p-3 text-sm text-gray-500 border-b">
            ${attendance.timestamp ? new Date(attendance.timestamp).toLocaleString() : 'Not marked'}
          </td>
          <td class="p-3 text-sm border-b">
            <button 
              onclick="deleteStaffFromRegister('${member.staffId}')" 
              class="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
              title="Delete staff member"
            >
              <i class="fas fa-trash text-sm"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    tableBody.innerHTML = tableRows;
    noDataMessage.classList.add('hidden');
    
    // Update attendance counts using merged data
    const counts = filteredStaff.reduce((acc, member) => {
      const todayAttendance = allAttendanceRecords.find(record => 
        record.employeeId === member.staffId && 
        record.date === selectedDate
      );
      const status = todayAttendance ? todayAttendance.status : 'Not Marked';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    updateAttendanceCounts(counts);
    
  } catch (error) {
    console.error('Error loading attendance data:', error);
    tableBody.innerHTML = '<tr><td colspan="10" class="p-8 text-center text-red-600">Failed to load attendance data</td></tr>';
    noDataMessage.classList.add('hidden');
  }
}

// Get CSS class for attendance status
function getAttendanceStatusClass(status) {
  switch (status) {
    case 'Present':
      return 'bg-green-100 text-green-800';
    case 'Absent':
      return 'bg-red-100 text-red-800';
    case 'Off Duty':
      return 'bg-yellow-100 text-yellow-800';
    case 'On Leave':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}


// Delete staff member from register
function deleteStaffFromRegister(staffId) {
  Swal.fire({
    title: 'Delete Staff Member?',
    text: `Are you sure you want to delete this staff member from the register?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280'
  }).then((result) => {
    if (result.isConfirmed) {
      // Get staff register
      let staffRegister = JSON.parse(localStorage.getItem('staffRegister') || '[]');
      
      // Find and remove staff member
      const staffIndex = staffRegister.findIndex(staff => staff.staffId === staffId);
      if (staffIndex !== -1) {
        const staffMember = staffRegister[staffIndex];
        
        // Remove from register
        staffRegister.splice(staffIndex, 1);
        localStorage.setItem('staffRegister', JSON.stringify(staffRegister));
        
        // Remove all attendance records for this staff member
        let attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory') || '[]');
        attendanceHistory = attendanceHistory.filter(record => record.employeeId !== staffId);
        localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory));
        
        // Notify supervisor
        const notification = {
          id: Date.now().toString(),
          type: 'staff_deleted',
          title: 'Staff Member Deleted',
          message: `${staffMember.staffName} (${staffMember.staffId}) removed from staff register`,
          timestamp: new Date().toISOString(),
          read: false,
          source: 'ctio_dashboard'
        };
        
        let notifications = JSON.parse(localStorage.getItem('supervisorNotifications') || '[]');
        notifications.unshift(notification);
        localStorage.setItem('supervisorNotifications', JSON.stringify(notifications));
        
        // Refresh display
        loadAttendanceData();
        
        Swal.fire('Deleted!', 'Staff member has been removed from the register.', 'success');
      } else {
        Swal.fire('Error!', 'Staff member not found', 'error');
      }
    }
  });
}

// Refresh attendance data
function refreshAttendanceData() {
  loadAttendanceData();
  Swal.fire({
    title: 'Refreshed!',
    text: 'Attendance data has been refreshed.',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  });
}

// Update attendance summary counts
function updateAttendanceCounts(dayAttendance) {
  const counts = {
    present: 0,
    absent: 0,
    offDuty: 0,
    onLeave: 0
  };
  
  Object.values(dayAttendance).forEach(attendance => {
    switch (attendance.status) {
      case 'Present':
        counts.present++;
        break;
      case 'Absent':
        counts.absent++;
        break;
      case 'Off Duty':
        counts.offDuty++;
        break;
      case 'On Leave':
        counts.onLeave++;
        break;
    }
  });
  
  document.getElementById('presentCount').textContent = counts.present;
  document.getElementById('absentCount').textContent = counts.absent;
  document.getElementById('offDutyCount').textContent = counts.offDuty;
  document.getElementById('onLeaveCount').textContent = counts.onLeave;
}

// Refresh attendance data
function refreshAttendanceData() {
  loadAttendanceData();
}

// Export attendance data to CSV
function exportAttendanceToCSV() {
  const attendanceDate = document.getElementById('attendanceDate').value;
  
  // Get merged attendance data (supervisor's data takes priority)
  const ctioAttendance = JSON.parse(localStorage.getItem('ctioAttendance') || '[]');
  const attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory') || '[]');
  const allAttendanceRecords = [...ctioAttendance, ...attendanceHistory];
  
  // Get staff register
  const staffRegister = JSON.parse(localStorage.getItem('staffRegister') || '[]');
  const filteredStaff = staffRegister.filter(s => s.status === 'active');
  
  const headers = ['Employee ID', 'Name', 'Department', 'Role', 'Phone', 'Email', 'Time In', 'Time Out', 'Status', 'Attendance', 'Last Updated'];
  const csvContent = [
    headers.join(','),
    ...filteredStaff.map(member => {
      const todayAttendance = allAttendanceRecords.find(record => 
        record.employeeId === member.staffId && 
        record.date === attendanceDate
      );
      const attendance = todayAttendance || { status: 'Not Marked', timestamp: null, timeIn: 'N/A', timeOut: 'N/A' };
      
      return [
        member.staffId,
        `"${member.staffName}"`,
        member.department,
        member.role,
        member.phone || 'N/A',
        `"${member.email || 'N/A'}"`,
        attendance.timeIn || 'N/A',
        attendance.timeOut || 'N/A',
        'Active',
        attendance.status,
        attendance.timestamp ? new Date(attendance.timestamp).toLocaleString() : 'Not marked'
      ].join(',');
    })
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `staff-attendance-${attendanceDate}.csv`;
  link.click();
  
  Swal.fire({
    title: 'Success',
    text: 'Attendance data exported to CSV successfully!',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false
  });
}