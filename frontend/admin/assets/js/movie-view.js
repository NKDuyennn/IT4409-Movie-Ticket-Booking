/**
 * Movie View JavaScript - View movie details
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    let movieId = null;

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        setupTabs();
        
        const urlParams = new URLSearchParams(window.location.search);
        movieId = urlParams.get('id');
        
        if (movieId) {
            loadMovieForView(movieId);
        } else {
            showAlert('Movie ID not found', 'error');
            setTimeout(() => window.location.href = 'movies.html', 2000);
        }
    });

    /**
     * Setup tabs
     */
    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                
                // Remove active class from all
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to current
                this.classList.add('active');
                document.getElementById(`tab-${tabName}`).classList.add('active');
            });
        });
    }

    /**
     * Load movie data for viewing
     */
    function loadMovieForView(movieId) {
        const loadingState = document.getElementById('page-loading-state');
        const viewContainer = document.getElementById('view-container');
        
        fetch(`${API_BASE_URL}/api/admin/movies/${movieId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success && result.data) {
                displayMovieDetails(result.data);
                loadingState.style.display = 'none';
                viewContainer.style.display = 'block';
            } else {
                throw new Error('Movie not found');
            }
        })
        .catch(error => {
            console.error('Error loading movie:', error);
            showAlert('Failed to load movie data: ' + error.message, 'error');
            setTimeout(() => window.location.href = 'movies.html', 2000);
        });
    }

    /**
     * Display movie details in view mode
     */
    function displayMovieDetails(movie) {
        // Basic information
        document.getElementById('view-title').textContent = movie.title || '-';
        document.getElementById('view-description').textContent = movie.description || '-';
        document.getElementById('view-director').textContent = movie.director || '-';
        document.getElementById('view-genre').textContent = movie.genre || '-';
        document.getElementById('view-duration').textContent = movie.duration_minutes ? `${movie.duration_minutes} minutes` : '-';
        document.getElementById('view-language').textContent = movie.language || '-';
        document.getElementById('view-release-date').textContent = movie.release_date ? formatDate(movie.release_date) : '-';
        document.getElementById('view-age-rating').textContent = movie.age_rating || '-';
        
        const ratingEl = document.getElementById('view-rating');
        if (movie.rating) {
            const ratingTemplate = document.getElementById('rating-view-template');
            const ratingClone = ratingTemplate.content.cloneNode(true);
            ratingClone.querySelector('[data-field="rating"]').textContent = movie.rating;
            ratingEl.innerHTML = '';
            ratingEl.appendChild(ratingClone);
        } else {
            ratingEl.textContent = '-';
        }
        
        const statusEl = document.getElementById('view-status');
        statusEl.innerHTML = '';
        if (movie.is_showing) {
            const statusTemplate = document.getElementById('status-active-template');
            statusEl.appendChild(statusTemplate.content.cloneNode(true));
        } else {
            const statusTemplate = document.getElementById('status-inactive-template');
            statusEl.appendChild(statusTemplate.content.cloneNode(true));
        }
        
        // Display actors
        displayActors(movie.actors || []);
        
        // Display videos
        displayVideos(movie.videos || []);
        
        // Display images
        displayImages(movie.images || []);
    }

    /**
     * Display actors
     */
    function displayActors(actors) {
        const actorsViewList = document.getElementById('actors-view-list');
        const actorsEmptyState = document.getElementById('actors-empty-state');
        
        actorsViewList.innerHTML = '';
        
        if (actors.length === 0) {
            actorsEmptyState.style.display = 'block';
            return;
        }
        
        actorsEmptyState.style.display = 'none';
        
        const grid = document.createElement('div');
        grid.className = 'actors-grid';
        
        actors.forEach(ma => {
            const actor = ma.actor;
            const photoUrl = actor && actor.photo_url ? actor.photo_url : '';
            
            let template, clone;
            if (photoUrl) {
                template = document.getElementById('actor-card-view-template');
                clone = template.content.cloneNode(true);
                const img = clone.querySelector('[data-field="photo"]');
                img.src = photoUrl.startsWith('/uploads') ? API_BASE_URL + photoUrl : photoUrl;
                img.alt = actor ? actor.name : 'Unknown';
            } else {
                template = document.getElementById('actor-card-placeholder-template');
                clone = template.content.cloneNode(true);
            }
            
            clone.querySelector('[data-field="name"]').textContent = actor ? actor.name : 'Unknown';
            
            const characterEl = clone.querySelector('[data-field="character"]');
            if (ma.character_name) {
                characterEl.innerHTML = '<strong>Character:</strong> ' + ma.character_name;
            } else {
                characterEl.style.display = 'none';
            }
            
            const roleEl = clone.querySelector('[data-field="role"]');
            if (ma.role_name) {
                roleEl.innerHTML = '<strong>Role:</strong> ' + ma.role_name;
            } else {
                roleEl.style.display = 'none';
            }
            
            grid.appendChild(clone);
        });
        
        actorsViewList.appendChild(grid);
    }

    /**
     * Display videos
     */
    function displayVideos(videos) {
        const videosViewList = document.getElementById('videos-view-list');
        const videosEmptyState = document.getElementById('videos-empty-state');
        
        videosViewList.innerHTML = '';
        
        if (videos.length === 0) {
            videosEmptyState.style.display = 'block';
            return;
        }
        
        videosEmptyState.style.display = 'none';
        
        const grid = document.createElement('div');
        grid.className = 'videos-grid';
        
        videos.forEach(video => {
            const template = document.getElementById('video-card-view-template');
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('[data-field="embed"]').innerHTML = getVideoEmbed(video.video_url);
            clone.querySelector('[data-field="title"]').textContent = video.title || 'Untitled';
            clone.querySelector('[data-field="type"]').textContent = video.video_type || 'N/A';
            
            const durationEl = clone.querySelector('[data-field="duration"]');
            if (video.duration_seconds) {
                const minutes = Math.floor(video.duration_seconds / 60);
                const seconds = (video.duration_seconds % 60).toString().padStart(2, '0');
                durationEl.innerHTML = '<strong>Duration:</strong> ' + minutes + ':' + seconds;
            } else {
                durationEl.style.display = 'none';
            }
            
            grid.appendChild(clone);
        });
        
        videosViewList.appendChild(grid);
    }

    /**
     * Display images
     */
    function displayImages(images) {
        const imagesViewList = document.getElementById('images-view-list');
        const imagesEmptyState = document.getElementById('images-empty-state');
        
        imagesViewList.innerHTML = '';
        
        if (images.length === 0) {
            imagesEmptyState.style.display = 'block';
            return;
        }
        
        imagesEmptyState.style.display = 'none';
        
        const grid = document.createElement('div');
        grid.className = 'images-grid';
        
        images.forEach(image => {
            const template = document.getElementById('image-card-view-template');
            const clone = template.content.cloneNode(true);
            
            const img = clone.querySelector('[data-field="src"]');
            img.src = image.image_url.startsWith('/uploads') ? API_BASE_URL + image.image_url : image.image_url;
            img.alt = image.caption || 'Movie image';
            
            clone.querySelector('[data-field="type"]').textContent = image.image_type || 'Image';
            
            const captionEl = clone.querySelector('[data-field="caption"]');
            if (image.caption) {
                captionEl.textContent = image.caption;
            } else {
                captionEl.style.display = 'none';
            }
            
            grid.appendChild(clone);
        });
        
        imagesViewList.appendChild(grid);
    }

    /**
     * Get video embed HTML
     */
    function getVideoEmbed(url) {
        // Check if YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(youtubeRegex);
        
        if (match && match[1]) {
            return `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe>`;
        }
        
        // Check if video file
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            const videoSrc = url.startsWith('/uploads') ? API_BASE_URL + url : url;
            return `<video width="100%" height="200" controls><source src="${videoSrc}"></video>`;
        }
        
        return `<div class="video-placeholder"><i class="fas fa-video"></i><p>Video Preview</p></div>`;
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    /**
     * Edit movie
     */
    window.editMovie = function() {
        window.location.href = `movie-edit.html?id=${movieId}`;
    };

    /**
     * Delete movie
     */
    window.confirmDeleteMovie = function() {
        const modal = document.getElementById('delete-modal');
        modal.classList.add('show');
        
        const confirmBtn = document.getElementById('confirm-delete-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', function() {
            performDeleteFromView(movieId);
        });
        
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = closeDeleteModal;
    };

    /**
     * Perform delete from view page
     */
    function performDeleteFromView(movieId) {
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
                setTimeout(() => {
                    window.location.href = 'movies.html';
                }, 1500);
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

    window.closeDeleteModal = closeDeleteModal;

})();
