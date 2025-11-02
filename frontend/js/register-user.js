document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const closeSidebar = document.getElementById('closeSidebar');
  
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
  });
  
  async function submitUserForm(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    data.subscriptionAmount = parseFloat(data.subscriptionAmount);
    data.routerCost = parseFloat(data.routerCost);
    data.paidSubscription = data.paidSubscription === 'on';
    data.paymentDate = dayjs(data.paymentDate).format('YYYY-MM-DD');
    data.expiryDate = dayjs(data.paymentDate).add(30, 'days').format('YYYY-MM-DD');
  
    // Mock successful registration
    console.log('📝 Mock user registration:', data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    Swal.fire('Success', '✅ User registered successfully (Mock Mode)', 'success');
    form.reset();
  }

  // Tab switching functionality
  function switchTab(tab) {
    const userSection = document.getElementById('register-user');
    const staffSection = document.getElementById('register-staff');
    const userTab = document.getElementById('userTab');
    const staffTab = document.getElementById('staffTab');

    if (tab === 'user') {
      userSection.classList.remove('hidden');
      staffSection.classList.add('hidden');
      userTab.classList.add('bg-white', 'text-indigo-600', 'shadow-sm', 'active');
      userTab.classList.remove('text-gray-600', 'hover:text-indigo-600');
      staffTab.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm', 'active');
      staffTab.classList.add('text-gray-600', 'hover:text-indigo-600');
    } else {
      userSection.classList.add('hidden');
      staffSection.classList.remove('hidden');
      staffTab.classList.add('bg-white', 'text-indigo-600', 'shadow-sm', 'active');
      staffTab.classList.remove('text-gray-600', 'hover:text-indigo-600');
      userTab.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm', 'active');
      userTab.classList.add('text-gray-600', 'hover:text-indigo-600');
    }
  }

  // Staff form submission
  async function submitStaffForm(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    
    // Client-side validation
    if (!data.name.trim()) {
      Swal.fire('Validation Error', 'Name is required', 'error');
      return;
    }
    
    if (!data.email.trim() || !data.email.includes('@')) {
      Swal.fire('Validation Error', 'Valid email is required', 'error');
      return;
    }
    
    if (!data.phone.trim()) {
      Swal.fire('Validation Error', 'Phone number is required', 'error');
      return;
    }
    
    if (!data.employee_id.trim()) {
      Swal.fire('Validation Error', 'Employee ID is required', 'error');
      return;
    }
    
    if (!data.salary || parseFloat(data.salary) <= 0) {
      Swal.fire('Validation Error', 'Valid salary amount is required', 'error');
      return;
    }
    
    if (!data.contractDuration || parseInt(data.contractDuration) <= 0 || parseInt(data.contractDuration) > 60) {
      Swal.fire('Validation Error', 'Contract duration must be between 1 and 60 months', 'error');
      return;
    }
    
    // Convert form data to appropriate types
    data.salary = parseFloat(data.salary);
    data.contractDuration = parseInt(data.contractDuration);
    data.isActive = data.isActive === 'on';
    data.hire_date = dayjs(data.hire_date).format('YYYY-MM-DD');

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="mr-2">⏳</span> Registering Staff...';
    submitButton.disabled = true;

    // Mock successful staff registration
    console.log('👨‍💼 Mock staff registration:', data);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Swal.fire({
        title: 'Success!',
        text: '✅ Staff member registered successfully (Mock Mode)',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
      form.reset();
    } catch (err) {
      console.error('Submit error:', err);
      Swal.fire('Error', 'Mock registration error', 'error');
    } finally {
      // Restore button state
      submitButton.innerHTML = originalText;
      submitButton.disabled = false;
    }
  }

  // Make functions globally available
  window.switchTab = switchTab;
  window.submitStaffForm = submitStaffForm;