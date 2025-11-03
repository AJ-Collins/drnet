document.addEventListener('DOMContentLoaded', async () => {
  const sidebar = document.getElementById('sidebar');
  const toggleSidebar = document.getElementById('toggleSidebar');
  const closeSidebar = document.getElementById('closeSidebar');
  const renewalSearchInput = document.getElementById('renewalSearchInput');
  const renewalSubscriptionFilter = document.getElementById('renewalSubscriptionFilter');
  const renewalStatusFilter = document.getElementById('renewalStatusFilter');

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

  // Event listeners for search and filters
  renewalSearchInput.addEventListener('input', renderRenewals);
  renewalSubscriptionFilter.addEventListener('change', renderRenewals);
  renewalStatusFilter.addEventListener('change', renderRenewals);

  // Initialize data and render renewals
  await fetchData();
  await renderRenewals();
});

async function fetchRenewals() {
  try {
    // Check if in mock mode or if server is unavailable
    if (window.MOCK_MODE) {
      // Return mock renewals data
      return renewals || [];
    }
    
    const res = await fetch(`${window.BASE_URL}/api/renewals`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      console.log('Server unavailable, falling back to mock data');
      return renewals || [];
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetching renewals, using mock data:', err);
    return renewals || [];
  }
}

async function renderRenewals() {
  const renewalUserSelect = document.getElementById('renewalUser');
  const recentRenewalsList = document.getElementById('recentRenewalsList');
  const allRenewalsList = document.getElementById('allRenewalsList');
  const renewalsSummaryTitle = document.getElementById('renewalsSummaryTitle');
  const renewalsCount = document.getElementById('renewalsCount');
  const renewalsRevenue = document.getElementById('renewalsRevenue');
  const renewalsAverage = document.getElementById('renewalsAverage');
  const renewalSearchInput = document.getElementById('renewalSearchInput').value.toLowerCase();
  const renewalSubscriptionFilter = document.getElementById('renewalSubscriptionFilter');
  const renewalStatusFilter = document.getElementById('renewalStatusFilter');

  recentRenewalsList.innerHTML = '<p class="text-center text-gray-500 py-4">⏳ Loading...</p>';
  allRenewalsList.innerHTML = '<p class="text-center text-gray-500 py-4">⏳ Loading...</p>';

  try {
    // Fetch users and renewals
    await fetchData(); // Assumes this populates the global `users` array
    const renewals = await fetchRenewals();
    const activeUsers = users.filter(u => u.is_deleted !== 1);
    const currentMonth = dayjs().format('YYYY-MM');

    // Monthly Renewals (from renewals table)
    const monthlyRenewals = renewals.filter(r => 
      !r.is_deleted && 
      r.month === dayjs().format('MMMM') && 
      r.year === dayjs().year()
    );

    const renewalsRevenueValue = monthlyRenewals.reduce((sum, r) => sum + Number(r.amount), 0);
    const renewalsAverageValue = monthlyRenewals.length > 0 ? Math.round(renewalsRevenueValue / monthlyRenewals.length) : 0;

    // Populate Quick Renewal Select
    renewalUserSelect.innerHTML = `
      <option value="">Choose a user...</option>
      ${activeUsers.map(user => `
        <option value="${user.id}">${user.name} - ${user.location}</option>
      `).join('')}
    `;

    // Filter renewals for All Renewals section
    let filteredRenewals = renewals.filter(r => !r.is_deleted);

    // Apply search filter
    if (renewalSearchInput) {
      filteredRenewals = filteredRenewals.filter(r => {
        const user = users.find(u => u.id === r.user_id);
        return (
          r.user_name.toLowerCase().includes(renewalSearchInput) ||
          (user && user.phone.toLowerCase().includes(renewalSearchInput)) ||
          (user && user.location.toLowerCase().includes(renewalSearchInput))
        );
      });
    }

    // Apply subscription filter (based on users table)
    if (renewalSubscriptionFilter.value !== 'all') {
      filteredRenewals = filteredRenewals.filter(r => {
        const user = users.find(u => u.id === r.user_id);
        return user ? (renewalSubscriptionFilter.value === 'paid' ? user.paid_subscription : !user.paid_subscription) : false;
      });
    }

    // Apply status filter
    if (renewalStatusFilter.value !== 'all') {
      filteredRenewals = filteredRenewals.filter(r => {
        const expiryDate = dayjs(r.expiry_date);
        const daysRemaining = expiryDate.diff(dayjs(), 'day');
        const isActive = daysRemaining >= 0;
        return renewalStatusFilter.value === 'active' ? isActive : !isActive;
      });
    }

    // Update filter counts
    const paidCount = filteredRenewals.filter(r => {
      const user = users.find(u => u.id === r.user_id);
      return user && user.paid_subscription;
    }).length;
    const unpaidCount = filteredRenewals.filter(r => {
      const user = users.find(u => u.id === r.user_id);
      return user && !user.paid_subscription;
    }).length;
    const activeCount = filteredRenewals.filter(r => {
      const expiryDate = dayjs(r.expiry_date);
      const daysRemaining = expiryDate.diff(dayjs(), 'day');
      return daysRemaining >= 0;
    }).length;
    const expiredCount = filteredRenewals.length - activeCount;

    renewalSubscriptionFilter.innerHTML = `
      <option value="all">All Subscriptions (${filteredRenewals.length})</option>
      <option value="paid">Paid (${paidCount})</option>
      <option value="unpaid">Unpaid (${unpaidCount})</option>
    `;
    renewalStatusFilter.innerHTML = `
      <option value="all">All Statuses (${filteredRenewals.length})</option>
      <option value="active">Active (${activeCount})</option>
      <option value="expired">Expired (${expiredCount})</option>
    `;

    // Restore selected values
    renewalSubscriptionFilter.value = renewalSubscriptionFilter.dataset.selected || 'all';
    renewalStatusFilter.value = renewalStatusFilter.dataset.selected || 'all';
    renewalSubscriptionFilter.dataset.selected = renewalSubscriptionFilter.value;
    renewalStatusFilter.dataset.selected = renewalStatusFilter.value;

    // Render All Renewals
    allRenewalsList.innerHTML = filteredRenewals.length > 0 ? filteredRenewals.map(r => {
      const user = users.find(u => u.id === r.user_id) || {};
      const expiryDate = dayjs(r.expiry_date);
      const daysRemaining = expiryDate.diff(dayjs(), 'day');
      const isActive = daysRemaining >= 0;
      const statusColor = isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700';

      return `
        <div class="relative overflow-hidden bg-gradient-to-r from-white via-gray-50 to-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50">
          <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-100/30 to-transparent rounded-full blur-xl"></div>
          <div class="relative z-10">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h5 class="font-semibold text-lg text-gray-800">${r.user_name}</h5>
                  <span class="px-3 py-1 text-xs rounded-full font-medium ${statusColor}">
                    ${isActive ? 'Active' : 'Expired'}
                  </span>
                </div>
                <p class="text-gray-600 font-medium">${user.phone || 'N/A'} • ${user.location || 'N/A'}</p>
                <p class="text-sm text-gray-500">Renewal Date: ${dayjs(r.renewal_date).format('MMM D, YYYY')}</p>
                <p class="text-sm text-gray-500">Expires: ${expiryDate.format('MMM D, YYYY')}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-lg text-gray-800">KSH ${Number(r.amount).toLocaleString()}</p>
                <p class="text-sm text-gray-600">Status: ${user.paid_subscription ? 'Paid' : 'Unpaid'}</p>
                <div class="flex flex-wrap gap-2 mt-3">
                  <button onclick="editRenewal(${r.id})" class="p-2 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 rounded-lg hover:from-indigo-200 hover:to-indigo-300 transition-all duration-200 text-sm shadow-sm" title="Edit Renewal">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button onclick="reverseRenewal(${r.id})" class="p-2 bg-gradient-to-r from-red-100 to-pink-200 text-red-700 rounded-lg hover:from-red-200 hover:to-pink-300 transition-all duration-200 text-sm shadow-sm" title="Reverse Renewal">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('') : '<p class="text-gray-500 text-center py-4">No renewals found.</p>';

    // Render Recent Renewals (limited to current month, up to 5)
    recentRenewalsList.innerHTML = monthlyRenewals.length > 0 ? monthlyRenewals.slice(0, 5).map(r => {
      const user = users.find(u => u.id === r.user_id) || {};
      const expiryDate = dayjs(r.expiry_date);
      const daysRemaining = expiryDate.diff(dayjs(), 'day');
      const isActive = daysRemaining >= 0;
      const statusColor = isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700';

      return `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <span class="font-medium">${r.user_name}</span>
            <span class="ml-2 px-2 py-1 text-xs rounded-full font-medium ${statusColor}">
              ${isActive ? 'Active' : 'Expired'}
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-green-600 font-semibold">KSH ${Number(r.amount).toLocaleString()}</span>
            <button onclick="editRenewal(${r.id})" class="p-2 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 rounded-lg hover:from-indigo-200 hover:to-indigo-300" title="Edit Renewal">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button onclick="reverseRenewal(${r.id})" class="p-2 bg-gradient-to-r from-red-100 to-pink-200 text-red-700 rounded-lg hover:from-red-200 hover:to-pink-300" title="Reverse Renewal">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('') : '<p class="text-gray-500 text-center py-4">No renewals this month yet.</p>';

    // Update Summary
    renewalsSummaryTitle.textContent = `💰 ${dayjs().format('MMMM')} Renewals Summary`;
    renewalsCount.textContent = monthlyRenewals.length.toString();
    renewalsRevenue.textContent = `Ksh ${renewalsRevenueValue.toLocaleString()}`;
    renewalsAverage.textContent = renewalsAverageValue.toString();

  } catch (err) {
    console.error('Error loading renewals:', err);
    recentRenewalsList.innerHTML = '<p class="text-red-600 text-center py-4">Failed to load renewals. Please try again later.</p>';
    allRenewalsList.innerHTML = '<p class="text-red-600 text-center py-4">Failed to load renewals. Please try again later.</p>';
  }
}

async function processQuickRenewal() {
  const userId = document.getElementById('renewalUser').value;
  const amount = document.getElementById('renewalAmount').value;

  if (!userId || !amount || amount <= 0) {
    Swal.fire({
      title: 'Error',
      text: 'Please select a user and enter a valid renewal amount',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const user = users.find(u => u.id == userId);
  if (!user) {
    Swal.fire({
      title: 'Error',
      text: 'User not found',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  try {
    const res = await fetch(`${window.BASE_URL}/api/renewals/renew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount: parseFloat(amount),
        renewalDate: dayjs().format('YYYY-MM-DD'),
        paidSubscription: true
      })
    });

    if (res.ok) {
      Swal.fire({
        title: 'Success',
        text: `${user.name} renewed successfully!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
      document.getElementById('renewalUser').value = '';
      document.getElementById('renewalAmount').value = '';
      await fetchData(true);
      await renderRenewals();
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Failed to renew subscription.',
        icon: 'error',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    }
  } catch (err) {
    console.error('Renewal error:', err);
    Swal.fire({
      title: 'Error',
      text: 'Server error occurred.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
  }
}

async function editRenewal(renewalId) {
  const renewals = await fetchRenewals();
  const renewal = renewals.find(r => r.id === renewalId);
  if (!renewal) {
    Swal.fire({
      title: 'Error',
      text: 'Renewal not found.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const user = users.find(u => u.id === renewal.user_id) || {};

  Swal.fire({
    title: `Edit Renewal for ${renewal.user_name}`,
    html: `
      <div class="text-left space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Renewal Amount (Ksh)</label>
          <input id="editRenewalAmount" type="number" value="${renewal.amount}" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Renewal Date</label>
          <input id="editRenewalDate" type="date" value="${renewal.renewal_date}" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" required />
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
      const amount = document.getElementById('editRenewalAmount').value;
      const renewalDate = document.getElementById('editRenewalDate').value;
      const paidSubscription = document.getElementById('editPaidSubscription').checked;

      if (!amount || amount <= 0 || !renewalDate) {
        Swal.showValidationMessage('Please enter a valid amount and renewal date.');
        return false;
      }

      const expiryDate = dayjs(renewalDate).add(30, 'day').format('YYYY-MM-DD');

      return {
        amount: parseFloat(amount),
        renewalDate,
        expiryDate,
        paidSubscription,
        month: dayjs(renewalDate).format('MMMM'),
        year: dayjs(renewalDate).year()
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Update renewal
        const res = await fetch(`${window.BASE_URL}/api/renewals/${renewalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: result.value.amount,
            renewal_date: result.value.renewalDate,
            expiry_date: result.value.expiryDate,
            month: result.value.month,
            year: result.value.year
          })
        });

        if (!res.ok) throw new Error('Failed to update renewal');

        // Update user
        await fetch(`${window.BASE_URL}/api/users/${renewal.user_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription_amount: result.value.amount,
            payment_date: result.value.renewalDate,
            expiry_date: result.value.expiryDate,
            paid_subscription: result.value.paidSubscription,
            last_renewal_date: result.value.renewalDate
          })
        });

        Swal.fire({
          title: 'Success',
          text: 'Renewal updated successfully!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        });
        await fetchData(true);
        await renderRenewals();
      } catch (err) {
        console.error('Edit renewal error:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to update renewal.',
          icon: 'error',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        });
      }
    }
  });
}

async function reverseRenewal(renewalId) {
  const renewals = await fetchRenewals();
  const renewal = renewals.find(r => r.id === renewalId);
  if (!renewal) {
    Swal.fire({
      title: 'Error',
      text: 'Renewal not found.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  Swal.fire({
    title: 'Are you sure?',
    text: `This will reverse the renewal for ${renewal.user_name}. The user's subscription will be marked as unpaid.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, reverse it!',
    cancelButtonText: 'Cancel',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Try server API first
        let serverSuccess = false;
        try {
          // Mark renewal as deleted
          const res = await fetch(`${window.BASE_URL}/api/renewals/${renewalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_deleted: true })
          });

          if (res.ok) {
            // Update user to reflect reversal - set payment_date to a past date to make them expired
            const expiredDate = dayjs().subtract(31, 'days').format('YYYY-MM-DD');
            await fetch(`${window.BASE_URL}/api/users/${renewal.user_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paid_subscription: false,
                payment_date: expiredDate,
                expiry_date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                last_renewal_date: null
              })
            });
            serverSuccess = true;
          }
        } catch (serverError) {
          console.log('Server unavailable, using mock data:', serverError);
        }

        // Use mock data if server fails
        if (!serverSuccess) {
          const mockSuccess = mockReverseRenewal(renewalId, renewal.user_id);
          if (!mockSuccess) {
            throw new Error('Failed to reverse renewal in mock data');
          }
        }

        Swal.fire({
          title: 'Success',
          text: 'Renewal reversed successfully! The client has been moved to expired status.',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        });
        await fetchData(true);
        await renderRenewals();
      } catch (err) {
        console.error('Reverse renewal error:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to reverse renewal.',
          icon: 'error',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        });
      }
    }
  });
}

function exportRenewalsToCSV() {
  const currentMonth = dayjs().format('YYYY-MM');
  const monthlyRenewals = users.filter(user =>
    user.paid_subscription &&
    user.payment_date &&
    user.payment_date.startsWith(currentMonth) &&
    user.is_deleted !== 1
  );

  const headers = ['ID', 'Name', 'Phone', 'Location', 'Subscription Amount', 'Payment Date', 'Expiry Date'];
  const csvContent = [
    headers.join(','),
    ...monthlyRenewals.map(user => [
      user.id,
      `"${user.name}"`,
      user.phone,
      `"${user.location}"`,
      user.subscription_amount,
      dayjs(user.payment_date).format('YYYY-MM-DD'),
      dayjs(user.expiry_date).format('YYYY-MM-DD')
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dr-net-renewals-${dayjs().format('YYYY-MM-DD')}.csv`;
  link.click();
  Swal.fire({
    title: 'Success',
    text: 'Renewals exported to CSV successfully!',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  });
}