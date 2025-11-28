/**
 * Cinema Edit JavaScript
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    let cinemaId = null;

    /**
     * Get cinema ID from URL
     */
    function getCinemaId() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('id'));
    }

    /**
     * Load cinema data and populate form
     */
    function loadCinemaData() {
        const loadingState = document.getElementById('loading-state');
        const formSection = document.getElementById('edit-form-section');

        loadingState.style.display = 'block';
        formSection.style.display = 'none';

        fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data) {
                populateForm(result.data);
                formSection.style.display = 'block';
            } else {
                showAlert('Cinema not found', 'error');
                setTimeout(() => window.location.href = 'cinemas.html', 1500);
            }
        })
        .catch(error => {
            loadingState.style.display = 'none';
            showAlert('Error loading cinema: ' + error.message, 'error');
        });
    }

    /**
     * Populate form with cinema data
     */
    function populateForm(cinema) {
        document.getElementById('cinema-name').value = cinema.name || '';
        document.getElementById('cinema-address').value = cinema.address || '';
        document.getElementById('cinema-city').value = cinema.city || '';
        document.getElementById('cinema-phone').value = cinema.phone_number || '';
        document.getElementById('cinema-latitude').value = cinema.latitude || '';
        document.getElementById('cinema-longitude').value = cinema.longitude || '';
    }

    /**
     * Submit form - Update cinema
     */
    function submitForm(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Updating...';

        // Collect form data
        const cinemaData = {
            name: document.getElementById('cinema-name').value.trim(),
            address: document.getElementById('cinema-address').value.trim(),
            city: document.getElementById('cinema-city').value,
            phone_number: document.getElementById('cinema-phone').value.trim() || null,
            latitude: parseFloat(document.getElementById('cinema-latitude').value) || null,
            longitude: parseFloat(document.getElementById('cinema-longitude').value) || null
        };

        // Validate
        if (!cinemaData.name) {
            showAlert('Cinema name is required', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa fa-check"></i> Update Cinema';
            return;
        }

        if (!cinemaData.address) {
            showAlert('Address is required', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa fa-check"></i> Update Cinema';
            return;
        }

        if (!cinemaData.city) {
            showAlert('City is required', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa fa-check"></i> Update Cinema';
            return;
        }

        // API call
        fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(cinemaData)
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Cinema updated successfully!', 'success');
                setTimeout(() => {
                    window.location.href = `cinema-view.html?id=${cinemaId}`;
                }, 1500);
            } else {
                showAlert(result.message || 'Failed to update cinema', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa fa-check"></i> Update Cinema';
            }
        })
        .catch(error => {
            showAlert('Error: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa fa-check"></i> Update Cinema';
        });
    }

    /**
     * Initialize page
     */
    function init() {
        if (!isAuthenticated()) {
            redirectToLogin();
            return;
        }

        cinemaId = getCinemaId();

        if (!cinemaId) {
            showAlert('Cinema ID not provided', 'error');
            setTimeout(() => window.location.href = 'cinemas.html', 1500);
            return;
        }

        loadCinemaData();

        // Setup form submission
        const form = document.getElementById('cinema-edit-form');
        if (form) {
            form.addEventListener('submit', submitForm);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
