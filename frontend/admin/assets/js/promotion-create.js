/**
 * Promotion Create JavaScript
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        setupForm();
        setupDiscountTypeToggle();
        setMinDate();
    });

    /**
     * Set minimum date to today
     */
    function setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('valid-from').setAttribute('min', today);
        document.getElementById('valid-to').setAttribute('min', today);
    }

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
     * Setup form submission
     */
    function setupForm() {
        const form = document.getElementById('promotion-form');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }
            
            createPromotion();
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
     * Create promotion
     */
    function createPromotion() {
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        
        // Clear and add spinner
        while (submitBtn.firstChild) {
            submitBtn.removeChild(submitBtn.firstChild);
        }
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin mr-1';
        submitBtn.appendChild(spinner);
        submitBtn.appendChild(document.createTextNode(' Creating...'));

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

        fetch(`${API_BASE_URL}/api/admin/promotions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(promotionData)
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Promotion created successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'promotions.html';
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to create promotion');
            }
        })
        .catch(error => {
            console.error('Error creating promotion:', error);
            showAlert(error.message || 'Failed to create promotion', 'error');
            submitBtn.disabled = false;
            
            // Reset button
            while (submitBtn.firstChild) {
                submitBtn.removeChild(submitBtn.firstChild);
            }
            const icon = document.createElement('i');
            icon.className = 'fas fa-save mr-1';
            submitBtn.appendChild(icon);
            submitBtn.appendChild(document.createTextNode(' Create Promotion'));
        });
    }

})();

