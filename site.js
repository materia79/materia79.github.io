(function () {
    const hamburger = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        if (window.innerWidth <= 768) {
            navMenu.classList.add('hidden');
        }

        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('hidden');
        });
    }

    const path = (window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    const isProjectPath = path.includes('/projects/');
    const isContactPath = path.endsWith('/contact.html');
    const isHomePath = !isProjectPath && !isContactPath;

    document.querySelectorAll('.nav-menu a[data-nav]').forEach((link) => {
        const target = link.dataset.nav;
        const isActive =
            (target === 'home' && isHomePath) ||
            (target === 'projects' && isProjectPath) ||
            (target === 'contact' && isContactPath);

        link.classList.toggle('active', isActive);
    });
})();
