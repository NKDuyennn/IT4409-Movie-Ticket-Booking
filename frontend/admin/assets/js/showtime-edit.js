/**
 * Showtime Edit JavaScript
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';
    let showtimeId = null;
    let originalData = null;

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        // Get showtime ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        showtimeId = urlParams.get('id');

        if (!showtimeId) {
            showAlert('Showtime ID not found', 'error');
            setTimeout(() => {
                window.location.href = 'showtimes.html';
            }, 1500);
            return;
        }

        document.getElementById('showtime-id').value = showtimeId;
        loadShowtimeData();
        setupEventListeners();
    });

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        const form = document.getElementById('showtime-form');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }
    }

    /**
     * Load showtime data
     */
    function loadShowtimeData() {
        const loadingState = document.getElementById('loading-state');
        const editForm = document.getElementById('edit-form');

        loadingState.style.display = 'flex';
        editForm.style.display = 'none';

        fetch(`${API_BASE_URL}/api/admin/showtimes/${showtimeId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data) {
                originalData = result.data;
                populateForm(result.data);
                editForm.style.display = 'block';
            } else {
                showAlert('Showtime not found', 'error');
                setTimeout(() => {
                    window.location.href = 'showtimes.html';
                }, 1500);
            }
        })
        .catch(error => {
            loadingState.style.display = 'none';
            console.error('Error loading showtime:', error);
            showAlert('Failed to load showtime data: ' + error.message, 'error');
        });
    }

    /**
     * Populate form with showtime data
     */
    function populateForm(showtime) {
        // Parse show_datetime
        if (showtime.show_datetime) {
            const dt = new Date(showtime.show_datetime);
            
            // Set date
            const dateInput = document.getElementById('show-date');
            if (dateInput) {
                const year = dt.getFullYear();
                const month = String(dt.getMonth() + 1).padStart(2, '0');
                const day = String(dt.getDate()).padStart(2, '0');
                dateInput.value = `${year}-${month}-${day}`;
            }

            // Set time
            const timeSelect = document.getElementById('show-time');
            if (timeSelect) {
                const hours = String(dt.getHours()).padStart(2, '0');
                const minutes = String(dt.getMinutes()).padStart(2, '0');
                const timeValue = `${hours}:${minutes}`;
                
                // Try to match with predefined times
                let found = false;
                for (let option of timeSelect.options) {
                    if (option.value === timeValue) {
                        option.selected = true;
                        found = true;
                        break;
                    }
                }

                // If not found, add custom option
                if (!found && timeValue !== '00:00') {
                    const customOption = document.createElement('option');
                    customOption.value = timeValue;
                    customOption.textContent = timeValue;
                    customOption.selected = true;
                    timeSelect.appendChild(customOption);
                }
            }
        }

        // Set price
        const priceInput = document.getElementById('base-price');
        if (priceInput && showtime.base_price) {
            priceInput.value = parseFloat(showtime.base_price);
        }

        // Set status
        const statusSelect = document.getElementById('status');
        if (statusSelect && showtime.status) {
            statusSelect.value = showtime.status;
        }

        // Display current info (read-only)
        document.getElementById('current-movie').textContent = showtime.movie_title || '-';
        document.getElementById('current-cinema').textContent = showtime.cinema_name || '-';
        document.getElementById('current-screen').textContent = showtime.screen_name || '-';
        document.getElementById('current-seats').textContent = showtime.available_seats || 0;
    }

    /**
     * Handle form submission
     */
    function handleFormSubmit(event) {
        event.preventDefault();

        const date = document.getElementById('show-date').value;
        const time = document.getElementById('show-time').value;
        const price = document.getElementById('base-price').value;
        const status = document.getElementById('status').value;

        // Validate inputs
        if (!date || !time || !price) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }

        // Parse date and time
        const [year, month, day] = date.split('-');
        const [hours, minutes] = time.split(':');
        const showDatetime = new Date(year, month - 1, day, hours, minutes);

        // Prepare data
        const formData = {
            show_datetime: showDatetime.toISOString(),
            base_price: parseFloat(price),
            status: status
        };

        // Submit update
        submitUpdate(formData);
    }

    /**
     * Submit update to API
     */
    function submitUpdate(data) {
        const submitBtn = document.querySelector('#showtime-form button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        fetch(`${API_BASE_URL}/api/admin/showtimes/${showtimeId}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Showtime updated successfully', 'success');
                setTimeout(() => {
                    window.location.href = `showtime-view.html?id=${showtimeId}`;
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to update showtime');
            }
        })
        .catch(error => {
            console.error('Error updating showtime:', error);
            showAlert(error.message || 'Failed to update showtime', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Showtime';
        });
    }

})();

