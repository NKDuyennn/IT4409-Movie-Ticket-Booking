/**
 * Admin Common Functions
 * Shared utilities for all admin pages
 */
(function() {
    'use strict';

    // Ensure only admins can view admin pages
    function ensureAdmin() {
        if (!window.AuthHandler || !AuthHandler.isAdmin()) {
            window.location.href = '../sign_in.html';
            return false;
        }
        return true;
    }

    // Load sidebar component
    function loadSidebar() {
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('sidebar-container').innerHTML = html;
                
                // Update active menu based on current page
                const currentPage = window.location.pathname.split('/').pop();
                const menuLinks = document.querySelectorAll('.sidebar-menu a');
                menuLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === currentPage) {
                        link.classList.add('active');
                    }
                });

                // Update user info
                const user = AuthHandler.getUser();
                if (user && user.full_name) {
                    document.getElementById('admin-name').textContent = user.full_name;
                }
            })
            .catch(err => console.error('Error loading sidebar:', err));
    }

    // Initialize admin page
    function init() {
        if (!ensureAdmin()) return;
        loadSidebar();
    }

    // Export common functions
    window.AdminCommon = {
        ensureAdmin: ensureAdmin,
        loadSidebar: loadSidebar,
        init: init
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
