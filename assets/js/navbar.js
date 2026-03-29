// navbar.js - final working version for all pages
(function () {
  function initNavbar() {
    // Delay slightly to ensure auth.js finishes DOM updates
    setTimeout(() => {
      // === 1. ACTIVE NAV LINK ===
      const path = location.pathname.split('/').pop() || 'index.html';
      const map = {
        'index.html': 'nav-dashboard',
        '': 'nav-dashboard',
        'mark-attendance.html': 'nav-mark-attendance',
        'login.html': '',
        'register.html': ''
      };
      const activeId = map[path] || 'nav-dashboard';

      // Clear active classes
      document.querySelectorAll('[data-nav]').forEach(el => {
        el.classList.remove('bg-indigo-500', 'bg-indigo-500/80');
      });

      // Set active
      const activeEl = document.getElementById(activeId);
      if (activeEl) {
        activeEl.classList.add('bg-indigo-500/80');
      }

      // === 2. MOBILE MENU ===
      const mobileBtn = document.getElementById('mobile-menu-button');
      const mobileMenu = document.getElementById('mobile-menu');

      if (mobileBtn && mobileMenu) {
        // Clean up previous handlers
        mobileBtn.onclick = null;
        mobileBtn.__clickHandler = null;

        // New click handler
        const clickHandler = (e) => {
          e.stopPropagation();
          mobileMenu.classList.toggle('hidden');
        };

        mobileBtn.addEventListener('click', clickHandler);
        mobileBtn.__clickHandler = clickHandler;

        // Close on outside click
        const closeHandler = (e) => {
          if (!mobileBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            mobileMenu.classList.add('hidden');
          }
        };

        // Remove old, add new
        document.removeEventListener('click', closeHandler);
        document.addEventListener('click', closeHandler);
      }
    }, 30); // 30ms delay for DOM stability
  }

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
  } else {
    initNavbar();
  }

  // Re-init on login/logout (localStorage change)
  window.addEventListener('storage', (e) => {
    if (e.key === 'sas_current_user') {
      setTimeout(initNavbar, 50);
    }
  });

  // Re-init after logout button click
  document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'logout-btn' || e.target.closest('#logout-btn'))) {
      setTimeout(initNavbar, 100);
    }
  });
})();