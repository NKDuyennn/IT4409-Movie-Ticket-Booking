/**
 * Movies Management JavaScript - List View
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    // State management
    let currentPage = 1;
    let currentShowingFilter = '';
    let currentSearch = '';
    let allMovies = [];
    const itemsPerPage = 10;

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        loadMovies();
        setupFilters();
    });

    /**
     * Setup filters
     */
    function setupFilters() {
        const showingFilter = document.getElementById('showing-filter');
        const searchInput = document.getElementById('search-input');
        
        if (showingFilter) {
            showingFilter.addEventListener('change', function() {
                currentShowingFilter = this.value;
                currentPage = 1;
                loadMovies();
            });
        }
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentSearch = this.value;
                    currentPage = 1;
                    loadMovies();
                }, 500);
            });
        }
    }

    /**
     * Load all movies with filters
     */
    function loadMovies() {
        const loadingState = document.getElementById('loading-state');
        const tableContainer = document.getElementById('movies-table');
        const emptyState = document.getElementById('empty-state');

        loadingState.style.display = 'block';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';

        // Build query params
        let queryParams = `per_page=1000`;
        if (currentShowingFilter !== '') queryParams += `&is_showing=${currentShowingFilter}`;
        if (currentSearch) queryParams += `&search=${encodeURIComponent(currentSearch)}`;

        fetch(`${API_BASE_URL}/api/admin/movies?${queryParams}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data && result.data.length > 0) {
                allMovies = result.data;
                
                // Paginate
                const totalPages = Math.ceil(allMovies.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedMovies = allMovies.slice(startIndex, endIndex);
                
                if (paginatedMovies.length > 0) {
                    displayMovies(paginatedMovies);
                    displayPagination({
                        page: currentPage,
                        total_pages: totalPages,
                        total: allMovies.length,
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
            console.error('Error loading movies:', error);
            showAlert('Failed to load movies: ' + error.message, 'error');
        });
    }

    /**
     * Display movies in table
     */
    function displayMovies(movies) {
        const tbody = document.getElementById('movies-tbody');
        const template = document.getElementById('movie-row-template');
        tbody.innerHTML = '';

        movies.forEach(movie => {
            const clone = template.content.cloneNode(true);
            
            // Populate poster
            const posterCell = clone.querySelector('[data-field="poster"]');
            const posterUrl = movie.poster_url || '';
            if (posterUrl) {
                const posterImgTemplate = document.getElementById('poster-image-template');
                const posterClone = posterImgTemplate.content.cloneNode(true);
                const img = posterClone.querySelector('img');
                img.src = posterUrl.startsWith('/uploads') ? API_BASE_URL + posterUrl : posterUrl;
                img.alt = movie.title;
                posterCell.appendChild(posterClone);
            } else {
                const placeholderTemplate = document.getElementById('poster-placeholder-template');
                const placeholderClone = placeholderTemplate.content.cloneNode(true);
                placeholderClone.querySelector('[data-field="initial"]').textContent = movie.title.charAt(0);
                posterCell.appendChild(placeholderClone);
            }

            // Populate data
            clone.querySelector('[data-field="title"]').textContent = movie.title || '-';
            clone.querySelector('[data-field="genre"]').textContent = movie.genre || '-';
            clone.querySelector('[data-field="duration"]').textContent = movie.duration_minutes ? movie.duration_minutes + ' min' : '-';
            
            // Age rating with color
            const ageRatingEl = clone.querySelector('[data-field="age-rating"]');
            ageRatingEl.textContent = movie.age_rating || '-';
            ageRatingEl.style = getAgeRatingStyle(movie.age_rating);
            
            // Rating
            const ratingTemplate = document.getElementById('rating-template');
            const ratingClone = ratingTemplate.content.cloneNode(true);
            ratingClone.querySelector('[data-field="rating"]').textContent = movie.rating || '0.0';
            clone.querySelector('[data-field="rating"]').appendChild(ratingClone);
            
            // Status
            const statusEl = clone.querySelector('[data-field="status"]');
            const statusClass = movie.is_showing ? 'status-active' : 'status-inactive';
            const statusText = movie.is_showing ? 'Active' : 'Inactive';
            statusEl.className = `status-badge ${statusClass}`;
            statusEl.textContent = statusText;

            // Attach event listeners
            clone.querySelector('[data-action="view"]').addEventListener('click', () => viewMovie(movie.movie_id));
            clone.querySelector('[data-action="edit"]').addEventListener('click', () => editMovie(movie.movie_id));
            clone.querySelector('[data-action="delete"]').addEventListener('click', () => deleteMovie(movie.movie_id, movie.title));

            tbody.appendChild(clone);
        });
    }

    /**
     * Get age rating style
     */
    function getAgeRatingStyle(rating) {
        if (!rating || rating === '-') return 'background: rgba(107, 114, 128, 0.2); border: 1px solid rgba(107, 114, 128, 0.3); color: #9ca3af;';
        
        const ratingUpper = rating.toUpperCase();
        if (ratingUpper === 'G' || ratingUpper === 'P') {
            return 'background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981;';
        } else if (ratingUpper === 'PG' || ratingUpper === 'PG-13' || ratingUpper === 'T13' || ratingUpper === 'K' || ratingUpper === 'C13') {
            return 'background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6;';
        } else if (ratingUpper === 'R' || ratingUpper === 'NC-17' || ratingUpper === 'T16' || ratingUpper === 'C16') {
            return 'background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b;';
        } else if (ratingUpper === 'T18' || ratingUpper === 'C18' || ratingUpper === 'X') {
            return 'background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444;';
        }
        return 'background: rgba(107, 114, 128, 0.2); border: 1px solid rgba(107, 114, 128, 0.3); color: #9ca3af;';
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
        container.innerHTML = '';

        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';

        // Previous button
        if (pagination.has_prev) {
            const btnTemplate = document.getElementById('pagination-btn-template');
            const btnClone = btnTemplate.content.cloneNode(true);
            const btn = btnClone.querySelector('button');
            btn.innerHTML = '<i class="fas fa-chevron-left"></i>';
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
            btn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            btn.addEventListener('click', () => changePage(pagination.page + 1));
            paginationDiv.appendChild(btnClone);
        }

        // Info text
        const infoTemplate = document.getElementById('pagination-info-template');
        const infoClone = infoTemplate.content.cloneNode(true);
        const startItem = (pagination.page - 1) * itemsPerPage + 1;
        const endItem = Math.min(pagination.page * itemsPerPage, pagination.total);
        infoClone.querySelector('[data-field="info"]').textContent = `Showing ${startItem}-${endItem} of ${pagination.total} movies`;

        container.appendChild(paginationDiv);
        container.appendChild(infoClone);
    }

    /**
     * Change page
     */
    function changePage(page) {
        currentPage = page;
        loadMovies();
    }

    /**
     * View movie details
     */
    function viewMovie(movieId) {
        window.location.href = `movie-view.html?id=${movieId}`;
    }

    /**
     * Edit movie
     */
    function editMovie(movieId) {
        window.location.href = `movie-edit.html?id=${movieId}`;
    }

    /**
     * Delete movie
     */
    function deleteMovie(movieId, movieTitle) {
        const modal = document.getElementById('delete-modal');
        const titleEl = document.getElementById('delete-movie-title');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        
        titleEl.textContent = movieTitle;
        modal.classList.add('show');
        
        // Remove previous listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', function() {
            performDelete(movieId);
        });
        
        // Close button
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = closeDeleteModal;
        
        window.onclick = function(event) {
            if (event.target === modal) {
                closeDeleteModal();
            }
        };
    }

    /**
     * Perform delete operation
     */
    function performDelete(movieId) {
        const confirmBtn = document.getElementById('confirm-delete-btn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        fetch(`${API_BASE_URL}/api/admin/movies/${movieId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Movie deleted successfully', 'success');
                closeDeleteModal();
                loadMovies();
            } else {
                throw new Error(result.message || 'Failed to delete movie');
            }
        })
        .catch(error => {
            console.error('Error deleting movie:', error);
            showAlert(error.message || 'Failed to delete movie', 'error');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Delete Movie';
        });
    }

    /**
     * Close delete modal
     */
    function closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('show');
    }

    // Export to window for HTML onclick handlers if needed
    window.viewMovie = viewMovie;
    window.editMovie = editMovie;
    window.deleteMovie = deleteMovie;
    window.closeDeleteModal = closeDeleteModal;

})();
