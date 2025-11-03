async function loadPage(pageName) {
    if (!pageName) return;

    const paths = [
      `/admin/pages/${pageName}.html`,
      `/admin/pages/${pageName}.htm`
    ];

    let loaded = false;
    for (const url of paths) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const html = await res.text();

        const pageContent = document.getElementById('pageContent');
        pageContent.innerHTML = html;

        // Update page title/subtitle
        const titleEl = document.getElementById('pageTitle');
        const subtitleEl = document.getElementById('pageSubtitle');
        const pageTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');
        titleEl.textContent = pageTitle;
        subtitleEl.textContent = `Manage ${pageTitle.toLowerCase()} section`;

        // Run page-specific init
        if (window.initPageScripts) {
          window.initPageScripts(pageName);
        }

        loaded = true;
        break;
      } catch (err) {
        console.warn(`Failed to load ${url}:`, err);
      }
    }

    if (!loaded) {
      document.getElementById('pageContent').innerHTML = `
        <div class="text-center py-16">
          <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <p class="text-red-600 text-lg">Page not found: <strong>${pageName}</strong></p>
          <p class="text-gray-600 mt-2">Check the file exists in /admin/pages/</p>
        </div>`;
    }
  }

// Update navigation links to load pages dynamically
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.getAttribute('data-page');
      if (!page) return; // skip links that aren't mapped to pages
      loadPage(page);

      // Update active state
      document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('bg-teal-900', 'text-white');
        l.classList.add('text-teal-100', 'bg-teal-900/50');
      });
      this.classList.remove('text-teal-100', 'bg-teal-900/50');
      this.classList.add('bg-teal-900', 'text-white');

      // Close sidebar on mobile
      const isLargeScreen = window.innerWidth >= 1024;
      if (!isLargeScreen && typeof toggleSidebar === 'function') {
        toggleSidebar();
      }
    });
  });

  // Load default page
  const defaultPage = 'dashboard';
  const activeLink = document.querySelector(`[data-page="${defaultPage}"]`);
    if (activeLink) {
      activeLink.classList.remove('bg-teal-900/50', 'text-teal-100');
      activeLink.classList.add('bg-teal-900', 'text-white');
    }
  loadPage(defaultPage);
});
//