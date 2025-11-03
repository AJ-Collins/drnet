let users = [], bookings = [], renewals = [], staff = [];
let cache = {
  users: null,
  bookings: null,
  renewals: null,
  staff: null,
  lastFetched: 0
};
const CACHE_DURATION = 60000; // Cache duration in milliseconds (60 seconds)

// Mock data for testing
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    phone: "0712345678",
    location: "Nairobi CBD",
    package: "Silver Plan - Up to 10 Mbps (Ksh 2,000/Month)",
    subscription_amount: 2000,
    router_cost: 1500,
    payment_date: "2024-12-01",
    paid_subscription: true,
    is_deleted: 0
  },
  {
    id: 2,
    name: "Mary Smith",
    phone: "0723456789",
    location: "Westlands",
    package: "Gold Plan - Up to 15 Mbps (Ksh 2,500/Month)",
    subscription_amount: 2500,
    router_cost: 0,
    payment_date: "2024-12-05",
    paid_subscription: true,
    is_deleted: 0
  },
  {
    id: 3,
    name: "Peter Johnson",
    phone: "0734567890",
    location: "Karen",
    package: "Bronze Plan - Up to 5 Mbps (Ksh 1,500/Month)",
    subscription_amount: 1500,
    router_cost: 1500,
    payment_date: "2024-08-15",
    paid_subscription: false,
    is_deleted: 0
  }
];

const mockStaff = [
  {
    id: 1,
    name: "Julius Mwangi",
    employee_id: "EMP001",
    idNumber: "12345678",
    email: "julius@drnet.co.ke",
    phone: "0701234567",
    role: "Supervisor",
    department: "Technical",
    salary: 75000,
    status: "active",
    hire_date: "2023-01-15",
    contract_duration: "Permanent"
  },
  {
    id: 2,
    name: "Grace Wanjiku",
    employee_id: "EMP002",
    idNumber: "23456789",
    email: "grace@drnet.co.ke",
    phone: "0712345678",
    role: "Customer Service Rep",
    department: "Customer Service",
    salary: 45000,
    status: "active",
    hire_date: "2023-03-20",
    contract_duration: "Permanent"
  },
  {
    id: 3,
    name: "David Kamau",
    employee_id: "EMP003",
    idNumber: "34567890",
    email: "david@drnet.co.ke",
    phone: "0723456789",
    role: "Admin Assistant",
    department: "Administration",
    salary: 40000,
    status: "active",
    hire_date: "2023-06-10",
    contract_duration: "Contract"
  },
  {
    id: 4,
    name: "Sarah Mutua",
    employee_id: "EMP004",
    idNumber: "45678901",
    email: "sarah@drnet.co.ke",
    phone: "0734567890",
    role: "Network Engineer",
    department: "Technical",
    salary: 50000,
    status: "inactive",
    hire_date: "2023-08-05",
    contract_duration: "Contract"
  },
  {
    id: 5,
    name: "Michael Ochieng",
    employee_id: "EMP005",
    idNumber: "56789012",
    email: "michael@drnet.co.ke",
    phone: "0745678901",
    role: "Sales Executive",
    department: "Sales",
    salary: 55000,
    status: "active",
    hire_date: "2024-02-14",
    contract_duration: "Permanent"
  }
];

const mockBookings = [];
const mockRenewals = [];

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function fetchData(forceRefresh = false) {
  if (!forceRefresh && cache.lastFetched && Date.now() - cache.lastFetched < CACHE_DURATION) {
    // Load from cache but also check localStorage for any updates
    const localStorageUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const localStorageStaff = JSON.parse(localStorage.getItem('staff') || '[]');
    
    users = localStorageUsers.length > 0 ? localStorageUsers : (cache.users || []);
    staff = localStorageStaff.length > 0 ? localStorageStaff : (cache.staff || []);
    bookings = cache.bookings || [];
    renewals = cache.renewals || [];

    // Restore deleted status from localStorage
    const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers') || '[]');
    deletedUsers.forEach(deletedUser => {
      if (deletedUser.user_type === 'client') {
        const user = users.find(u => u.id === deletedUser.id);
        if (user) {
          user.is_deleted = 1;
          user.deleted_date = deletedUser.deleted_date;
        }
      } else if (deletedUser.user_type === 'staff') {
        const staffMember = staff.find(s => s.id === deletedUser.id);
        if (staffMember) {
          staffMember.is_deleted = 1;
          staffMember.deleted_date = deletedUser.deleted_date;
        }
      }
    });

    // Remove permanently deleted users from main data arrays
    const mainUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const mainStaff = JSON.parse(localStorage.getItem('staff') || '[]');
    
    // Filter out users that are not in the main localStorage (permanently deleted)
    users = users.filter(user => {
      const mainUser = mainUsers.find(mu => mu.id === user.id);
      return mainUser !== undefined;
    });
    
    // Filter out staff that are not in the main localStorage (permanently deleted)
    staff = staff.filter(staffMember => {
      const mainStaffMember = mainStaff.find(ms => ms.id === staffMember.id);
      return mainStaffMember !== undefined;
    });

    // Update global references
    window.users = users;
    window.staff = staff;
    window.bookings = bookings;
    window.renewals = renewals;

    return;
  }

  try {
    console.log('🔄 Using mock data for testing...');

    // Load users from localStorage (includes recovered users)
    const localStorageUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // Merge with mock users, prioritizing localStorage
    users = localStorageUsers.length > 0 ? localStorageUsers : [...mockUsers];
    console.log(`👥 Loaded ${users.length} users (${localStorageUsers.length} from localStorage, ${mockUsers.length} mock)`);

    // Load staff from localStorage (includes recovered staff)
    const localStorageStaff = JSON.parse(localStorage.getItem('staff') || '[]');
    // Merge with mock staff, prioritizing localStorage
    staff = localStorageStaff.length > 0 ? localStorageStaff : [...mockStaff];
    console.log(`👨‍💼 Loaded ${staff.length} staff (${localStorageStaff.length} from localStorage, ${mockStaff.length} mock)`);

    // Load bookings from localStorage (includes CTIO and Supervisor bookings)
    const localStorageBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    // Merge with mock bookings, prioritizing localStorage
    bookings = localStorageBookings.length > 0 ? localStorageBookings : [...mockBookings];
    console.log(`📋 Loaded ${bookings.length} bookings (${localStorageBookings.length} from localStorage, ${mockBookings.length} mock)`);
    renewals = users
      .filter(u => u.paid_subscription && u.payment_date)
      .map(u => ({
        id: u.id,
        user_id: u.id,
        user_name: u.name,
        amount: u.subscription_amount,
        renewal_date: u.payment_date,
        expiry_date: dayjs(u.payment_date).add(30, 'days').format('YYYY-MM-DD'),
        month: dayjs(u.payment_date).format('MMMM'),
        year: dayjs(u.payment_date).year(),
        is_deleted: false
      }));

    // Restore deleted status from localStorage
    const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers') || '[]');
    deletedUsers.forEach(deletedUser => {
      if (deletedUser.user_type === 'client') {
        const user = users.find(u => u.id === deletedUser.id);
        if (user) {
          user.is_deleted = 1;
          user.deleted_date = deletedUser.deleted_date;
        }
      } else if (deletedUser.user_type === 'staff') {
        const staffMember = staff.find(s => s.id === deletedUser.id);
        if (staffMember) {
          staffMember.is_deleted = 1;
          staffMember.deleted_date = deletedUser.deleted_date;
        }
      }
    });

    // Remove permanently deleted users from main data arrays
    // Check if there are any users in main data that should be permanently deleted
    const mainUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const mainStaff = JSON.parse(localStorage.getItem('staff') || '[]');
    
    // Filter out users that are not in the main localStorage (permanently deleted)
    users = users.filter(user => {
      const mainUser = mainUsers.find(mu => mu.id === user.id);
      return mainUser !== undefined;
    });
    
    // Filter out staff that are not in the main localStorage (permanently deleted)
    staff = staff.filter(staffMember => {
      const mainStaffMember = mainStaff.find(ms => ms.id === staffMember.id);
      return mainStaffMember !== undefined;
    });

    cache = { users, bookings, renewals, staff, lastFetched: Date.now() };

    // Update global references
    window.users = users;
    window.staff = staff;
    window.bookings = bookings;
    window.renewals = renewals;

    console.log('✅ Mock data loaded successfully:', { users: users.length, staff: staff.length });
  } catch (error) {
    console.error('Error loading mock data:', error);
    Swal.fire('Error', 'Failed to load data', 'error');
    users = [];
    bookings = [];
    renewals = [];
    staff = [];
    cache = { users: null, bookings: null, renewals: null, staff: null, lastFetched: 0 };
  }
}

async function logout() {
  try {
    const res = await fetch(`${window.BASE_URL}/api/admin/logout`, { method: 'GET' });
    if (res.ok) {
      Swal.fire({
        icon: 'info',
        title: 'Logged Out',
        text: 'You have successfully logged out.',
        timer: 1000,
        showConfirmButton: false
      });
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
    } else {
      Swal.fire('Error', 'Failed to logout. Please try again.', 'error');
    }
  } catch (err) {
    console.error('Logout error:', err);
    Swal.fire('Error', 'Something went wrong.', 'error');
  }
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

// Dashboard initialization function
async function initDashboard() {
  console.log('🚀 Dashboard initializing...');

  try {
    // Load data first
    await fetchData();

    // Update dashboard cards with mock data
    updateDashboardStats();

    // Update current month name
    const monthName = dayjs().format('MMMM');
    const monthElement = document.getElementById('currentMonthName');
    if (monthElement) {
      monthElement.textContent = monthName;
    }

  } catch (error) {
    console.error('❌ Error initializing dashboard:', error);
  }
}

function updateDashboardStats() {
  // Calculate stats from mock data
  const totalUsers = users.length;
  const activeUsers = users.filter(u => {
    const paymentDate = dayjs(u.payment_date);
    const expiryDate = paymentDate.add(30, 'day');
    return expiryDate.isAfter(dayjs()) && u.is_deleted !== 1;
  }).length;

  const expiredUsers = totalUsers - activeUsers;

  // Calculate monthly income from active subscriptions
  const monthlyIncome = users.reduce((total, user) => {
    if (user.is_deleted !== 1 && user.paid_subscription) {
      return total + (Number(user.subscription_amount) || 0);
    }
    return total;
  }, 0);

  // Calculate accessory revenue (routers + other accessories)
  const accessoryRevenue = users.reduce((total, user) => {
    if (user.is_deleted !== 1) {
      return total + (Number(user.router_cost) || 0);
    }
    return total;
  }, 0);

  // Staff count
  const totalStaffCount = staff ? staff.length : 0;
  const activeStaffCount = staff ? staff.filter(s => s.status === 'active').length : 0;

  // Update UI elements
  updateElement('totalUsers', totalUsers);
  updateElement('activeUsers', activeUsers);
  updateElement('expiredUsers', expiredUsers);
  updateElement('monthlyIncome', `Ksh ${monthlyIncome.toLocaleString()}`);
  updateElement('accessoryRevenue', `Ksh ${accessoryRevenue.toLocaleString()}`);
  updateElement('totalStaff', totalStaffCount);
  updateElement('totalBookings', 0); // Mock bookings data

  // Update monthly income details
  const monthlyIncomeDetails = document.getElementById('monthlyIncomeDetails');
  if (monthlyIncomeDetails) {
    monthlyIncomeDetails.textContent = `From ${activeUsers} active subscriptions`;
  }
}

function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

// Handle detailed view clicks with enhanced modal
function showDetailedView(type) {
  let title = '';
  let content = '';
  let icon = '';
  let subtitle = '';
  let headerGradient = '';

  switch (type) {
    case 'users':
      title = 'Total Users';
      subtitle = 'Complete user overview and statistics';
      icon = '<i class="fas fa-users text-white"></i>';
      headerGradient = 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600';
      content = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-900">${users.length}</div>
                <div class="text-sm text-blue-600">Total Registered</div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-900">${users.filter(u => u.is_deleted !== 1).length}</div>
                <div class="text-sm text-green-600">Active Users</div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-red-900">${users.filter(u => u.is_deleted === 1).length}</div>
                <div class="text-sm text-red-600">Deleted Users</div>
              </div>
            </div>
          </div>
        </div>
      `;
      break;
    case 'active':
      const activeUsers = users.filter(u => {
        const paymentDate = dayjs(u.payment_date);
        const expiryDate = paymentDate.add(30, 'day');
        return expiryDate.isAfter(dayjs()) && u.is_deleted !== 1;
      });
      title = 'Active Users';
      subtitle = 'Users with current active subscriptions';
      icon = '<i class="fas fa-check-circle text-white"></i>';
      headerGradient = 'bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600';
      content = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-lg border border-green-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-900">${activeUsers.length}</div>
                <div class="text-sm text-green-600">Total Active</div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg border">
            <div class="p-4 border-b bg-gray-50">
              <h4 class="font-semibold text-gray-800">Recent Active Users</h4>
            </div>
            <div class="max-h-64 overflow-y-auto">
              ${activeUsers.slice(0, 10).map(user => `
                <div class="p-3 border-b hover:bg-gray-50">
                  <div class="flex justify-between items-center">
                    <div>
                      <div class="font-medium">${user.username}</div>
                      <div class="text-sm text-gray-500">${user.email}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-medium text-green-600">Active</div>
                      <div class="text-xs text-gray-500">Expires: ${dayjs(user.payment_date).add(30, 'day').format('MMM DD')}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      break;
    case 'expired':
      const expiredUsers = users.filter(u => {
        const paymentDate = dayjs(u.payment_date);
        const expiryDate = paymentDate.add(30, 'day');
        return expiryDate.isBefore(dayjs()) && u.is_deleted !== 1;
      });
      title = 'Expired Users';
      subtitle = 'Users whose subscriptions need renewal';
      icon = '<i class="fas fa-exclamation-triangle text-white"></i>';
      headerGradient = 'bg-gradient-to-br from-red-600 via-rose-600 to-pink-600';
      content = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-red-50 to-rose-100 p-4 rounded-lg border border-red-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-red-900">${expiredUsers.length}</div>
                <div class="text-sm text-red-600">Need Renewal</div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg border">
            <div class="p-4 border-b bg-gray-50">
              <h4 class="font-semibold text-gray-800">Users Requiring Renewal</h4>
            </div>
            <div class="max-h-64 overflow-y-auto">
              ${expiredUsers.slice(0, 10).map(user => `
                <div class="p-3 border-b hover:bg-gray-50">
                  <div class="flex justify-between items-center">
                    <div>
                      <div class="font-medium">${user.username}</div>
                      <div class="text-sm text-gray-500">${user.email}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-medium text-red-600">Expired</div>
                      <div class="text-xs text-gray-500">Since: ${dayjs(user.payment_date).add(30, 'day').format('MMM DD')}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      break;
    case 'income':
      const income = users.reduce((total, user) => {
        if (user.is_deleted !== 1 && user.paid_subscription) {
          return total + (Number(user.subscription_amount) || 0);
        }
        return total;
      }, 0);
      title = 'Monthly Income';
      subtitle = 'Revenue from active subscriptions';
      icon = '<i class="fas fa-chart-line text-white"></i>';
      headerGradient = 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600';
      content = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg border border-blue-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-900">Ksh ${income.toLocaleString()}</div>
                <div class="text-sm text-blue-600">Total Revenue</div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg border p-6">
            <h4 class="font-semibold text-gray-800 mb-4">Revenue Breakdown</h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-gray-600">💰 Active Subscriptions</span>
                <span class="font-semibold">Ksh ${income.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-gray-600">📊 Paying Users</span>
                <span class="font-semibold">${users.filter(u => u.paid_subscription && u.is_deleted !== 1).length}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-600">💵 Average per User</span>
                <span class="font-semibold">Ksh ${users.filter(u => u.paid_subscription && u.is_deleted !== 1).length > 0 ? Math.round(income / users.filter(u => u.paid_subscription && u.is_deleted !== 1).length).toLocaleString() : 0}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      break;
    case 'accessories':
      const accessory = users.reduce((total, user) => {
        if (user.is_deleted !== 1) {
          return total + (Number(user.router_cost) || 0);
        }
        return total;
      }, 0);
      title = 'Accessory Revenue';
      subtitle = 'Revenue from hardware and accessories';
      icon = '<i class="fas fa-microchip text-white"></i>';
      headerGradient = 'bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600';
      content = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-yellow-50 to-orange-100 p-4 rounded-lg border border-yellow-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-900">Ksh ${accessory.toLocaleString()}</div>
                <div class="text-sm text-yellow-600">Total Revenue</div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg border p-6">
            <h4 class="font-semibold text-gray-800 mb-4">Hardware Sales</h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-gray-600">🔧 Router Sales</span>
                <span class="font-semibold">Ksh ${accessory.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-gray-600">📦 Users with Equipment</span>
                <span class="font-semibold">${users.filter(u => Number(u.router_cost) > 0 && u.is_deleted !== 1).length}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      break;
    case 'bookings':
      title = 'Website Bookings';
      subtitle = 'Inquiries from website visitors';
      icon = '<i class="fas fa-calendar-check text-white"></i>';
      headerGradient = 'bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600';
      content = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-purple-50 to-violet-100 p-4 rounded-lg border border-purple-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-900">0</div>
                <div class="text-sm text-purple-600">Total Bookings</div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg border p-6">
            <h4 class="font-semibold text-gray-800 mb-4">📅 Booking Information</h4>
            <div class="text-center py-8">
              <div class="text-6xl mb-4">📅</div>
              <p class="text-gray-500">No booking data available at the moment.</p>
              <p class="text-sm text-gray-400 mt-2">Website inquiries will appear here when available.</p>
            </div>
          </div>
        </div>
      `;
      break;
    case 'staff':
      const staffCount = staff ? staff.length : 0;
      const activeStaff = staff ? staff.filter(s => s.status === 'active').length : 0;
      title = 'My Staff';
      subtitle = 'Team members and their status';
      icon = '<i class="fas fa-user-tie text-white"></i>';
      headerGradient = 'bg-gradient-to-br from-gray-600 via-slate-700 to-zinc-800';
      content = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-gray-50 to-slate-100 p-4 rounded-lg border border-gray-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">${staffCount}</div>
                <div class="text-sm text-gray-600">Total Staff</div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-lg border border-green-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-900">${activeStaff}</div>
                <div class="text-sm text-green-600">Active</div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-red-50 to-rose-100 p-4 rounded-lg border border-red-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-red-900">${staffCount - activeStaff}</div>
                <div class="text-sm text-red-600">Inactive</div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg border">
            <div class="p-4 border-b bg-gray-50">
              <h4 class="font-semibold text-gray-800">Team Members</h4>
            </div>
            <div class="max-h-64 overflow-y-auto">
              ${staff && staff.length > 0 ? staff.map(member => `
                <div class="p-3 border-b hover:bg-gray-50">
                  <div class="flex justify-between items-center">
                    <div>
                      <div class="font-medium">${member.username}</div>
                      <div class="text-sm text-gray-500">${member.email}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-medium ${member.status === 'active' ? 'text-green-600' : 'text-red-600'}">${member.status}</div>
                      <div class="text-xs text-gray-500">${member.role}</div>
                    </div>
                  </div>
                </div>
              `).join('') : '<div class="p-8 text-center text-gray-500">No staff members found</div>'}
            </div>
          </div>
        </div>
      `;
      break;
    default:
      title = 'Information';
      subtitle = 'Detailed view';
      icon = '<i class="fas fa-info-circle text-white"></i>';
      headerGradient = 'bg-gradient-to-br from-gray-600 via-slate-600 to-zinc-600';
      content = '<div class="text-center py-8"><p class="text-gray-500">Detailed view not implemented yet</p></div>';
  }

  // Show enhanced modal
  const modal = document.getElementById('detailedViewContainer');
  const modalHeader = document.getElementById('modalHeader');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('detailedViewTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalContent = document.getElementById('detailedViewContent');
  const modalLastUpdated = document.getElementById('modalLastUpdated');

  if (modal && modalHeader && modalIcon && modalTitle && modalContent) {
    // Set dynamic header gradient
    modalHeader.className = `${headerGradient} text-white p-8 relative overflow-hidden`;
    
    // Set content
    modalIcon.innerHTML = icon;
    modalTitle.textContent = title;
    modalSubtitle.textContent = subtitle;
    modalContent.innerHTML = content;
    modalLastUpdated.innerHTML = `<span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>Last updated: <span class="font-medium ml-1">${new Date().toLocaleTimeString()}</span>`;

    // Show modal
    modal.classList.remove('hidden');
  }
}

// Hide detailed view modal
function hideDetailedView() {
  const modal = document.getElementById('detailedViewContainer');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Mock function to handle renewal reversals for testing
function mockReverseRenewal(renewalId, userId) {
  try {
    // Find and update the user in mock data
    const userIndex = users.findIndex(u => u.id == userId);
    if (userIndex !== -1) {
      // Set payment_date to a past date to make them expired
      const expiredDate = dayjs().subtract(31, 'days').format('YYYY-MM-DD');
      users[userIndex].paid_subscription = false;
      users[userIndex].payment_date = expiredDate;
      // Remove the renewal from mock renewals
      renewals = renewals.filter(r => r.id !== renewalId);

      // Update cache
      cache.users = users;
      cache.renewals = renewals;

      console.log(`✅ Mock renewal reversed for user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error reversing mock renewal:', error);
    return false;
  }
}

// ===================== TEAM CHAT FUNCTIONALITY =====================

// Chat message structure and utilities
let teamMessages = [];

// Load chat messages from localStorage
function loadChatMessages() {
  const stored = localStorage.getItem('teamChatMessages');
  if (stored) {
    try {
      teamMessages = JSON.parse(stored);
    } catch (e) {
      console.error('Error loading chat messages:', e);
      teamMessages = [];
    }
  }
  return teamMessages;
}

// Save chat messages to localStorage
function saveChatMessages() {
  try {
    localStorage.setItem('teamChatMessages', JSON.stringify(teamMessages));
  } catch (e) {
    console.error('Error saving chat messages:', e);
  }
}

// Send a new chat message
function sendChatMessage(senderName, senderRole, messageText) {
  if (!messageText || !messageText.trim()) {
    return null;
  }

  const message = {
    id: 'MSG' + Date.now() + Math.random().toString(36).substr(2, 9),
    sender: senderName,
    role: senderRole, // 'ctio', 'supervisor', 'staff', 'client'
    text: messageText.trim(),
    timestamp: new Date().toISOString(),
    deleted: false
  };

  teamMessages.push(message);
  saveChatMessages();

  return message;
}

// Delete a message (CTIO only)
function deleteChatMessage(messageId, userRole) {
  if (userRole !== 'ctio' && userRole !== 'admin') {
    console.error('Only CTIO can delete messages');
    return false;
  }

  const messageIndex = teamMessages.findIndex(msg => msg.id === messageId);
  if (messageIndex !== -1) {
    teamMessages[messageIndex].deleted = true;
    saveChatMessages();
    return true;
  }

  return false;
}

// Get all active (non-deleted) chat messages
function getActiveChatMessages() {
  loadChatMessages();
  return teamMessages.filter(msg => !msg.deleted);
}

// Get current user info from session
function getCurrentUser() {
  // Try to get CTIO user
  const ctioUser = localStorage.getItem('currentUser');
  if (ctioUser) {
    try {
      const user = JSON.parse(ctioUser);
      return { name: user.name || 'CTIO Admin', role: 'ctio' };
    } catch (e) { }
  }

  // Try to get supervisor/staff user
  const staffUser = localStorage.getItem('supervisorSession') || localStorage.getItem('staffSession');
  if (staffUser) {
    try {
      const user = JSON.parse(staffUser);
      return { name: user.name || 'Staff Member', role: user.role || 'staff' };
    } catch (e) { }
  }

  // Default
  return { name: 'User', role: 'staff' };
}

// Export functions to global scope
window.fetchData = fetchData;
window.mockReverseRenewal = mockReverseRenewal;
window.loadChatMessages = loadChatMessages;
window.saveChatMessages = saveChatMessages;
window.sendChatMessage = sendChatMessage;
window.deleteChatMessage = deleteChatMessage;
window.getActiveChatMessages = getActiveChatMessages;
window.getCurrentUser = getCurrentUser;

// Export data arrays to global scope (for access in other scripts)
window.users = users;
window.staff = staff;
window.bookings = bookings;
window.renewals = renewals;
window.teamMessages = teamMessages;