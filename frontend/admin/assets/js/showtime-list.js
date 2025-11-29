/**
 * Showtimes Management JavaScript - List View
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    // State management
    let currentPage = 1;
    let currentMovieFilter = '';
    let currentCinemaFilter = '';
    let currentDateFilter = '';
    let allShowtimes = [];
    const itemsPerPage = 10;

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        loadShowtimes();
        loadFilterOptions();
        setupFilters();
    });

    /**
     * Setup filters
     */
    function setupFilters() {
        const movieFilter = document.getElementById('movie-filter');
        const cinemaFilter = document.getElementById('cinema-filter');
        const dateFilter = document.getElementById('date-filter');
        
        if (movieFilter) {
            movieFilter.addEventListener('change', function() {
                currentMovieFilter = this.value;
                currentPage = 1;
                loadShowtimes();
            });
        }
        
        if (cinemaFilter) {
            cinemaFilter.addEventListener('change', function() {
                currentCinemaFilter = this.value;
                currentPage = 1;
                loadShowtimes();
            });
        }
        
        if (dateFilter) {
            dateFilter.addEventListener('change', function() {
                currentDateFilter = this.value;
                currentPage = 1;
                loadShowtimes();
            });
        }
    }

    /**
     * Load filter options
     */
    function loadFilterOptions() {
        // Load movies for filter
        fetch(`${API_BASE_URL}/api/admin/movies?is_showing=true`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success && result.data) {
                const movieFilter = document.getElementById('movie-filter');
                if (movieFilter) {
                    result.data.forEach(movie => {
                        const option = document.createElement('option');
                        option.value = movie.movie_id;
                        option.textContent = movie.title;
                        movieFilter.appendChild(option);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error loading movies:', error);
        });

        // Load cinemas for filter
        fetch(`${API_BASE_URL}/api/admin/cinemas`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success && result.data) {
                const cinemaFilter = document.getElementById('cinema-filter');
                if (cinemaFilter) {
                    result.data.forEach(cinema => {
                        const option = document.createElement('option');
                        option.value = cinema.cinema_id;
                        option.textContent = cinema.name;
                        cinemaFilter.appendChild(option);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error loading cinemas:', error);
        });
    }

    /**
     * Load all showtimes with filters
     */
    function loadShowtimes() {
        const loadingState = document.getElementById('loading-state');
        const tableContainer = document.getElementById('showtimes-table');
        const emptyState = document.getElementById('empty-state');

        loadingState.style.display = 'block';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';

        // Build query params
        const params = new URLSearchParams();
        if (currentMovieFilter) {
            params.append('movie_id', currentMovieFilter);
        }
        if (currentCinemaFilter) {
            params.append('cinema_id', currentCinemaFilter);
        }
        if (currentDateFilter) {
            params.append('show_date', currentDateFilter);
        }

        const queryString = params.toString();
        const url = `${API_BASE_URL}/api/admin/showtimes${queryString ? '?' + queryString : ''}`;

        fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data && result.data.length > 0) {
                allShowtimes = result.data;
                
                // Paginate
                const totalPages = Math.ceil(allShowtimes.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedShowtimes = allShowtimes.slice(startIndex, endIndex);
                
                displayShowtimes(paginatedShowtimes);
                displayPagination({
                    page: currentPage,
                    total_pages: totalPages,
                    total: allShowtimes.length,
                    has_prev: currentPage > 1,
                    has_next: currentPage < totalPages
                });
                tableContainer.style.display = 'block';
            } else {
                emptyState.style.display = 'block';
            }
        })
        .catch(error => {
            loadingState.style.display = 'none';
            console.error('Error loading showtimes:', error);
            showAlert('Failed to load showtimes: ' + error.message, 'error');
        });
    }

    /**
     * Display showtimes in table
     */
    function displayShowtimes(showtimes) {
        const tbody = document.getElementById('showtimes-tbody');
        const template = document.getElementById('showtime-row-template');
        
        // Clear existing rows
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        showtimes.forEach(showtime => {
            const clone = template.content.cloneNode(true);
            
            // Populate data
            clone.querySelector('[data-field="movie"]').textContent = showtime.movie_title || '-';
            clone.querySelector('[data-field="cinema"]').textContent = showtime.cinema_name || '-';
            clone.querySelector('[data-field="screen"]').textContent = showtime.screen_name || '-';
            
            // Date and time
            if (showtime.show_datetime) {
                const dt = new Date(showtime.show_datetime);
                clone.querySelector('[data-field="date"]').textContent = dt.toLocaleDateString('en-GB');
                clone.querySelector('[data-field="time"]').textContent = dt.toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else {
                clone.querySelector('[data-field="date"]').textContent = '-';
                clone.querySelector('[data-field="time"]').textContent = '-';
            }
            
            // Price
            const priceEl = clone.querySelector('[data-field="price"]');
            priceEl.textContent = formatCurrency(showtime.base_price);
            
            // Available seats
            const seatsEl = clone.querySelector('[data-field="seats"]');
            seatsEl.textContent = showtime.available_seats || 0;
            
            // Status
            const statusEl = clone.querySelector('[data-field="status"]');
            const status = showtime.status || 'SCHEDULED';
            statusEl.className = `status-badge status-${status.toLowerCase()}`;
            statusEl.textContent = status;

            // Attach event listeners
            const viewBtn = clone.querySelector('[data-action="view"]');
            const editBtn = clone.querySelector('[data-action="edit"]');
            const deleteBtn = clone.querySelector('[data-action="delete"]');

            if (viewBtn) {
                viewBtn.addEventListener('click', () => viewShowtime(showtime));
            }
            if (editBtn) {
                editBtn.addEventListener('click', () => editShowtime(showtime));
            }
            if (deleteBtn) {
                // Hide delete button for COMPLETED showtimes
                if (status === 'COMPLETED') {
                    deleteBtn.style.display = 'none';
                } else {
                    deleteBtn.addEventListener('click', () => deleteShowtime(showtime));
                }
            }

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
        infoClone.querySelector('[data-field="info"]').textContent = `Showing ${startItem}-${endItem} of ${pagination.total} showtimes`;

        container.appendChild(paginationDiv);
        container.appendChild(infoClone);
    }

    /**
     * Change page
     */
    function changePage(page) {
        currentPage = page;
        loadShowtimes();
    }

    /**
     * View showtime
     */
    function viewShowtime(showtime) {
        window.location.href = `showtime-view.html?id=${showtime.showtime_id}`;
    }

    /**
     * Edit showtime
     */
    function editShowtime(showtime) {
        window.location.href = `showtime-edit.html?id=${showtime.showtime_id}`;
    }

    /**
     * Delete showtime
     */
    function deleteShowtime(showtime) {
        const modal = document.getElementById('delete-modal');
        const infoBox = document.getElementById('delete-showtime-info');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        
        if (!modal) {
            console.error('Delete modal not found!');
            return;
        }
        
        // Set showtime info
        if (infoBox) {
            const dt = new Date(showtime.show_datetime);
            infoBox.innerHTML = `
                <p><strong>Movie:</strong> ${showtime.movie_title}</p>
                <p><strong>Cinema:</strong> ${showtime.cinema_name}</p>
                <p><strong>Screen:</strong> ${showtime.screen_name}</p>
                <p><strong>Date & Time:</strong> ${dt.toLocaleString('en-GB')}</p>
            `;
        }
        
        // Show modal
        modal.style.display = '';
        modal.classList.add('show');
        
        // Remove previous listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', function() {
            performDelete(showtime.showtime_id);
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
    function performDelete(showtimeId) {
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

        fetch(`${API_BASE_URL}/api/admin/showtimes/${showtimeId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Showtime deleted successfully', 'success');
                closeDeleteModal();
                loadShowtimes();
            } else {
                throw new Error(result.message || 'Failed to delete showtime');
            }
        })
        .catch(error => {
            console.error('Error deleting showtime:', error);
            showAlert(error.message || 'Failed to delete showtime', 'error');
            confirmBtn.disabled = false;
            
            // Reset button text
            while (confirmBtn.firstChild) {
                confirmBtn.removeChild(confirmBtn.firstChild);
            }
            confirmBtn.textContent = 'Delete Showtime';
        });
    }

    /**
     * Close delete modal
     */
    function closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('show');
        window.onclick = null;
    }

    // Export to window for HTML onclick handlers if needed
    window.closeDeleteModal = closeDeleteModal;

})();

