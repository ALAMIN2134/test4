// auth.js - Hardcoded: CSE 13th Batch only
(function () {
  // Simulate login as CSE 13th
  function loginAsCSE13() {
    const user = { name: 'CSE 13th Batch', batch_id: 1 };
    localStorage.setItem('sas_current_user', JSON.stringify(user));
    renderUserNav();
    renderWelcomeCard();
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Auto-login as CSE 13th
    if (!localStorage.getItem('sas_current_user')) {
      loginAsCSE13();
    }

    // Render UI
    renderUserNav();
    renderWelcomeCard();

    // Logout
    document.body.addEventListener('click', (e) => {
      if (e.target && (e.target.id === 'logout-btn' || e.target.closest('#logout-btn'))) {
        localStorage.removeItem('sas_current_user');
        renderUserNav();
        renderWelcomeCard();
        // Auto-login again after 1s (for demo)
        setTimeout(loginAsCSE13, 1000);
      }
    });
  });

  function renderUserNav() {
    const container = document.getElementById('nav-user');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('sas_current_user') || 'null');
    container.innerHTML = '';

    if (user) {
      const btn = document.createElement('button');
      btn.className = 'user-btn px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md';
      btn.innerHTML = `<span>${user.name.split(' ')[0]}</span>`;
      container.appendChild(btn);
    }
  }

  function renderWelcomeCard() {
    const welcome = document.getElementById('welcome-card');
    if (!welcome) return;

    const user = JSON.parse(localStorage.getItem('sas_current_user') || 'null');
    if (user) {
      document.getElementById('welcome-title').textContent = `Welcome, ${user.name}`;
      welcome.classList.remove('hidden');
    } else {
      welcome.classList.add('hidden');
    }
  }
})();