/**
 * Promotions Management JavaScript - List View
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    // State management
    let currentPage = 1;
    let currentActiveFilter = '';
    let currentSearch = '';
    let allPromotions = [];
    const itemsPerPage = 10;

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        loadPromotions();
        setupFilters();
    });

    /**
     * Setup filters
     */
    function setupFilters() {
        const activeFilter = document.getElementById('active-filter');
        const searchInput = document.getElementById('search-input');
        
        if (activeFilter) {
            activeFilter.addEventListener('change', function() {
                currentActiveFilter = this.value;
                currentPage = 1;
                loadPromotions();
            });
        }
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentSearch = this.value;
                    currentPage = 1;
                    loadPromotions();
                }, 500);
            });
        }
    }

    /**
     * Load all promotions with filters
     */
    function loadPromotions() {
        const loadingState = document.getElementById('loading-state');
        const tableContainer = document.getElementById('promotions-table');
        const emptyState = document.getElementById('empty-state');

        loadingState.style.display = 'block';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';

        // Build query params - only add if filter is selected
        let queryParams = '';
        if (currentActiveFilter !== '') {
            queryParams += `?is_active=${currentActiveFilter}`;
        }

        fetch(`${API_BASE_URL}/api/admin/promotions${queryParams}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data && result.data.length > 0) {
                allPromotions = result.data;
                
                // Apply search filter on client side
                let filteredPromotions = allPromotions;
                if (currentSearch) {
                    const searchLower = currentSearch.toLowerCase();
                    filteredPromotions = allPromotions.filter(promo => 
                        (promo.code && promo.code.toLowerCase().includes(searchLower)) ||
                        (promo.name && promo.name.toLowerCase().includes(searchLower))
                    );
                }
                
                // Paginate
                const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedPromotions = filteredPromotions.slice(startIndex, endIndex);
                
                if (paginatedPromotions.length > 0) {
                    displayPromotions(paginatedPromotions);
                    displayPagination({
                        page: currentPage,
                        total_pages: totalPages,
                        total: filteredPromotions.length,
                        has_prev: currentPage > 1,
                        has_next: currentPage < totalPages
                    });
                    tableContainer.style.display = 'block';
                } else {
                    emptyState.style.display = 'block';
                }
            } else {
                emptyState.style.display = 'block';
            }
        })
        .catch(error => {
            loadingState.style.display = 'none';
            console.error('Error loading promotions:', error);
            showAlert('Failed to load promotions: ' + error.message, 'error');
        });
    }

    /**
     * Display promotions in table
     */
    function displayPromotions(promotions) {
        const tbody = document.getElementById('promotions-tbody');
        const template = document.getElementById('promotion-row-template');
        
        // Clear existing rows
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        promotions.forEach(promotion => {
            const clone = template.content.cloneNode(true);
            
            // Populate data
            clone.querySelector('[data-field="code"]').textContent = promotion.code || '-';
            clone.querySelector('[data-field="name"]').textContent = promotion.name || '-';
            
            // Discount
            const discountEl = clone.querySelector('[data-field="discount"]');
            if (promotion.discount_percentage) {
                discountEl.textContent = promotion.discount_percentage + '%';
                discountEl.style.cssText = 'background: rgba(251, 191, 36, 0.2); color: #fbbf24; padding: 0.25rem 0.75rem; border-radius: 6px; font-weight: 600;';
            } else if (promotion.discount_amount) {
                discountEl.textContent = formatCurrency(promotion.discount_amount);
                discountEl.style.cssText = 'background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 6px; font-weight: 600;';
            } else {
                discountEl.textContent = '-';
            }
            
            // Dates
            clone.querySelector('[data-field="valid-from"]').textContent = formatDate(promotion.valid_from);
            clone.querySelector('[data-field="valid-to"]').textContent = formatDate(promotion.valid_to);
            
            // Usage
            const usageText = promotion.usage_limit 
                ? `${promotion.used_count || 0}/${promotion.usage_limit}`
                : `${promotion.used_count || 0}/∞`;
            clone.querySelector('[data-field="usage"]').textContent = usageText;
            
            // Status
            const statusEl = clone.querySelector('[data-field="status"]');
            const isActive = promotion.is_active;
            statusEl.className = isActive ? 'status-badge status-active' : 'status-badge status-inactive';
            statusEl.textContent = isActive ? 'Active' : 'Inactive';

            // Attach event listeners
            clone.querySelector('[data-action="view"]').addEventListener('click', () => viewPromotion(promotion.promotion_id));
            clone.querySelector('[data-action="edit"]').addEventListener('click', () => editPromotion(promotion.promotion_id));
            clone.querySelector('[data-action="delete"]').addEventListener('click', () => deletePromotion(promotion.promotion_id, promotion.code));

            tbody.appendChild(clone);
        });
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
     * Display pagination
     */
    function displayPagination(pagination) {
        const container = document.getElementById('pagination-container');
        
        if (!container || !pagination || pagination.total_pages <= 1) {
            if (container) container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        
        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';

        // Previous button
        if (pagination.has_prev) {
            const btnTemplate = document.getElementById('pagination-btn-template');
            const btnClone = btnTemplate.content.cloneNode(true);
            const btn = btnClone.querySelector('button');
            const icon = document.createElement('i');
            icon.className = 'fas fa-chevron-left';
            btn.appendChild(icon);
            btn.addEventListener('click', () => changePage(pagination.page - 1));
            paginationDiv.appendChild(btnClone);
        }

        // Page numbers
        for (let i = 1; i <= pagination.total_pages; i++) {
            if (i === pagination.page) {
                const btnTemplate = document.getElementById('pagination-btn-template');
                const btnClone = btnTemplate.content.cloneNode(true);
                const btn = btnClone.querySelector('button');
                btn.className = 'page-btn active';
                btn.textContent = i;
                paginationDiv.appendChild(btnClone);
            } else if (
                i === 1 || 
                i === pagination.total_pages || 
                (i >= pagination.page - 2 && i <= pagination.page + 2)
            ) {
                const btnTemplate = document.getElementById('pagination-btn-template');
                const btnClone = btnTemplate.content.cloneNode(true);
                const btn = btnClone.querySelector('button');
                btn.textContent = i;
                btn.addEventListener('click', () => changePage(i));
                paginationDiv.appendChild(btnClone);
            } else if (i === pagination.page - 3 || i === pagination.page + 3) {
                const dotsTemplate = document.getElementById('pagination-dots-template');
                const dotsClone = dotsTemplate.content.cloneNode(true);
                paginationDiv.appendChild(dotsClone);
            }
        }

        // Next button
        if (pagination.has_next) {
            const btnTemplate = document.getElementById('pagination-btn-template');
            const btnClone = btnTemplate.content.cloneNode(true);
            const btn = btnClone.querySelector('button');
            const icon = document.createElement('i');
            icon.className = 'fas fa-chevron-right';
            btn.appendChild(icon);
            btn.addEventListener('click', () => changePage(pagination.page + 1));
            paginationDiv.appendChild(btnClone);
        }

        // Info text
        const infoTemplate = document.getElementById('pagination-info-template');
        const infoClone = infoTemplate.content.cloneNode(true);
        const startItem = (pagination.page - 1) * itemsPerPage + 1;
        const endItem = Math.min(pagination.page * itemsPerPage, pagination.total);
        infoClone.querySelector('[data-field="info"]').textContent = `Showing ${startItem}-${endItem} of ${pagination.total} promotions`;

        container.appendChild(paginationDiv);
        container.appendChild(infoClone);
    }

    /**
     * Change page
     */
    function changePage(page) {
        currentPage = page;
        loadPromotions();
    }

    /**
     * View promotion details
     */
    function viewPromotion(promotionId) {
        window.location.href = `promotion-view.html?id=${promotionId}`;
    }

    /**
     * Edit promotion
     */
    function editPromotion(promotionId) {
        window.location.href = `promotion-edit.html?id=${promotionId}`;
    }

    /**
     * Delete promotion
     */
    function deletePromotion(promotionId, promotionCode) {
        console.log('Delete promotion called:', promotionId, promotionCode);
        const modal = document.getElementById('delete-modal');
        const codeEl = document.getElementById('delete-promotion-code');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        
        if (!modal) {
            console.error('Delete modal not found!');
            return;
        }
        
        console.log('Modal found, showing...');
        
        // Set promotion code
        if (codeEl) {
            codeEl.textContent = promotionCode;
        }
        
        // Remove inline style if exists and add show class
        modal.style.display = '';
        modal.classList.add('show');
        
        console.log('Modal classes:', modal.className);
        console.log('Modal display:', window.getComputedStyle(modal).display);
        
        // Remove previous listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', function() {
            console.log('Confirm delete clicked');
            performDelete(promotionId);
        });
        
        // Close button
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
    }

    /**
     * Perform delete operation
     */
    function performDelete(promotionId) {
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

        fetch(`${API_BASE_URL}/api/admin/promotions/${promotionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Promotion deleted successfully', 'success');
                closeDeleteModal();
                loadPromotions();
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
    function closeDeleteModal() {
        console.log('Closing modal');
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('show');
        window.onclick = null;
    }

    // Export to window for HTML onclick handlers if needed
    window.viewPromotion = viewPromotion;
    window.editPromotion = editPromotion;
    window.deletePromotion = deletePromotion;
    window.closeDeleteModal = closeDeleteModal;

})();

