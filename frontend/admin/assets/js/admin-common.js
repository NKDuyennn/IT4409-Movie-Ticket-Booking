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

/**
 * Global Helper Functions for Admin Pages
 * These are convenient wrappers around AuthHandler functions
 */

// Check if user is authenticated
function isAuthenticated() {
    return window.AuthHandler && AuthHandler.isLoggedIn();
}

// Check if user is admin
function isAdmin() {
    return window.AuthHandler && AuthHandler.isAdmin();
}

// Get current user
function getCurrentUser() {
    return window.AuthHandler ? AuthHandler.getUser() : null;
}

// Redirect to login page
function redirectToLogin() {
    window.location.href = '../sign_in.html';
}

// Get auth headers for API requests
function getAuthHeaders(skipContentType = false) {
    const token = localStorage.getItem('access_token');
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!skipContentType) {
        headers['Content-Type'] = 'application/json';
    }
    
    return headers;
}

// Handle API response
function handleResponse(response) {
    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        redirectToLogin();
        throw new Error('Unauthorized');
    }
    return response.json();
}

// Show alert message
function showAlert(message, type = 'info') {
    if (typeof asAlertMsg !== 'undefined') {
        const typeMap = {
            'success': 'Success',
            'error': 'Error',
            'warning': 'Warning',
            'info': 'Info'
        };
        
        asAlertMsg({
            type: typeMap[type] || 'Info',
            title: typeMap[type] || 'Info',
            message: message,
            button: {
                title: "OK",
                bg: typeMap[type] ? `${typeMap[type]} Button` : 'Info Button'
            }
        });
    } else {
        alert(message);
    }
}
