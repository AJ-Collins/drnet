// Universal Responsive Sidebar Functionality for All Dashboard Types
// This file provides responsive sidebar behavior for admin, client, and staff dashboards

function setupUniversalSidebar() {
  // Prevent multiple initializations
  if (window.sidebarInitialized) {
    return;
  }
  window.sidebarInitialized = true;
  
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
  // Handle different button naming conventions across pages
  const toggleButton = document.getElementById('toggleSidebar') || 
                      document.getElementById('openSidebar') ||
                      document.getElementById('mobileMenuButton');
  
  const closeButton = document.getElementById('closeSidebar');

  // Touch gesture variables
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  // Function to close sidebar
  function closeSidebarMenu() {
    if (sidebar) {
      sidebar.classList.add('-translate-x-full');
      // Handle different sidebar implementations
      if (sidebar.style) {
        sidebar.style.transform = 'translateX(-100%)';
      }
    }
    if (overlay) {
      overlay.classList.add('hidden');
    }
    document.body.classList.remove('overflow-hidden', 'sidebar-open');
  }

  // Function to open sidebar
  function openSidebarMenu() {
    if (sidebar) {
      sidebar.classList.remove('-translate-x-full');
      // Handle different sidebar implementations
      if (sidebar.style) {
        sidebar.style.transform = 'translateX(0)';
      }
    }
    if (overlay) {
      overlay.classList.remove('hidden');
    }
    document.body.classList.add('overflow-hidden', 'sidebar-open');
  }

  // Check if we're on mobile/tablet
  function isMobile() {
    return window.innerWidth < 768; // md breakpoint
  }

  // Check if we're on tablet
  function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }

  // Handle window resize
  function handleResize() {
    if (!isMobile()) {
      // On desktop/tablet, ensure overlay is hidden
      if (overlay) {
        overlay.classList.add('hidden');
      }
      document.body.classList.remove('overflow-hidden', 'sidebar-open');
      
      // On desktop, ensure sidebar is visible
      if (!isTablet() && sidebar) {
        sidebar.classList.remove('-translate-x-full');
        if (sidebar.style) {
          sidebar.style.transform = 'translateX(0)';
        }
      }
    } else {
      // On mobile, ensure sidebar starts closed
      if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        closeSidebarMenu();
      }
    }
  }

  // Touch gesture handlers
  function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }

  function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
  }

  function handleSwipeGesture() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    const verticalDistance = Math.abs(touchEndY - touchStartY);
    
    // Only process horizontal swipes (vertical distance should be small)
    if (verticalDistance > 100) return;

    if (isMobile() && sidebar) {
      // Swipe right to open sidebar (from left edge)
      if (swipeDistance > swipeThreshold && touchStartX < 50) {
        const isClosed = sidebar.classList.contains('-translate-x-full') || 
                        (sidebar.style.transform && sidebar.style.transform.includes('-100%'));
        if (isClosed) {
          openSidebarMenu();
        }
      }
      // Swipe left to close sidebar
      else if (swipeDistance < -swipeThreshold) {
        const isOpen = !sidebar.classList.contains('-translate-x-full') && 
                      (!sidebar.style.transform || !sidebar.style.transform.includes('-100%'));
        if (isOpen) {
          closeSidebarMenu();
        }
      }
    }
  }

  // Toggle function for button clicks
  function toggleSidebar() {
    if (!sidebar) return;
    
    const isClosed = sidebar.classList.contains('-translate-x-full') || 
                    (sidebar.style.transform && sidebar.style.transform.includes('-100%'));
    
    if (isClosed) {
      openSidebarMenu();
    } else {
      closeSidebarMenu();
    }
  }

  // Event listeners
  if (toggleButton) {
    toggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSidebarMenu();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebarMenu);
  }

  // Close sidebar when clicking nav items on mobile only
  const navItems = document.querySelectorAll('.nav-item, nav a, aside a');
  navItems.forEach(item => {
    // Remove any existing event listeners to prevent duplicates
    item.removeEventListener('click', handleNavItemClick);
    // Add the event listener
    item.addEventListener('click', handleNavItemClick);
  });

  // Define the click handler function
  function handleNavItemClick(e) {
    // Only close sidebar on mobile devices, not on desktop or tablet
    if (isMobile()) {
      // Check if this is an external link (not a hash link)
      const href = e.currentTarget.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        // For external links, add a small delay to allow navigation to complete
        setTimeout(closeSidebarMenu, 200);
      } else {
        // For internal navigation, close immediately
        closeSidebarMenu();
      }
    } else {
      // On desktop and tablet, ensure sidebar stays open
      console.log('🖥️ Desktop/Tablet: Keeping sidebar open');
      if (sidebar && window.innerWidth >= 1024) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.style.transform = 'translateX(0)';
      }
    }
  }

  // Add touch gesture support
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Initial setup
  setTimeout(handleResize, 100); // Small delay to ensure DOM is ready

  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const isClosed = !sidebar || sidebar.classList.contains('-translate-x-full') || 
                      (sidebar.style.transform && sidebar.style.transform.includes('-100%'));
      if ((isMobile() || isTablet()) && !isClosed) {
        closeSidebarMenu();
      }
    }
  });

  // Handle clicks outside sidebar on mobile
  document.addEventListener('click', (e) => {
    if (isMobile() && sidebar) {
      const isClosed = sidebar.classList.contains('-translate-x-full') || 
                      (sidebar.style.transform && sidebar.style.transform.includes('-100%'));
      
      if (!isClosed && !sidebar.contains(e.target) && e.target !== toggleButton) {
        closeSidebarMenu();
      }
    }
  });

  // Prevent sidebar from closing when clicking inside it
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Initialize navigation enhancements
  initializeNavigationEnhancements();
  
  console.log('✅ Universal responsive sidebar initialized');
}

// Navigation Enhancement Functions
function initializeNavigationEnhancements() {
  // Add active state management
  setupActiveStateManagement();
  
  // Add keyboard navigation
  setupKeyboardNavigation();
  
  // Add loading states
  setupLoadingStates();
  
  // Add click animations
  setupClickAnimations();
  
  console.log('✅ Navigation enhancements initialized');
}

// Active state management
function setupActiveStateManagement() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // Remove active class from all nav items
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // Add active class to clicked item
      this.classList.add('active');
      
      // Store active state in localStorage
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        localStorage.setItem('activeNavItem', href);
      }
    });
  });
  
  // Restore active state on page load
  const activeNavItem = localStorage.getItem('activeNavItem');
  if (activeNavItem) {
    const activeItem = document.querySelector(`[href="${activeNavItem}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }
}

// Keyboard navigation
function setupKeyboardNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach((item, index) => {
    item.addEventListener('keydown', function(e) {
      let targetIndex = index;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          targetIndex = (index + 1) % navItems.length;
          break;
        case 'ArrowUp':
          e.preventDefault();
          targetIndex = index === 0 ? navItems.length - 1 : index - 1;
          break;
        case 'Home':
          e.preventDefault();
          targetIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          targetIndex = navItems.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.click();
          return;
      }
      
      if (targetIndex !== index) {
        navItems[targetIndex].focus();
      }
    });
  });
}

// Loading states
function setupLoadingStates() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Only add loading state for external links or sections
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        this.classList.add('loading');
        
        // Remove loading state after navigation
        setTimeout(() => {
          this.classList.remove('loading');
        }, 1000);
      }
    });
  });
}

// Click animations
function setupClickAnimations() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // Add ripple effect
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // Add ripple animation CSS
  if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Alternative setup function for compatibility
function setupAdminSidebar() {
  setupUniversalSidebar();
}

function setupDashboardSidebar() {
  setupUniversalSidebar();
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', setupUniversalSidebar);

// Make functions globally available for manual initialization
window.setupUniversalSidebar = setupUniversalSidebar;
window.setupAdminSidebar = setupAdminSidebar;
window.setupDashboardSidebar = setupDashboardSidebar;