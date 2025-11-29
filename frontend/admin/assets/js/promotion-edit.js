/**
 * Promotion Edit JavaScript
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
        
        setupForm();
        setupDiscountTypeToggle();
        loadPromotion();
    });

    /**
     * Setup discount type toggle
     */
    function setupDiscountTypeToggle() {
        const discountType = document.getElementById('discount-type');
        const percentageGroup = document.getElementById('percentage-group');
        const amountGroup = document.getElementById('amount-group');
        const percentageInput = document.getElementById('discount-percentage');
        const amountInput = document.getElementById('discount-amount');

        discountType.addEventListener('change', function() {
            if (this.value === 'percentage') {
                percentageGroup.style.display = 'block';
                amountGroup.style.display = 'none';
                percentageInput.required = true;
                amountInput.required = false;
                amountInput.value = '';
            } else {
                percentageGroup.style.display = 'none';
                amountGroup.style.display = 'block';
                percentageInput.required = false;
                amountInput.required = true;
                percentageInput.value = '';
            }
        });
    }

    /**
     * Load promotion details
     */
    function loadPromotion() {
        const loadingState = document.getElementById('page-loading-state');
        const formContainer = document.getElementById('edit-form-container');

        loadingState.style.display = 'flex';
        formContainer.style.display = 'none';

        fetch(`${API_BASE_URL}/api/admin/promotions/${currentPromotionId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data) {
                populateForm(result.data);
                formContainer.style.display = 'block';
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
     * Populate form with promotion data
     */
    function populateForm(promotion) {
        document.getElementById('promotion-id').value = promotion.promotion_id;
        document.getElementById('promotion-code').value = promotion.code || '';
        document.getElementById('promotion-name').value = promotion.name || '';
        document.getElementById('promotion-description').value = promotion.description || '';
        
        // Set discount type and value
        const discountType = document.getElementById('discount-type');
        const percentageGroup = document.getElementById('percentage-group');
        const amountGroup = document.getElementById('amount-group');
        const percentageInput = document.getElementById('discount-percentage');
        const amountInput = document.getElementById('discount-amount');
        
        if (promotion.discount_percentage) {
            discountType.value = 'percentage';
            percentageInput.value = promotion.discount_percentage;
            percentageGroup.style.display = 'block';
            amountGroup.style.display = 'none';
            percentageInput.required = true;
            amountInput.required = false;
        } else if (promotion.discount_amount) {
            discountType.value = 'amount';
            amountInput.value = promotion.discount_amount;
            percentageGroup.style.display = 'none';
            amountGroup.style.display = 'block';
            percentageInput.required = false;
            amountInput.required = true;
        }
        
        // Dates
        document.getElementById('valid-from').value = promotion.valid_from || '';
        document.getElementById('valid-to').value = promotion.valid_to || '';
        
        // Usage limit
        document.getElementById('usage-limit').value = promotion.usage_limit || '';
        
        // Status
        document.getElementById('is-active').value = promotion.is_active ? 'true' : 'false';
    }

    /**
     * Setup form submission
     */
    function setupForm() {
        const form = document.getElementById('promotion-form');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }
            
            updatePromotion();
        });

        // Auto-uppercase code input
        const codeInput = document.getElementById('promotion-code');
        codeInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }

    /**
     * Validate form
     */
    function validateForm() {
        const validFrom = new Date(document.getElementById('valid-from').value);
        const validTo = new Date(document.getElementById('valid-to').value);
        
        if (validTo < validFrom) {
            showAlert('End date must be after start date', 'error');
            return false;
        }
        
        const discountType = document.getElementById('discount-type').value;
        const percentageInput = document.getElementById('discount-percentage');
        const amountInput = document.getElementById('discount-amount');
        
        if (discountType === 'percentage') {
            const percentage = parseFloat(percentageInput.value);
            if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
                showAlert('Discount percentage must be between 0 and 100', 'error');
                return false;
            }
        } else {
            const amount = parseFloat(amountInput.value);
            if (isNaN(amount) || amount <= 0) {
                showAlert('Discount amount must be greater than 0', 'error');
                return false;
            }
        }
        
        return true;
    }

    /**
     * Update promotion
     */
    function updatePromotion() {
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        
        // Clear and add spinner
        while (submitBtn.firstChild) {
            submitBtn.removeChild(submitBtn.firstChild);
        }
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin mr-1';
        submitBtn.appendChild(spinner);
        submitBtn.appendChild(document.createTextNode(' Saving...'));

        const discountType = document.getElementById('discount-type').value;
        const usageLimit = document.getElementById('usage-limit').value;
        
        const promotionData = {
            code: document.getElementById('promotion-code').value.toUpperCase(),
            name: document.getElementById('promotion-name').value,
            description: document.getElementById('promotion-description').value || null,
            discount_percentage: discountType === 'percentage' ? parseFloat(document.getElementById('discount-percentage').value) : null,
            discount_amount: discountType === 'amount' ? parseFloat(document.getElementById('discount-amount').value) : null,
            valid_from: document.getElementById('valid-from').value,
            valid_to: document.getElementById('valid-to').value,
            usage_limit: usageLimit ? parseInt(usageLimit) : null,
            is_active: document.getElementById('is-active').value === 'true'
        };

        fetch(`${API_BASE_URL}/api/admin/promotions/${currentPromotionId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(promotionData)
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Promotion updated successfully', 'success');
                setTimeout(() => {
                    window.location.href = `promotion-view.html?id=${currentPromotionId}`;
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to update promotion');
            }
        })
        .catch(error => {
            console.error('Error updating promotion:', error);
            showAlert(error.message || 'Failed to update promotion', 'error');
            submitBtn.disabled = false;
            
            // Reset button
            while (submitBtn.firstChild) {
                submitBtn.removeChild(submitBtn.firstChild);
            }
            const icon = document.createElement('i');
            icon.className = 'fas fa-save mr-1';
            submitBtn.appendChild(icon);
            submitBtn.appendChild(document.createTextNode(' Save Changes'));
        });
    }

})();

