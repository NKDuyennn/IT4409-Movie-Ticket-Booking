/**
 * Showtime View JavaScript
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';
    let showtimeId = null;
    let showtimeData = null;

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

        loadShowtimeDetails();
        setupEventListeners();
    });

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        const editBtn = document.getElementById('edit-showtime-btn');
        const deleteBtn = document.getElementById('delete-showtime-btn');

        if (editBtn) {
            editBtn.addEventListener('click', function() {
                window.location.href = `showtime-edit.html?id=${showtimeId}`;
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                showDeleteModal();
            });
        }
    }

    /**
     * Load showtime details
     */
    function loadShowtimeDetails() {
        const loadingState = document.getElementById('loading-state');
        const detailsSection = document.getElementById('showtime-details');

        loadingState.style.display = 'flex';
        detailsSection.style.display = 'none';

        fetch(`${API_BASE_URL}/api/admin/showtimes/${showtimeId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data) {
                showtimeData = result.data;
                displayShowtimeDetails(result.data);
                detailsSection.style.display = 'block';
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
            showAlert('Failed to load showtime details: ' + error.message, 'error');
        });
    }

    /**
     * Display showtime details
     */
    function displayShowtimeDetails(showtime) {
        document.getElementById('showtime-movie').textContent = showtime.movie_title || '-';
        document.getElementById('showtime-cinema').textContent = showtime.cinema_name || '-';
        document.getElementById('showtime-screen').textContent = showtime.screen_name || '-';

        // Date and time
        if (showtime.show_datetime) {
            const dt = new Date(showtime.show_datetime);
            document.getElementById('showtime-date').textContent = dt.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('showtime-time').textContent = dt.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Price
        document.getElementById('showtime-price').textContent = formatCurrency(showtime.base_price);

        // Seats
        document.getElementById('showtime-seats').textContent = showtime.available_seats || 0;

        // Status
        const statusEl = document.getElementById('showtime-status');
        const status = showtime.status || 'SCHEDULED';
        statusEl.className = `status-badge-large status-${status.toLowerCase()}`;
        statusEl.textContent = status;
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
     * Show delete modal
     */
    function showDeleteModal() {
        const modal = document.getElementById('delete-modal');
        const infoBox = document.getElementById('delete-showtime-info');
        const confirmBtn = document.getElementById('confirm-delete-btn');

        if (!modal || !showtimeData) return;

        // Set showtime info
        if (infoBox && showtimeData.show_datetime) {
            const dt = new Date(showtimeData.show_datetime);
            infoBox.innerHTML = `
                <p><strong>Movie:</strong> ${showtimeData.movie_title}</p>
                <p><strong>Cinema:</strong> ${showtimeData.cinema_name}</p>
                <p><strong>Screen:</strong> ${showtimeData.screen_name}</p>
                <p><strong>Date & Time:</strong> ${dt.toLocaleString('en-GB')}</p>
            `;
        }

        // Show modal
        modal.classList.add('show');

        // Remove previous listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', function() {
            performDelete();
        });

        // Close button
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = function() {
                closeDeleteModal();
            };
        }

        // Close on outside click
        setTimeout(() => {
            window.onclick = function(event) {
                if (event.target === modal) {
                    closeDeleteModal();
                }
            };
        }, 100);
    }

    /**
     * Perform delete operation
     */
    function performDelete() {
        const confirmBtn = document.getElementById('confirm-delete-btn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        fetch(`${API_BASE_URL}/api/admin/showtimes/${showtimeId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Showtime deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'showtimes.html';
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to delete showtime');
            }
        })
        .catch(error => {
            console.error('Error deleting showtime:', error);
            showAlert(error.message || 'Failed to delete showtime', 'error');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Delete Showtime';
        });
    }

    /**
     * Close delete modal
     */
    window.closeDeleteModal = function() {
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('show');
        window.onclick = null;
    };

})();

