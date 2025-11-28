/**
 * Cinemas Management JavaScript - List View
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    let currentPage = 1;
    let currentCity = '';
    let currentSearch = '';

    let allCinemas = [];
    const itemsPerPage = 10;

    /**
     * Load all cinemas with filters and pagination
     */
    function loadCinemas(page = 1, city = '', search = '') {
        const loadingState = document.getElementById('loading-state');
        const tableContainer = document.getElementById('cinemas-table');
        const emptyState = document.getElementById('empty-state');

        // Show loading
        loadingState.style.display = 'block';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';

        // API call - get all cinemas (set per_page to large number to get all)
        fetch(`${API_BASE_URL}/api/admin/cinemas?per_page=1000`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data && result.data.length > 0) {
                // Store all cinemas
                allCinemas = result.data;
                
                // Apply filters
                let filteredCinemas = allCinemas;
                
                if (city) {
                    filteredCinemas = filteredCinemas.filter(c => c.city === city);
                }
                
                if (search) {
                    const searchLower = search.toLowerCase();
                    filteredCinemas = filteredCinemas.filter(c => 
                        c.name.toLowerCase().includes(searchLower) ||
                        (c.address && c.address.toLowerCase().includes(searchLower)) ||
                        (c.city && c.city.toLowerCase().includes(searchLower))
                    );
                }
                
                // Paginate
                const totalPages = Math.ceil(filteredCinemas.length / itemsPerPage);
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedCinemas = filteredCinemas.slice(startIndex, endIndex);
                
                if (paginatedCinemas.length > 0) {
                    displayCinemas(paginatedCinemas);
                    
                    console.log('Total pages:', totalPages, 'Current page:', page, 'Total items:', filteredCinemas.length);
                    
                    displayPagination({
                        page: page,
                        total_pages: totalPages,
                        total: filteredCinemas.length,
                        has_prev: page > 1,
                        has_next: page < totalPages
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
            emptyState.style.display = 'block';
            showAlert('Error loading cinemas: ' + error.message, 'error');
        });
    }

    /**
     * Display cinemas in table
     */
    function displayCinemas(cinemas) {
        const tbody = document.getElementById('cinemas-tbody');
        const template = document.getElementById('cinema-row-template');
        tbody.innerHTML = '';

        cinemas.forEach(cinema => {
            const clone = template.content.cloneNode(true);
            const row = clone.querySelector('tr');

            // Populate data
            clone.querySelector('[data-field="name"]').textContent = cinema.name;
            clone.querySelector('[data-field="city"]').textContent = cinema.city || '-';
            clone.querySelector('[data-field="address"]').textContent = cinema.address || '-';
            clone.querySelector('[data-field="phone"]').textContent = cinema.phone_number || '-';
            clone.querySelector('[data-field="screen_count"]').textContent = `${cinema.screen_count || 0} screens`;

            // Attach event listeners
            clone.querySelector('[data-action="view"]').addEventListener('click', () => viewCinema(cinema.cinema_id));
            clone.querySelector('[data-action="edit"]').addEventListener('click', () => editCinema(cinema.cinema_id));
            clone.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCinema(cinema.cinema_id, cinema.name));

            tbody.appendChild(clone);
        });
    }

    /**
     * Display pagination
     */
    function displayPagination(pagination) {
        const container = document.getElementById('pagination-container');
        
        console.log('Pagination container:', container);
        console.log('Pagination data:', pagination);
        
        if (!container) {
            console.error('Pagination container not found!');
            return;
        }
        
        if (!pagination || pagination.total_pages <= 1) {
            console.log('Hiding pagination - only 1 page or no pagination data');
            container.style.display = 'none';
            return;
        }

        console.log('Showing pagination with', pagination.total_pages, 'pages');
        container.style.display = 'flex';
        container.innerHTML = '';

        // Create pagination wrapper
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';

        // Previous button
        if (pagination.has_prev) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', () => changePage(pagination.page - 1));
            paginationDiv.appendChild(prevBtn);
        }

        // Page numbers
        for (let i = 1; i <= pagination.total_pages; i++) {
            if (i === pagination.page) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn active';
                pageBtn.textContent = i;
                paginationDiv.appendChild(pageBtn);
            } else if (
                i === 1 || 
                i === pagination.total_pages || 
                (i >= pagination.page - 2 && i <= pagination.page + 2)
            ) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn';
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => changePage(i));
                paginationDiv.appendChild(pageBtn);
            } else if (i === pagination.page - 3 || i === pagination.page + 3) {
                const dots = document.createElement('span');
                dots.className = 'page-dots';
                dots.textContent = '...';
                paginationDiv.appendChild(dots);
            }
        }

        // Next button
        if (pagination.has_next) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', () => changePage(pagination.page + 1));
            paginationDiv.appendChild(nextBtn);
        }

        // Info text
        const infoDiv = document.createElement('div');
        infoDiv.className = 'pagination-info';
        const startItem = (pagination.page - 1) * itemsPerPage + 1;
        const endItem = Math.min(pagination.page * itemsPerPage, pagination.total);
        infoDiv.textContent = `Showing ${startItem}-${endItem} of ${pagination.total} cinemas`;

        container.appendChild(paginationDiv);
        container.appendChild(infoDiv);
    }

    /**
     * Change page
     */
    function changePage(page) {
        currentPage = page;
        loadCinemas(currentPage, currentCity, currentSearch);
    }

    /**
     * View cinema details
     */
    function viewCinema(cinemaId) {
        window.location.href = `cinema-view.html?id=${cinemaId}`;
    }

    /**
     * Edit cinema
     */
    function editCinema(cinemaId) {
        window.location.href = `cinema-edit.html?id=${cinemaId}`;
    }

    /**
     * Delete cinema
     */
    function deleteCinema(cinemaId, cinemaName) {
        if (!confirm(`Are you sure you want to delete "${cinemaName}"?\n\nThis will also delete all associated screens and seats. This action cannot be undone.`)) {
            return;
        }

        fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Cinema deleted successfully', 'success');
                loadCinemas(currentPage, currentCity, currentSearch);
            } else {
                showAlert(result.message || 'Failed to delete cinema', 'error');
            }
        })
        .catch(error => {
            showAlert('Error deleting cinema: ' + error.message, 'error');
        });
    }

    /**
     * Load unique cities for filter
     */
    function loadCities() {
        const cityFilter = document.getElementById('city-filter');
        
        // For now, use static list. Can be made dynamic later
        const cities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentSearch = this.value.trim();
                    currentPage = 1;
                    loadCinemas(currentPage, currentCity, currentSearch);
                }, 500);
            });
        }

        // City filter
        const cityFilter = document.getElementById('city-filter');
        if (cityFilter) {
            cityFilter.addEventListener('change', function() {
                currentCity = this.value;
                currentPage = 1;
                loadCinemas(currentPage, currentCity, currentSearch);
            });
        }
    }

    /**
     * Initialize page
     */
    function init() {
        if (!isAuthenticated()) {
            redirectToLogin();
            return;
        }

        loadCities();
        setupEventListeners();
        loadCinemas(currentPage, currentCity, currentSearch);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
