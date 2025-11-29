/**
 * Promotion View JavaScript
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';
    let currentPromotionId = null;

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        const urlParams = new URLSearchParams(window.location.search);
        currentPromotionId = urlParams.get('id');
        
        if (!currentPromotionId) {
            showAlert('Promotion ID not found', 'error');
            setTimeout(() => {
                window.location.href = 'promotions.html';
            }, 2000);
            return;
        }
        
        loadPromotion();
    });

    /**
     * Load promotion details
     */
    function loadPromotion() {
        const loadingState = document.getElementById('page-loading-state');
        const viewContainer = document.getElementById('view-container');

        loadingState.style.display = 'flex';
        viewContainer.style.display = 'none';

        fetch(`${API_BASE_URL}/api/admin/promotions/${currentPromotionId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data) {
                displayPromotion(result.data);
                viewContainer.style.display = 'block';
            } else {
                throw new Error(result.message || 'Promotion not found');
            }
        })
        .catch(error => {
            loadingState.style.display = 'none';
            console.error('Error loading promotion:', error);
            showAlert(error.message || 'Failed to load promotion', 'error');
            setTimeout(() => {
                window.location.href = 'promotions.html';
            }, 2000);
        });
    }

    /**
     * Display promotion details
     */
    function displayPromotion(promotion) {
        // Code and Status Badge
        document.getElementById('view-code').textContent = promotion.code || '-';
        
        const statusBadge = document.getElementById('view-status-badge');
        const isActive = promotion.is_active;
        statusBadge.className = `status-badge ${isActive ? 'status-active' : 'status-inactive'}`;
        statusBadge.textContent = isActive ? 'Active' : 'Inactive';
        
        // Name and Description
        document.getElementById('view-name').textContent = promotion.name || '-';
        document.getElementById('view-description').textContent = promotion.description || 'No description provided';
        
        // Discount
        const discountEl = document.getElementById('view-discount');
        if (promotion.discount_percentage) {
            discountEl.textContent = promotion.discount_percentage + '%';
        } else if (promotion.discount_amount) {
            discountEl.textContent = formatCurrency(promotion.discount_amount);
        } else {
            discountEl.textContent = '-';
        }
        
        // Dates
        document.getElementById('view-valid-from').textContent = formatDate(promotion.valid_from);
        document.getElementById('view-valid-to').textContent = formatDate(promotion.valid_to);
        
        // Usage
        const usageText = promotion.usage_limit 
            ? `${promotion.used_count || 0} / ${promotion.usage_limit}`
            : `${promotion.used_count || 0} / ∞`;
        document.getElementById('view-usage').textContent = usageText;
        
        // Additional Details
        document.getElementById('view-usage-limit').textContent = promotion.usage_limit || 'Unlimited';
        document.getElementById('view-used-count').textContent = promotion.used_count || 0;
        document.getElementById('view-created-at').textContent = formatDateTime(promotion.created_at);
        document.getElementById('view-status').textContent = isActive ? 'Active' : 'Inactive';
    }

    /**
     * Format currency
     */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    /**
     * Format date
     */
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB');
    }

    /**
     * Format date time
     */
    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('en-GB');
    }

    /**
     * Edit promotion
     */
    window.editPromotion = function() {
        window.location.href = `promotion-edit.html?id=${currentPromotionId}`;
    };

    /**
     * Confirm delete promotion
     */
    window.confirmDeletePromotion = function() {
        console.log('Confirm delete promotion called');
        const modal = document.getElementById('delete-modal');
        
        if (!modal) {
            console.error('Delete modal not found!');
            return;
        }
        
        console.log('Modal found, showing...');
        
        // Remove inline style if exists and add show class
        modal.style.display = '';
        modal.classList.add('show');
        
        console.log('Modal classes:', modal.className);
        console.log('Modal display:', window.getComputedStyle(modal).display);
        
        const confirmBtn = document.getElementById('confirm-delete-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', function() {
            console.log('Confirm delete clicked');
            performDelete();
        });
        
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = function() {
                console.log('Close button clicked');
                closeDeleteModal();
            };
        }
        
        // Close on outside click
        setTimeout(() => {
            window.onclick = function(event) {
                if (event.target === modal) {
                    console.log('Outside click');
                    closeDeleteModal();
                }
            };
        }, 100);
    };

    /**
     * Perform delete
     */
    function performDelete() {
        const confirmBtn = document.getElementById('confirm-delete-btn');
        confirmBtn.disabled = true;
        
        // Clear and add spinner
        while (confirmBtn.firstChild) {
            confirmBtn.removeChild(confirmBtn.firstChild);
        }
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        confirmBtn.appendChild(spinner);
        confirmBtn.appendChild(document.createTextNode(' Deleting...'));

        fetch(`${API_BASE_URL}/api/admin/promotions/${currentPromotionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Promotion deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'promotions.html';
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to delete promotion');
            }
        })
        .catch(error => {
            console.error('Error deleting promotion:', error);
            showAlert(error.message || 'Failed to delete promotion', 'error');
            confirmBtn.disabled = false;
            
            // Reset button text
            while (confirmBtn.firstChild) {
                confirmBtn.removeChild(confirmBtn.firstChild);
            }
            confirmBtn.textContent = 'Delete Promotion';
        });
    }

    /**
     * Close delete modal
     */
    window.closeDeleteModal = function() {
        console.log('Closing modal');
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('show');
        window.onclick = null;
    };

})();

