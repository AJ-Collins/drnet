// ============================================
// CENTRALIZED PROFILE IMAGE MANAGER
// Works across all user types: CTIO, Supervisor, Clients, Staff
// ============================================

/**
 * Get the current user's identifier (username, email, or ID)
 */
function getCurrentUserId() {
  // Try to get from various sources
  const adminProfile = JSON.parse(localStorage.getItem('adminProfile') || '{}');
  if (adminProfile.username || adminProfile.name) {
    return adminProfile.username || adminProfile.name.toLowerCase().replace(/\s+/g, '_');
  }
  
  // Try from session or other storage
  const sessionData = JSON.parse(sessionStorage.getItem('user') || '{}');
  if (sessionData.username || sessionData.email || sessionData.id) {
    return sessionData.username || sessionData.email || sessionData.id;
  }
  
  // Try from page context (for dashboards that load user info)
  const userNameElement = document.getElementById('clientName') || 
                         document.getElementById('staffName') || 
                         document.getElementById('adminName');
  if (userNameElement) {
    const userName = userNameElement.textContent || userNameElement.value || '';
    if (userName) {
      return userName.toLowerCase().replace(/\s+/g, '_');
    }
  }
  
  // Default fallback
  return 'default_user';
}

/**
 * Get user type (admin, supervisor, client, staff)
 */
function getUserType() {
  const path = window.location.pathname;
  if (path.includes('dashboard.html') || path.includes('settings.html')) {
    return 'admin';
  } else if (path.includes('supervisor-dashboard')) {
    return 'supervisor';
  } else if (path.includes('client-dashboard')) {
    return 'client';
  } else if (path.includes('staff-dashboard') || path.includes('admin-assistant-dashboard') || path.includes('customer-care-dashboard')) {
    return 'staff';
  }
  return 'admin'; // Default
}

/**
 * Save profile image for a specific user
 */
function saveProfileImage(imageUrl, userId = null, userType = null) {
  const userId_ = userId || getCurrentUserId();
  const userType_ = userType || getUserType();
  
  // Store with user-specific key
  const key = `profileImage_${userType_}_${userId_}`;
  localStorage.setItem(key, imageUrl);
  
  // Also store for backward compatibility with admin
  if (userType_ === 'admin') {
    localStorage.setItem('adminProfileImage', imageUrl);
  }
  
  // Store in centralized profile images object
  let profileImages = JSON.parse(localStorage.getItem('profileImages') || '{}');
  if (!profileImages[userType_]) {
    profileImages[userType_] = {};
  }
  profileImages[userType_][userId_] = imageUrl;
  localStorage.setItem('profileImages', JSON.stringify(profileImages));
  
  console.log(`✅ Profile image saved for ${userType_}: ${userId_}`);
  
  // Trigger custom event for other parts of the app
  window.dispatchEvent(new CustomEvent('profileImageUpdated', {
    detail: { userId: userId_, userType: userType_, imageUrl }
  }));
}

/**
 * Get profile image for a specific user
 */
function getProfileImage(userId = null, userType = null) {
  const userId_ = userId || getCurrentUserId();
  const userType_ = userType || getUserType();
  
  // Try user-specific key first
  const key = `profileImage_${userType_}_${userId_}`;
  let imageUrl = localStorage.getItem(key);
  
  if (imageUrl) {
    return imageUrl;
  }
  
  // Try centralized profile images object
  let profileImages = JSON.parse(localStorage.getItem('profileImages') || '{}');
  if (profileImages[userType_] && profileImages[userType_][userId_]) {
    return profileImages[userType_][userId_];
  }
  
  // Backward compatibility for admin
  if (userType_ === 'admin') {
    imageUrl = localStorage.getItem('adminProfileImage');
    if (imageUrl) {
      // Migrate to new format
      saveProfileImage(imageUrl, userId_, userType_);
      return imageUrl;
    }
  }
  
  return null;
}

/**
 * Remove profile image for a specific user
 */
function removeProfileImage(userId = null, userType = null) {
  const userId_ = userId || getCurrentUserId();
  const userType_ = userType || getUserType();
  
  // Remove from user-specific key
  const key = `profileImage_${userType_}_${userId_}`;
  localStorage.removeItem(key);
  
  // Remove from centralized object
  let profileImages = JSON.parse(localStorage.getItem('profileImages') || '{}');
  if (profileImages[userType_] && profileImages[userType_][userId_]) {
    delete profileImages[userType_][userId_];
    localStorage.setItem('profileImages', JSON.stringify(profileImages));
  }
  
  // Backward compatibility for admin
  if (userType_ === 'admin') {
    localStorage.removeItem('adminProfileImage');
  }
  
  console.log(`🗑️ Profile image removed for ${userType_}: ${userId_}`);
  
  // Trigger custom event
  window.dispatchEvent(new CustomEvent('profileImageRemoved', {
    detail: { userId: userId_, userType: userType_ }
  }));
}

/**
 * Update profile image in all visible locations on the current page
 */
function updateVisibleProfileImages(imageUrl = null) {
  const imageUrl_ = imageUrl || getProfileImage();
  
  if (!imageUrl_) {
    return;
  }
  
  // Update common profile image elements
  const selectors = [
    '#adminProfileImage',
    '#profileImage',
    '.profile-image',
    '[id*="ProfileImage"]',
    '[id*="profileImage"]',
    '[class*="profile-image"]'
  ];
  
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.tagName === 'IMG') {
          el.src = imageUrl_;
        } else if (el.tagName === 'DIV') {
          el.style.backgroundImage = `url(${imageUrl_})`;
        }
      });
    } catch (e) {
      // Ignore selector errors
    }
  });
  
  // Also update profile image containers
  const containers = document.querySelectorAll('[id*="profileImageContainer"], [class*="profile-image-container"]');
  containers.forEach(container => {
    const existingImg = container.querySelector('img');
    if (existingImg) {
      existingImg.src = imageUrl_;
    } else {
      container.innerHTML = `<img src="${imageUrl_}" alt="Profile" class="w-full h-full object-cover" />`;
    }
  });
}

/**
 * Initialize profile image on page load
 */
function initializeProfileImage() {
  const imageUrl = getProfileImage();
  if (imageUrl) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        updateVisibleProfileImages(imageUrl);
      });
    } else {
      updateVisibleProfileImages(imageUrl);
    }
  }
  
  // Listen for profile image updates
  window.addEventListener('profileImageUpdated', (event) => {
    updateVisibleProfileImages(event.detail.imageUrl);
  });
}

// Auto-initialize when script loads
initializeProfileImage();

// Export for use in other scripts
window.ProfileImageManager = {
  save: saveProfileImage,
  get: getProfileImage,
  remove: removeProfileImage,
  update: updateVisibleProfileImages,
  initialize: initializeProfileImage,
  getCurrentUserId: getCurrentUserId,
  getUserType: getUserType
};





