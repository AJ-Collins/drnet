let editingBooking = null;
let editForm = {};
let viewingBooking = null;
let newBookingForm = {
  status: 'pending',
  date: dayjs().format('YYYY-MM-DD')
};

const packages = [
  'Bronze Plan - Up to 5 Mbps (Ksh 1,500/Month)',
  'Silver Plan - Up to 10 Mbps (Ksh 2,000/Month)',
  'Gold Plan - Up to 15 Mbps (Ksh 2,500/Month)',
  'Platinum Plan - Up to 20 Mbps (Ksh 3,000/Month)',
  'Super Plan - Up to 35 Mbps (Ksh 4,500/Month)',
  'Dedicated Link - Up to 200 Mbps (Contact for Quote)'
];

const timeSlots = [
  '8:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM'
];

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

async function renderBookings() {
  const bookingList = document.getElementById('bookingList');
  const totalBookings = document.getElementById('totalBookings');
  const pendingBookings = document.getElementById('pendingBookings');
  const contactedBookings = document.getElementById('contactedBookings');
  const processedBookings = document.getElementById('processedBookings');

  bookingList.innerHTML = '<div class="text-center text-gray-500 py-8">⏳ Loading bookings...</div>';

  try {
    await fetchData();
    const bookingsWithStatus = bookings.map(booking => ({
      ...booking,
      status: booking.status || 'pending',
      installation_date: booking.installation_date || '',
    }));

    if (bookingsWithStatus.length === 0) {
      bookingList.innerHTML = `
        <div class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">📋</div>
          <p class="text-gray-500 text-lg">No bookings received yet.</p>
        </div>
      `;
    } else {
      bookingList.innerHTML = bookingsWithStatus.map(booking => `
        <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border">
          ${editingBooking === booking.id ? renderEditForm(booking) : renderBookingView(booking)}
        </div>
      `).join('');
    }

    totalBookings.textContent = bookingsWithStatus.length.toString();
    pendingBookings.textContent = bookingsWithStatus.filter(b => b.status === 'pending').length.toString();
    contactedBookings.textContent = bookingsWithStatus.filter(b => b.status === 'contacted').length.toString();
    processedBookings.textContent = bookingsWithStatus.filter(b => b.status === 'processed').length.toString();

  } catch (err) {
    console.error('Error loading bookings:', err);
    bookingList.innerHTML = '<p class="text-red-600 text-center py-8">Failed to load bookings. Please try again later.</p>';
  }
}

function renderBookingView(booking) {
  return `
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center space-x-3 mb-2">
          <h5 class="font-semibold text-lg">${booking.name}</h5>
          <span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}">
            ${getStatusIcon(booking.status)} ${booking.status}
          </span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p class="text-gray-600"><strong>Email:</strong> ${booking.email || 'N/A'}</p>
            <p class="text-gray-600"><strong>Phone:</strong> ${booking.phone}</p>
          </div>
          <div>
            <p class="text-gray-600"><strong>Location:</strong> ${booking.location}</p>
            <p class="text-gray-600"><strong>Package:</strong> ${booking.package}</p>
          </div>
        </div>
        ${(booking.installation_date) ? `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            ${booking.installation_date ? `
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="text-sm text-gray-600">
                  <strong>Installation:</strong> ${dayjs(booking.installation_date).format('MMM D, YYYY')}
                </span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
          <strong>Message:</strong> ${booking.extra_notes}
        </p>
      </div>
      <div class="flex flex-col items-end space-y-3 ml-6">
        <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          ${dayjs(booking.date).format('MMM D, YYYY')}
        </span>
        <div class="flex flex-col space-y-2">
          <select onchange="changeStatus('${booking.id}', this.value)" class="text-sm border rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500">
            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="contacted" ${booking.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="processed" ${booking.status === 'processed' ? 'selected' : ''}>Processed</option>
          </select>
        </div>
        <div class="flex space-x-2">
          <button onclick="viewBooking('${booking.id}')" class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition" title="View Details">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
          <button onclick="editBooking('${booking.id}')" class="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition" title="Edit">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
          </button>
          <button onclick="deleteBooking('${booking.id}')" class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12M3 7h18"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderEditForm(booking) {
  editForm = { ...booking };
  return `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input required type="text" value="${booking.name || ''}" oninput="editForm.name = this.value" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input required type="email" value="${booking.email || ''}" oninput="editForm.email = this.value" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input required type="text" value="${booking.phone || ''}" oninput="editForm.phone = this.value" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input required type="text" value="${booking.location || ''}" oninput="editForm.location = this.value" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Package</label>
          <select required oninput="editForm.package = this.value" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
            ${packages.map(pkg => `<option value="${pkg}" ${booking.package === pkg ? 'selected' : ''}>${pkg}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select required oninput="editForm.status = this.value" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="contacted" ${booking.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="processed" ${booking.status === 'processed' ? 'selected' : ''}>Processed</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
          <input required type="date" value="${booking.installation_date || ''}" oninput="editForm.installation_date = this.value" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Exact Location</label>
          <input required type="text" value="${booking.exact_location || ''}" oninput="editForm.exact_location = this.value" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea required oninput="editForm.extra_notes = this.value" rows="3" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">${booking.extra_notes || ''}</textarea>
      </div>
      <div class="flex space-x-3">
        <button onclick="saveEdit('${booking.id}')" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Save</span>
        </button>
        <button onclick="cancelEdit()" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
          Cancel
        </button>
      </div>
    </div>
  `;
}

function getStatusColor(status) {
  switch (status) {
    case 'processed':
      return 'bg-green-100 text-green-700';
    case 'contacted':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'processed':
      return '✅';
    case 'contacted':
      return '📞';
    default:
      return '⏳';
  }
}

async function refreshBookings() {
  await fetchData(true);
  await renderBookings();
  window.location.reload();
  Swal.fire({
    title: 'Refreshed',
    text: 'Bookings have been refreshed',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  });
}

function showAddModal() {
  newBookingForm = {
    status: 'pending',
    date: dayjs().format('YYYY-MM-DD')
  };
  const addBookingForm = document.getElementById('addBookingForm');
  addBookingForm.innerHTML = `
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
      <input type="text" value="${newBookingForm.name || ''}" oninput="newBookingForm.name = this.value" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Enter full name" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
      <input type="tel" value="${newBookingForm.phone || ''}" oninput="newBookingForm.phone = this.value" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500" placeholder="+254 xxx xxx xxx" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
      <input type="email" value="${newBookingForm.email || ''}" oninput="newBookingForm.email = this.value" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500" placeholder="email@example.com" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Location *</label>
      <input type="text" value="${newBookingForm.location || ''}" oninput="newBookingForm.location = this.value" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Enter location" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Exact Location *</label>
      <input type="text" value="${newBookingForm.exact_location || ''}" oninput="newBookingForm.exact_location = this.value" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Enter location" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Package *</label>
      <select oninput="newBookingForm.package = this.value" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500">
        <option value="">Select package</option>
        ${packages.map(pkg => `<option value="${pkg}">${pkg}</option>`).join('')}
      </select>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
      <select oninput="newBookingForm.status = this.value" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500">
        <option value="pending" selected>Pending</option>
        <option value="contacted">Contacted</option>
        <option value="processed">Processed</option>
      </select>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Installation Date</label>
      <input type="date" value="${newBookingForm.installation_date || ''}" oninput="newBookingForm.installation_date = this.value" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500" />
    </div>
    <div class="col-span-2">
      <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
      <textarea oninput="newBookingForm.extra_notes = this.value" rows="3" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Additional notes or requirements">${newBookingForm.extra_notes || ''}</textarea>
    </div>
  `;
  document.getElementById('addBookingModal').classList.remove('hidden');
}

function closeAddModal() {
  document.getElementById('addBookingModal').classList.add('hidden');
}

async function addBooking() {
  if (!newBookingForm.name || !newBookingForm.phone || !newBookingForm.location || !newBookingForm.package) {
    Swal.fire({
      title: 'Error',
      text: 'Please fill in all required fields',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const newBooking = {
    id: 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: newBookingForm.name,
    email: newBookingForm.email || '',
    phone: newBookingForm.phone,
    location: newBookingForm.location,
    exact_location: newBookingForm.exact_location,
    package: newBookingForm.package,
    extra_notes: newBookingForm.extra_notes,
    status: newBookingForm.status || 'pending',
    installation_date: newBookingForm.installation_date || '',
  };

  try {
    const res = await fetch(`${window.BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    });

    const data = await res.json();

    if (res.ok) {
      bookings.push(newBooking);
      closeAddModal();
      await renderBookings();
      setTimeout(() => {
        window.location.reload();
      }, 1600);
      Swal.fire({
        title: 'Success!',
        text: data.message || 'New booking added successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: data.message || 'Failed to add booking.',
        icon: 'error',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    }
  } catch (err) {
    console.error('Add booking error:', err);
    Swal.fire({
      title: data.message || 'Error',
      text: 'Server error occurred.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
  }
}

function editBooking(bookingId) {
  editingBooking = Number(bookingId);
  renderBookings();
}

async function saveEdit(bookingId) {

  const requiredFields = ['name', 'email', 'phone', 'location', 'exact_location', 'package', 'status', 'installation_date'];
  const missingFields = requiredFields.filter(field => !editForm[field]);

  if (missingFields.length > 0) {
    Swal.fire({
      title: 'Missing Fields',
      text: `Please fill out the following: ${missingFields.join(', ')}`,
      icon: 'warning',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  try {
    const res = await fetch(`${window.BASE_URL}/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });

    const data = await res.json();

    if (res.ok) {
      bookings = bookings.map(b => b.id == bookingId ? { ...b, ...editForm } : b);
      editingBooking = null;
      editForm = {};
      await renderBookings();
      setTimeout(() => {
        window.location.reload();
      }, 1600);
      Swal.fire({
        title: 'Success!',
        text: data.message || 'Booking updated successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
      
    } else {
      Swal.fire({
        title: 'Error',
        text: data.message || 'Failed to update booking.',
        icon: 'error',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    }
  } catch (err) {
    console.error('Update error:', err);
    Swal.fire({
      title: 'Error',
      text: data.message || 'Server error occurred.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
  }
}

function cancelEdit() {
  editingBooking = null;
  editForm = {};
  renderBookings();
}

async function deleteBooking(bookingId) {
  const booking = bookings.find(b => b.id == bookingId);
  if (!booking) return;

  Swal.fire({
    title: 'Delete Booking?',
    text: `Are you sure you want to delete the booking from ${booking.name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${window.BASE_URL}/api/bookings/${bookingId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          bookings = bookings.filter(b => b.id !== bookingId);
          await renderBookings();
          setTimeout(() => {
            window.location.reload();
          }, 1600);
          Swal.fire({
            title: 'Deleted!',
            text: 'Booking has been deleted.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: 'Failed to delete booking.',
            icon: 'error',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          });
        }
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({
          title: 'Error',
          text: 'Server error occurred.',
          icon: 'error',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        });
      }
    }
  });
}

async function changeStatus(bookingId, newStatus) {
  try {
    const res = await fetch(`${window.BASE_URL}/api/bookings/status/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      bookings = bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
      await renderBookings();
      const statusMessages = {
        pending: 'Booking marked as pending',
        processed: 'Booking marked as processed',
        contacted: 'Booking marked as contacted'
      };
      setTimeout(() => {
        window.location.reload();
      }, 1600);
      Swal.fire({
        title: 'Updated!',
        text: statusMessages[newStatus],
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Failed to update status.',
        icon: 'error',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    }
  } catch (err) {
    console.error('Status update error:', err);
    Swal.fire({
      title: 'Error',
      text: 'Server error occurred.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
  }
}

function viewBooking(bookingId) {
  viewingBooking = bookings.find(b => b.id == bookingId);
  if (!viewingBooking) return;

  const viewBookingContent = document.getElementById('viewBookingContent');
  viewBookingContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-semibold text-gray-800 mb-4">Contact Information</h3>
        <div class="space-y-3">
          <p><strong>Name:</strong> ${viewingBooking.name}</p>
          <p><strong>Email:</strong> ${viewingBooking.email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${viewingBooking.phone}</p>
          <p><strong>Location:</strong> ${viewingBooking.location}</p>
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-gray-800 mb-4">Booking Information</h3>
        <div class="space-y-3">
          <p><strong>Package:</strong> ${viewingBooking.package}</p>
          <p><strong>Date:</strong> ${dayjs(viewingBooking.date).format('MMMM D, YYYY')}</p>
          <p><strong>Status:</strong> 
            <span class="ml-2 px-2 py-1 rounded-full text-sm ${getStatusColor(viewingBooking.status)}">
              ${viewingBooking.status}
            </span>
          </p>
          ${viewingBooking.installation_date ? `<p><strong>Installation Date:</strong> ${dayjs(viewingBooking.installation_date).format('MMMM D, YYYY')}</p>` : ''}
        </div>
      </div>
    </div>
    <div class="mt-6">
      <h3 class="font-semibold text-gray-800 mb-2">Message</h3>
      <div class="bg-gray-50 p-4 rounded-lg">
        <p class="text-gray-700">${viewingBooking.extra_notes}</p>
      </div>
    </div>
  `;
  document.getElementById('viewBookingModal').classList.remove('hidden');
}

function closeViewModal() {
  document.getElementById('viewBookingModal').classList.add('hidden');
  viewingBooking = null;
}

function exportBookingsToCSV() {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Location', 'Package', 'Date', 'Status', 'Installation Date', 'Preferred Time', 'Message'];
  const csvContent = [
    headers.join(','),
    ...bookings.map(b => [
      b.id,
      `"${b.name}"`,
      b.email || 'N/A',
      `"${b.location}"`,
      `"${b.package}"`,
      dayjs(b.date).format('YYYY-MM-DD'),
      b.status || 'pending',
      b.installation_date ? dayjs(b.installation_date).format('YYYY-MM-DD') : '',
      `"${b.extra_notes.replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dr-net-bookings-${dayjs().format('YYYY-MM-DD')}.csv`;
  link.click();
  Swal.fire({
    title: 'Success',
    text: 'Bookings exported to CSV successfully!',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  });
}