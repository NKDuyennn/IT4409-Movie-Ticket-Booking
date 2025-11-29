/**
 * Showtime Create JavaScript
 * Single page form: Movie -> Date -> Cinema -> Screen -> Time Slots
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    // Fixed time slots (spaced 2-3 hours apart)
    const TIME_SLOTS = ['09:00', '12:00', '15:00', '18:00', '21:00'];

    // State management
    const state = {
        selectedMovie: null,
        selectedDate: null,
        selectedCinema: null,
        selectedScreen: null,
        selectedTimes: [],
        movies: [],
        cinemas: [],
        screens: []
    };

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        loadMovies();
        loadCinemas();
        setupEventListeners();
    });

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Date picker
        const datePicker = document.getElementById('show-date-picker');
        if (datePicker) {
            // Set min date to today
            const today = new Date().toISOString().split('T')[0];
            datePicker.min = today;
            
            datePicker.addEventListener('change', function() {
                state.selectedDate = this.value;
                checkFormCompletion();
            });
        }

        // Create showtimes button
        const btnCreate = document.getElementById('btn-create-showtimes');
        if (btnCreate) {
            btnCreate.addEventListener('click', createShowtimes);
        }
    }

    /**
     * Load movies (only showing movies)
     */
    function loadMovies() {
        const loadingState = document.getElementById('movies-loading');
        const moviesScroll = document.getElementById('movies-scroll');
        const emptyState = document.getElementById('movies-empty');

        loadingState.style.display = 'flex';
        if (moviesScroll) moviesScroll.style.display = 'none';
        emptyState.style.display = 'none';

        fetch(`${API_BASE_URL}/api/admin/movies?is_showing=true`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data && result.data.length > 0) {
                state.movies = result.data;
                displayMovies(result.data);
                if (moviesScroll) moviesScroll.style.display = 'block';
            } else {
                emptyState.style.display = 'flex';
            }
        })
        .catch(error => {
            loadingState.style.display = 'none';
            console.error('Error loading movies:', error);
            showAlert('Failed to load movies: ' + error.message, 'error');
        });
    }

    /**
     * Display movies in horizontal scroll
     */
    function displayMovies(movies) {
        const container = document.getElementById('movies-container');
        const template = document.getElementById('movie-card-template');
        
        container.innerHTML = '';

        movies.forEach(movie => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.movie-card');
            
            card.dataset.movieId = movie.movie_id;
            
            // Poster
            const posterEl = clone.querySelector('[data-field="poster"]');
            const posterImage = movie.poster_url || (movie.images && movie.images[0] && movie.images[0].image_url);
            if (posterImage) {
                const img = document.createElement('img');
                img.src = posterImage;
                img.alt = movie.title;
                posterEl.appendChild(img);
            } else {
                const initial = document.createElement('div');
                initial.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:48px;font-weight:bold;';
                initial.textContent = movie.title.charAt(0);
                posterEl.appendChild(initial);
            }
            
            // Title
            clone.querySelector('[data-field="title"]').textContent = movie.title;
            
            // Age rating
            clone.querySelector('[data-field="age-rating"]').textContent = movie.age_rating || 'P';
            
            // Duration
            clone.querySelector('[data-field="duration"]').textContent = `${movie.duration_minutes} min`;
            
            // Rating
            const ratingEl = clone.querySelector('[data-field="rating"]');
            ratingEl.innerHTML = `<i class="fas fa-star"></i> ${movie.rating || '0.0'}`;
            
            // Genre
            clone.querySelector('[data-field="genre"]').textContent = movie.genre || 'N/A';
            
            // Click handler
            card.addEventListener('click', () => selectMovie(movie));
            
            container.appendChild(clone);
        });
    }

    /**
     * Select movie
     */
    function selectMovie(movie) {
        state.selectedMovie = movie;
        
        // Update UI
        document.querySelectorAll('.movie-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-movie-id="${movie.movie_id}"]`).classList.add('selected');
        
        checkFormCompletion();
    }

    /**
     * Load cinemas
     */
    function loadCinemas() {
        const loadingState = document.getElementById('cinemas-loading');
        const cinemasScroll = document.getElementById('cinemas-scroll');
        const cinemasGrid = document.getElementById('cinemas-grid');
        const emptyState = document.getElementById('cinemas-empty');

        loadingState.style.display = 'flex';
        if (cinemasScroll) cinemasScroll.style.display = 'none';
        emptyState.style.display = 'none';

        fetch(`${API_BASE_URL}/api/admin/cinemas`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data && result.data.length > 0) {
                state.cinemas = result.data;
                displayCinemas(result.data);
                if (cinemasScroll) cinemasScroll.style.display = 'block';
            } else {
                emptyState.style.display = 'flex';
            }
        })
        .catch(error => {
            loadingState.style.display = 'none';
            console.error('Error loading cinemas:', error);
            showAlert('Failed to load cinemas: ' + error.message, 'error');
        });
    }

    /**
     * Display cinemas grid
     */
    function displayCinemas(cinemas) {
        const grid = document.getElementById('cinemas-grid');
        const template = document.getElementById('cinema-card-template');
        
        grid.innerHTML = '';

        cinemas.forEach(cinema => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.cinema-card');
            
            card.dataset.cinemaId = cinema.cinema_id;
            
            clone.querySelector('[data-field="name"]').textContent = cinema.name;
            clone.querySelector('[data-field="address"]').textContent = cinema.address;
            clone.querySelector('[data-field="city"]').textContent = cinema.city;
            clone.querySelector('[data-field="screens"]').textContent = cinema.screen_count || 0;
            
            card.addEventListener('click', () => selectCinema(cinema));
            
            grid.appendChild(clone);
        });
    }

    /**
     * Select cinema
     */
    function selectCinema(cinema) {
        state.selectedCinema = cinema;
        
        // Update UI
        document.querySelectorAll('.cinema-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-cinema-id="${cinema.cinema_id}"]`).classList.add('selected');
        
        // Show screen section and load screens
        const screenSection = document.getElementById('screen-section');
        if (screenSection) {
            screenSection.style.display = 'block';
        }
        
        loadScreens();
        checkFormCompletion();
    }

    /**
     * Load available screens
     */
    function loadScreens() {
        const loadingState = document.getElementById('screens-loading');
        const screensScroll = document.getElementById('screens-scroll');
        const screensGrid = document.getElementById('screens-grid');
        const emptyState = document.getElementById('screens-empty');

        loadingState.style.display = 'flex';
        if (screensScroll) screensScroll.style.display = 'none';
        emptyState.style.display = 'none';

        // Get screens for selected cinema
        fetch(`${API_BASE_URL}/api/admin/cinemas/${state.selectedCinema.cinema_id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data && result.data.screens && result.data.screens.length > 0) {
                state.screens = result.data.screens;
                displayScreens(result.data.screens);
                if (screensScroll) screensScroll.style.display = 'block';
            } else {
                emptyState.style.display = 'flex';
            }
        })
        .catch(error => {
            loadingState.style.display = 'none';
            console.error('Error loading screens:', error);
            showAlert('Failed to load screens: ' + error.message, 'error');
        });
    }

    /**
     * Display screens grid
     */
    function displayScreens(screens) {
        const grid = document.getElementById('screens-grid');
        const template = document.getElementById('screen-card-template');
        
        grid.innerHTML = '';

        screens.forEach(screen => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.screen-card');
            
            card.dataset.screenId = screen.screen_id;
            
            clone.querySelector('[data-field="name"]').textContent = screen.screen_name;
            clone.querySelector('[data-field="type"]').textContent = screen.screen_type || 'STANDARD';
            clone.querySelector('[data-field="seats"]').textContent = screen.total_seats || 0;
            
            card.addEventListener('click', () => selectScreen(screen));
            
            grid.appendChild(clone);
        });
    }

    /**
     * Select screen
     */
    function selectScreen(screen) {
        state.selectedScreen = screen;
        
        // Update UI
        document.querySelectorAll('.screen-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-screen-id="${screen.screen_id}"]`).classList.add('selected');
        
        // Show time section and generate time slots
        const timeSection = document.getElementById('time-section');
        if (timeSection) {
            timeSection.style.display = 'block';
        }
        
        generateTimeSlots();
        checkFormCompletion();
    }

    /**
     * Generate fixed time slots (9:00, 12:00, 15:00, 18:00, 21:00)
     * Check and hide time slots that already have showtimes
     */
    function generateTimeSlots() {
        const grid = document.getElementById('time-slots-grid');
        const template = document.getElementById('time-slot-template');
        
        grid.innerHTML = '';
        
        // First, fetch existing showtimes for this screen and date
        checkExistingShowtimes().then(existingTimes => {
            // Use fixed time slots
            TIME_SLOTS.forEach(timeStr => {
                // Skip if this time already has a showtime
                if (existingTimes.includes(timeStr)) {
                    return;
                }
                
                const clone = template.content.cloneNode(true);
                const btn = clone.querySelector('.time-slot-btn');
                
                btn.dataset.time = timeStr;
                btn.textContent = timeStr;
                
                btn.addEventListener('click', function() {
                    toggleTimeSlot(timeStr, this);
                });
                
                grid.appendChild(clone);
            });
            
            // Show submit actions
            const submitActions = document.getElementById('submit-actions');
            if (submitActions) {
                submitActions.style.display = 'flex';
            }
        });
    }
    
    /**
     * Check existing showtimes for selected screen and date
     */
    function checkExistingShowtimes() {
        if (!state.selectedScreen || !state.selectedDate) {
            return Promise.resolve([]);
        }
        
        // Build query to get showtimes for this screen and date
        const params = new URLSearchParams();
        params.append('show_date', state.selectedDate);
        
        return fetch(`${API_BASE_URL}/api/admin/showtimes?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success && result.data) {
                // Filter showtimes for selected screen
                // Only exclude SCHEDULED and COMPLETED, allow CANCELLED slots to be reused
                const screenShowtimes = result.data.filter(st => 
                    st.screen_id === state.selectedScreen.screen_id && 
                    (st.status === 'SCHEDULED' || st.status === 'COMPLETED')
                );
                
                // Extract times in HH:MM format
                const existingTimes = screenShowtimes.map(st => {
                    const dt = new Date(st.show_datetime);
                    const hours = dt.getHours().toString().padStart(2, '0');
                    const minutes = dt.getMinutes().toString().padStart(2, '0');
                    return `${hours}:${minutes}`;
                });
                
                return existingTimes;
            }
            return [];
        })
        .catch(error => {
            console.error('Error checking existing showtimes:', error);
            return [];
        });
    }

    /**
     * Toggle time slot selection
     */
    function toggleTimeSlot(time, btn) {
        const index = state.selectedTimes.indexOf(time);
        
        if (index > -1) {
            // Remove
            state.selectedTimes.splice(index, 1);
            btn.classList.remove('selected');
        } else {
            // Add
            state.selectedTimes.push(time);
            btn.classList.add('selected');
        }
        
        // Update selected times display
        updateSelectedTimesDisplay();
        
        // Enable/disable create button
        const btnCreate = document.getElementById('btn-create-showtimes');
        btnCreate.disabled = state.selectedTimes.length === 0;
    }

    /**
     * Update selected times display
     */
    function updateSelectedTimesDisplay() {
        const container = document.getElementById('selected-times-container');
        const list = document.getElementById('selected-times-list');
        const template = document.getElementById('selected-time-template');
        
        list.innerHTML = '';
        
        if (state.selectedTimes.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        // Sort times
        const sortedTimes = [...state.selectedTimes].sort();
        
        sortedTimes.forEach(time => {
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('[data-field="time"]').textContent = time;
            
            const btnRemove = clone.querySelector('[data-action="remove"]');
            btnRemove.addEventListener('click', () => {
                removeTimeSlot(time);
            });
            
            list.appendChild(clone);
        });
    }

    /**
     * Remove time slot
     */
    function removeTimeSlot(time) {
        const index = state.selectedTimes.indexOf(time);
        if (index > -1) {
            state.selectedTimes.splice(index, 1);
        }
        
        // Update button state
        const btn = document.querySelector(`[data-time="${time}"]`);
        if (btn) {
            btn.classList.remove('selected');
        }
        
        updateSelectedTimesDisplay();
        
        // Enable/disable create button
        const btnCreate = document.getElementById('btn-create-showtimes');
        btnCreate.disabled = state.selectedTimes.length === 0;
    }

    /**
     * Create showtimes
     */
    function createShowtimes() {
        const btnCreate = document.getElementById('btn-create-showtimes');
        const basePrice = document.getElementById('base-price').value;
        
        if (!basePrice || basePrice <= 0) {
            showAlert('Please enter a valid base price', 'error');
            return;
        }
        
        if (state.selectedTimes.length === 0) {
            showAlert('Please select at least one time slot', 'error');
            return;
        }
        
        btnCreate.disabled = true;
        btnCreate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        // Create showtimes for each selected time
        const promises = state.selectedTimes.map(time => {
            const datetime = `${state.selectedDate}T${time}:00`;
            
            return fetch(`${API_BASE_URL}/api/admin/showtimes`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    movie_id: state.selectedMovie.movie_id,
                    screen_id: state.selectedScreen.screen_id,
                    show_datetime: datetime,
                    base_price: parseFloat(basePrice),
                    status: 'SCHEDULED'
                })
            })
            .then(handleResponse);
        });
        
        Promise.all(promises)
            .then(results => {
                const successCount = results.filter(r => r.success).length;
                const failCount = results.length - successCount;
                
                if (successCount > 0) {
                    showAlert(`Successfully created ${successCount} showtime(s)`, 'success');
                    setTimeout(() => {
                        window.location.href = 'showtimes.html';
                    }, 1500);
                } else {
                    showAlert('Failed to create showtimes', 'error');
                    btnCreate.disabled = false;
                    btnCreate.innerHTML = '<i class="fas fa-plus"></i> Create Showtimes';
                }
            })
            .catch(error => {
                console.error('Error creating showtimes:', error);
                showAlert('Failed to create showtimes: ' + error.message, 'error');
                btnCreate.disabled = false;
                btnCreate.innerHTML = '<i class="fas fa-plus"></i> Create Showtimes';
            });
    }

    /**
     * Check form completion and enable/disable submit button
     */
    function checkFormCompletion() {
        const btnCreate = document.getElementById('btn-create-showtimes');
        if (!btnCreate) return;
        
        const isComplete = state.selectedMovie && 
                          state.selectedDate && 
                          state.selectedCinema && 
                          state.selectedScreen && 
                          state.selectedTimes.length > 0;
        
        btnCreate.disabled = !isComplete;
    }

    /**
     * Format date
     */
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

})();

