let adminProfile = {
  name: localStorage.getItem('adminName'),
  title: localStorage.getItem('adminTitle'),
  email: localStorage.getItem('adminEmail'),
  phone: localStorage.getItem('adminPhone'),
  image: localStorage.getItem('adminProfileImage') || null
};

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

  loadProfile();
});

function loadProfile() {
  document.getElementById('adminName').value = adminProfile.name || '';
  document.getElementById('adminTitle').value = adminProfile.title || '';
  document.getElementById('adminEmail').value = adminProfile.email || '';
  document.getElementById('adminPhone').value = adminProfile.phone || '';
  document.getElementById('sidebarAdminTitle').textContent = `${adminProfile.name || 'Admin'} - ${adminProfile.title || 'Administrator'}`;

  const profileImageContainer = document.getElementById('profileImageContainer');
  const defaultProfileIcon = document.getElementById('defaultProfileIcon');
  const removeImageButton = document.getElementById('removeImageButton');

  if (adminProfile.image) {
    profileImageContainer.innerHTML = `<img src="${adminProfile.image}" alt="Profile" class="w-full h-full object-cover" />`;
    removeImageButton.classList.remove('hidden');
  } else {
    profileImageContainer.innerHTML = defaultProfileIcon ? defaultProfileIcon.outerHTML : `
      <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>`;
    removeImageButton.classList.add('hidden');
  }
}

function triggerFileInput() {
  document.getElementById('fileInput').click();
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  const allowedImageTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff',
    'image/heic', 'image/heif', 'image/svg+xml', 'image/bmp'
  ];
  if (!allowedImageTypes.includes(file.type)) {
    Swal.fire({
      title: 'Error',
      text: 'Please upload a valid image file (JPEG, PNG, GIF, WEBP, TIFF, HEIC, SVG, BMP)',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    Swal.fire({
      title: 'Error',
      text: 'Image size should be less than 5MB',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const imageUrl = e.target.result;
    const previousImage = adminProfile.image; // Store previous image for rollback
    adminProfile.image = imageUrl;
    
    // Save using centralized profile image manager
    if (window.ProfileImageManager) {
      window.ProfileImageManager.save(imageUrl);
    } else {
      localStorage.setItem('adminProfileImage', imageUrl);
    }
    
    document.getElementById('profileImageContainer').innerHTML = `<img src="${imageUrl}" alt="Profile" class="w-full h-full object-cover" />`;
    document.getElementById('removeImageButton').classList.remove('hidden');

    try {
      const res = await fetch(`${window.BASE_URL}/api/admin/profile/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl })
      });

      if (res.ok) {
        Swal.fire({
          title: 'Success!',
          text: 'Profile picture updated successfully!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        });
      } else {
        // Rollback UI and localStorage on failure
        adminProfile.image = previousImage;
        localStorage.setItem('adminProfileImage', previousImage || '');
        loadProfile();
        Swal.fire({
          title: 'Error',
          text: 'Failed to update profile picture.',
          icon: 'error',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        });
      }
    } catch (err) {
      console.error('Image upload error:', err);
      // Rollback UI and localStorage on error
      adminProfile.image = previousImage;
      localStorage.setItem('adminProfileImage', previousImage || '');
      loadProfile();
      Swal.fire({
        title: 'Error',
        text: 'Server error occurred.',
        icon: 'error',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    }
  };
  reader.readAsDataURL(file);
}

async function removeProfileImage() {
  const previousImage = adminProfile.image; // Store previous image for rollback
  adminProfile.image = null;
  
  // Remove using centralized profile image manager
  if (window.ProfileImageManager) {
    window.ProfileImageManager.remove();
  } else {
    localStorage.removeItem('adminProfileImage');
  }
  
  const profileImageContainer = document.getElementById('profileImageContainer');
  const defaultProfileIcon = document.getElementById('defaultProfileIcon');
  profileImageContainer.innerHTML = defaultProfileIcon ? defaultProfileIcon.outerHTML : `
    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>`;
  document.getElementById('removeImageButton').classList.add('hidden');

  try {
    const res = await fetch(`${window.BASE_URL}/api/admin/profile/image`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: null })
    });

    if (res.ok) {
      Swal.fire({
        title: 'Success!',
        text: 'Profile picture removed successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    } else {
      // Rollback UI and localStorage on failure
      adminProfile.image = previousImage;
      localStorage.setItem('adminProfileImage', previousImage || '');
      loadProfile();
      Swal.fire({
        title: 'Error',
        text: 'Failed to remove profile picture.',
        icon: 'error',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    }
  } catch (err) {
    console.error('Error removing profile image:', err);
    // Rollback UI and localStorage on error
    adminProfile.image = previousImage;
    localStorage.setItem('adminProfileImage', previousImage || '');
    loadProfile();
    Swal.fire({
      title: 'Error',
      text: 'Server error occurred while removing profile picture.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
  }
}

async function saveProfile() {
  const adminName = document.getElementById('adminName').value;
  const adminTitle = document.getElementById('adminTitle').value;
  const adminEmail = document.getElementById('adminEmail').value;
  const adminPhone = document.getElementById('adminPhone').value;

  if (!adminName || !adminEmail || !adminPhone) {
    Swal.fire({
      title: 'Error',
      text: 'Please fill in all required fields (Name, Email, Phone)',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  adminProfile = { ...adminProfile, name: adminName, title: adminTitle, email: adminEmail, phone: adminPhone };
  localStorage.setItem('adminName', adminName);
  localStorage.setItem('adminTitle', adminTitle);
  localStorage.setItem('adminEmail', adminEmail);
  localStorage.setItem('adminPhone', adminPhone);
  document.getElementById('sidebarAdminTitle').textContent = `${adminName} - ${adminTitle}`;

  try {
    const res = await fetch(`${window.BASE_URL}/api/admin/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminProfile)
    });

    if (res.ok) {
      Swal.fire({
        title: 'Success!',
        text: 'Profile updated successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Failed to update profile.',
        icon: 'error',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    }
  } catch (err) {
    console.error('Profile update error:', err);
    Swal.fire({
      title: 'Error',
      text: 'Server error occurred.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
  }
}

async function resetPassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    Swal.fire({
      title: 'Error',
      text: 'Please fill in all password fields',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  if (newPassword !== confirmNewPassword) {
    Swal.fire({
      title: 'Error',
      text: 'New password and confirmation do not match',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  if (newPassword.length < 8) {
    Swal.fire({
      title: 'Error',
      text: 'New password must be at least 8 characters long',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  try {
    const res = await fetch(`${window.BASE_URL}/api/admin/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (res.ok) {
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmNewPassword').value = '';
      Swal.fire({
        title: 'Success!',
        text: 'Password reset successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    } else {
      const error = await res.json();
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to reset password.',
        icon: 'error',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      });
    }
  } catch (err) {
    console.error('Password reset error:', err);
    Swal.fire({
      title: 'Error',
      text: 'Server error occurred.',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
  }
}