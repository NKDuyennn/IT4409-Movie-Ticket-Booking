/**
 * Auth Handler - Xử lý authentication state trên toàn bộ website
 * Tự động load và hiển thị thông tin user đã login
 */

(function() {
    'use strict';
    
    const API_URL = CONFIG.API_URL;
    
    /**
     * Lấy thông tin user từ localStorage
     */
    function getStoredUser() {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        
        if (userStr && token) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Error parsing user data:', e);
                return null;
            }
        }
        return null;
    }
    
    /**
     * Đăng xuất
     */
    function logout() {
        // Clear localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Show alert if available
        if (typeof asAlertMsg !== 'undefined') {
            asAlertMsg({
                type: "success",
                title: "Logged Out",
                message: "You have been logged out successfully!",
                button: {
                    title: "OK",
                    bg: "Success Button"
                }
            });
        }
        
        // Reload page sau 1 giây
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
    
    /**
     * Cập nhật UI header với thông tin user
     */
    function updateHeaderUI(user) {
        const loginElement = document.getElementById('login') || document.getElementById('login_s');
        
        if (!loginElement) {
            return;
        }
        
        // Tạo dropdown menu cho user đã login
        const userMenuHTML = `
            <div class="user-dropdown-wrapper" style="position: relative; display: inline-block;">
                <a class="nav-link user-toggle" href="javascript:void(0)" 
                   style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <i class="fa fa-user-circle-o" style="font-size: 1.8rem;"></i>
                    <span style="font-size: 0.95rem; font-weight: 500;">${user.full_name}</span>
                    ${user.role === 'admin' ? '<span style="background: #ff4b2b; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-left: 5px;">ADMIN</span>' : ''}
                    <i class="fa fa-caret-down" style="font-size: 0.9rem;"></i>
                </a>
                <div class="user-dropdown-menu" style="
                    display: none;
                    position: absolute;
                    right: 0;
                    top: calc(100% + 10px);
                    background: var(--bg-color, #fff);
                    border: 1px solid var(--border-color, #ddd);
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    min-width: 220px;
                    z-index: 1000;
                    overflow: hidden;
                ">
                    <div style="padding: 20px 15px; border-bottom: 1px solid var(--border-color, #eee); background: var(--hover-bg, #f8f9fa);">
                        <div style="font-weight: 600; color: var(--theme-title); font-size: 1.1rem;">${user.full_name}</div>
                        <div style="font-size: 0.85rem; color: var(--theme-text, #666); margin-top: 5px;">${user.email}</div>
                        ${user.role === 'admin' ? '<div style="margin-top: 8px;"><span style="background: #ff4b2b; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem;">Administrator</span></div>' : ''}
                    </div>
                    <a href="#" class="dropdown-item" style="
                        display: block;
                        padding: 14px 15px;
                        color: var(--theme-title);
                        text-decoration: none;
                        transition: all 0.3s;
                        font-size: 0.95rem;
                    ">
                        <i class="fa fa-user" style="margin-right: 10px; width: 20px;"></i> My Profile
                    </a>
                    <a href="#" class="dropdown-item" style="
                        display: block;
                        padding: 14px 15px;
                        color: var(--theme-title);
                        text-decoration: none;
                        transition: all 0.3s;
                        font-size: 0.95rem;
                    ">
                        <i class="fa fa-ticket" style="margin-right: 10px; width: 20px;"></i> My Bookings
                    </a>
                    ${user.role === 'admin' ? `
                    <a href="#" class="dropdown-item" style="
                        display: block;
                        padding: 14px 15px;
                        color: var(--theme-title);
                        text-decoration: none;
                        transition: all 0.3s;
                        font-size: 0.95rem;
                        border-top: 1px solid var(--border-color, #eee);
                    ">
                        <i class="fa fa-cog" style="margin-right: 10px; width: 20px;"></i> Admin Panel
                    </a>
                    ` : ''}
                    <a href="javascript:void(0)" id="logout-btn" class="dropdown-item" style="
                        display: block;
                        padding: 14px 15px;
                        color: #e74c3c;
                        text-decoration: none;
                        transition: all 0.3s;
                        border-top: 1px solid var(--border-color, #eee);
                        font-size: 0.95rem;
                        font-weight: 500;
                    ">
                        <i class="fa fa-sign-out" style="margin-right: 10px; width: 20px;"></i> Logout
                    </a>
                </div>
            </div>
        `;
        
        loginElement.innerHTML = userMenuHTML;
        
        // Add hover effects
        const dropdownItems = loginElement.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.background = 'var(--hover-bg, #f5f5f5)';
                this.style.paddingLeft = '20px';
            });
            item.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
                this.style.paddingLeft = '15px';
            });
        });
        
        // Toggle dropdown
        const userToggle = loginElement.querySelector('.user-toggle');
        const dropdownMenu = loginElement.querySelector('.user-dropdown-menu');
        
        if (userToggle && dropdownMenu) {
            userToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isVisible = dropdownMenu.style.display === 'block';
                dropdownMenu.style.display = isVisible ? 'none' : 'block';
            });
            
            // Close dropdown khi click bên ngoài
            document.addEventListener('click', (e) => {
                if (!loginElement.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                }
            });
        }
        
        // Logout handler
        const logoutBtn = loginElement.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }
    
    /**
     * Khởi tạo
     */
    function init() {
        const user = getStoredUser();
        
        if (user) {
            console.log('✅ User logged in:', user);
            updateHeaderUI(user);
        } else {
            console.log('❌ No user logged in');
        }
    }
    
    // Chạy khi DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export functions để có thể gọi từ bên ngoài
    window.AuthHandler = {
        getUser: getStoredUser,
        logout: logout,
        isLoggedIn: function() {
            return !!getStoredUser();
        },
        isAdmin: function() {
            const user = getStoredUser();
            return user && user.role === 'admin';
        }
    };
    
})();

