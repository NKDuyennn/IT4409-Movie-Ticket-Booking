/**
 * Movie Edit JavaScript - Edit movie details, actors, videos, and images
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    // State management
    let selectedActors = [];
    let videosList = [];
    let imagesList = [];
    let allActors = [];
    let movieId = null;

    /**
     * Upload file to server
     */
    async function uploadFile(file, type = 'images') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
                method: 'POST',
                headers: getAuthHeaders(true), // true = skip Content-Type for FormData
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Upload failed');
            }
            
            if (result.success && result.data && result.data.url) {
                return result.data.url;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        setupTabs();
        loadAllActors();
        
        const urlParams = new URLSearchParams(window.location.search);
        movieId = urlParams.get('id');
        
        if (movieId) {
            loadMovieData(movieId);
        } else {
            showAlert('Movie ID not found', 'error');
            setTimeout(() => window.location.href = 'movies.html', 2000);
        }
        
        const form = document.getElementById('movie-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
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
     * Load movie data for editing
     */
    function loadMovieData(movieId) {
        const loadingState = document.getElementById('page-loading-state');
        const formContainer = document.getElementById('edit-form-container');
        
        fetch(`${API_BASE_URL}/api/admin/movies/${movieId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success && result.data) {
                populateForm(result.data);
                loadingState.style.display = 'none';
                formContainer.style.display = 'block';
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
     * Populate form with movie data
     */
    function populateForm(movie) {
        document.getElementById('movie-id').value = movie.movie_id;
        document.getElementById('movie-title').value = movie.title || '';
        document.getElementById('movie-description').value = movie.description || '';
        document.getElementById('movie-director').value = movie.director || '';
        document.getElementById('movie-genre').value = movie.genre || '';
        document.getElementById('movie-duration').value = movie.duration_minutes || '';
        document.getElementById('movie-language').value = movie.language || '';
        document.getElementById('movie-release-date').value = movie.release_date || '';
        document.getElementById('movie-age-rating').value = movie.age_rating || 'P';
        document.getElementById('movie-rating').value = movie.rating || '';
        document.getElementById('movie-is-showing').value = movie.is_showing ? 'true' : 'false';
        
        // Load actors
        if (movie.actors && movie.actors.length > 0) {
            selectedActors = movie.actors.map(ma => ({
                actor_id: ma.actor_id,
                name: ma.actor ? ma.actor.name : 'Unknown',
                photo_url: ma.actor ? ma.actor.photo_url : null,
                role_name: ma.role_name,
                character_name: ma.character_name,
                display_order: ma.display_order
            }));
            displaySelectedActors();
        }
        
        // Load videos
        if (movie.videos && movie.videos.length > 0) {
            videosList = movie.videos.map(v => ({
                video_url: v.video_url,
                video_type: v.video_type,
                title: v.title,
                duration_seconds: v.duration_seconds,
                display_order: v.display_order
            }));
            displayVideosList();
        }
        
        // Load images
        if (movie.images && movie.images.length > 0) {
            imagesList = movie.images.map(i => ({
                image_url: i.image_url,
                image_type: i.image_type,
                caption: i.caption,
                display_order: i.display_order
            }));
            displayImagesList();
        }
    }

    /**
     * Handle form submission
     */
    function handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

        const formData = collectFormData();
        
        fetch(`${API_BASE_URL}/api/admin/movies/${movieId}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Movie updated successfully', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to update movie');
            }
        })
        .catch(error => {
            console.error('Error updating movie:', error);
            showAlert(error.message || 'Failed to update movie', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Save Changes';
        });
    }

    /**
     * Collect form data
     */
    function collectFormData() {
        const data = {
            title: document.getElementById('movie-title').value,
            description: document.getElementById('movie-description').value,
            director: document.getElementById('movie-director').value,
            genre: document.getElementById('movie-genre').value,
            duration_minutes: parseInt(document.getElementById('movie-duration').value),
            language: document.getElementById('movie-language').value,
            release_date: document.getElementById('movie-release-date').value,
            age_rating: document.getElementById('movie-age-rating').value,
            rating: parseFloat(document.getElementById('movie-rating').value) || 0.0,
            is_showing: document.getElementById('movie-is-showing').value === 'true',
            actors: selectedActors.map(a => ({
                actor_id: a.actor_id,
                role_name: a.role_name,
                character_name: a.character_name,
                display_order: a.display_order
            })),
            videos: videosList,
            images: imagesList
        };
        
        return data;
    }

    // ============ ACTORS MANAGEMENT ============

    /**
     * Load all actors
     */
    function loadAllActors() {
        return fetch(`${API_BASE_URL}/api/admin/movies/actors`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success && result.data) {
                allActors = result.data;
                console.log('Loaded actors:', allActors.length);
            } else {
                throw new Error('Failed to load actors');
            }
        })
        .catch(error => {
            console.error('Error loading actors:', error);
            showAlert('Failed to load actors: ' + error.message, 'error');
            throw error;
        });
    }

    /**
     * Open actor selector modal
     */
    window.openActorSelector = function() {
        console.log('openActorSelector called');
        console.log('allActors length:', allActors.length);
        
        // Open modal immediately
        openActorSelectorModal();
        
        // Load actors if not loaded yet
        if (allActors.length === 0) {
            console.log('Loading actors...');
            loadAllActors().then(() => {
                console.log('Actors loaded successfully');
                displayActorSelector();
            }).catch(error => {
                console.error('Error in openActorSelector:', error);
                // Error already handled in loadAllActors
                const container = document.getElementById('actors-selector-list');
                if (container) {
                    container.innerHTML = '<div class="empty-state-small"><i class="fas fa-exclamation-triangle"></i><p>Failed to load actors. Please try again.</p></div>';
                }
            });
        }
    };

    /**
     * Open actor selector modal UI
     */
    function openActorSelectorModal() {
        console.log('openActorSelectorModal called');
        const modal = document.getElementById('actor-selector-modal');
        console.log('Modal element:', modal);
        
        if (!modal) {
            console.error('Actor selector modal not found');
            alert('Modal element not found! Check HTML.');
            return;
        }
        
        console.log('Adding show class to modal');
        modal.classList.add('show');
        modal.style.visibility = 'visible'; // Ensure visible when opening
        console.log('Modal computed style:', window.getComputedStyle(modal).display);
        
        // Only display if actors are already loaded
        if (allActors.length > 0) {
            displayActorSelector();
        } else {
            // Show loading state
            const container = document.getElementById('actors-selector-list');
            if (container) {
                container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading actors...</p></div>';
            }
        }
        
        // Setup search
        const searchInput = document.getElementById('actor-search');
        if (searchInput) {
            searchInput.value = '';
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            newSearchInput.addEventListener('input', function() {
                displayActorSelector(this.value);
            });
        }
        
        // Close button
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.classList.remove('show');
                modal.style.visibility = 'visible'; // Reset visibility
                // Update main actors list when closing
                displaySelectedActors();
            };
        }
        
        // Click outside to close
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
                modal.style.visibility = 'visible'; // Reset visibility
                // Update main actors list when closing
                displaySelectedActors();
            }
        };
    }

    /**
     * Display actor selector
     */
    function displayActorSelector(search = '') {
        const container = document.getElementById('actors-selector-list');
        const template = document.getElementById('actor-selector-card-template');
        
        let filtered = allActors;
        if (search) {
            filtered = allActors.filter(a => 
                a.name.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        container.innerHTML = '';
        
        if (filtered.length === 0) {
            const noActorsTemplate = document.getElementById('no-actors-found-template');
            container.appendChild(noActorsTemplate.content.cloneNode(true));
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'actors-selector-grid';
        
        filtered.forEach(actor => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.actor-selector-card');
            const isSelected = selectedActors.some(sa => sa.actor_id === actor.actor_id);
            
            if (isSelected) {
                card.classList.add('selected');
                clone.querySelector('[data-field="selected-icon"]').style.display = 'block';
            }
            
            // Populate data
            const photoEl = clone.querySelector('[data-field="photo"]');
            if (actor.photo_url) {
                // Prepend API_BASE_URL for uploaded images (relative paths starting with /)
                const photoSrc = actor.photo_url.startsWith('/') ? `${API_BASE_URL}${actor.photo_url}` : actor.photo_url;
                photoEl.src = photoSrc;
                photoEl.alt = actor.name;
                photoEl.onerror = () => {
                    const placeholderTemplate = document.getElementById('actor-photo-placeholder-template');
                    const placeholderClone = placeholderTemplate.content.cloneNode(true);
                    photoEl.parentNode.replaceChild(placeholderClone, photoEl);
                };
            } else {
                const placeholderTemplate = document.getElementById('actor-photo-placeholder-template');
                const placeholderClone = placeholderTemplate.content.cloneNode(true);
                photoEl.parentNode.replaceChild(placeholderClone, photoEl);
            }
            
            clone.querySelector('[data-field="name"]').textContent = actor.name;
            
            const nationalityEl = clone.querySelector('[data-field="nationality"]');
            if (actor.nationality) {
                nationalityEl.textContent = actor.nationality;
            } else {
                nationalityEl.remove();
            }
            
            // Attach event listener
            card.addEventListener('click', () => selectActor(actor.actor_id));
            
            grid.appendChild(clone);
        });
        
        container.appendChild(grid);
    }

    /**
     * Select actor
     */
    function selectActor(actorId) {
        const actor = allActors.find(a => a.actor_id === actorId);
        if (!actor) return;
        
        // Check if already selected
        if (selectedActors.some(sa => sa.actor_id === actorId)) {
            showAlert('Actor already added', 'warning');
            return;
        }
        
        // Hide selector modal (keep it in background)
        const selectorModal = document.getElementById('actor-selector-modal');
        selectorModal.style.visibility = 'hidden';
        
        // Open details modal
        const modal = document.getElementById('actor-details-modal');
        modal.classList.add('show');
        
        document.getElementById('selected-actor-id').value = actorId;
        document.getElementById('actor-role-name').value = '';
        document.getElementById('actor-character-name').value = '';
        document.getElementById('actor-display-order').value = selectedActors.length;
        
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = closeActorDetailsModal;
    }

    /**
     * Close actor details modal
     */
    window.closeActorDetailsModal = function() {
        document.getElementById('actor-details-modal').classList.remove('show');
        // Show back the selector modal
        const selectorModal = document.getElementById('actor-selector-modal');
        selectorModal.style.visibility = 'visible';
    };

    /**
     * Save actor details
     */
    window.saveActorDetails = function() {
        const actorId = parseInt(document.getElementById('selected-actor-id').value);
        const roleName = document.getElementById('actor-role-name').value;
        const characterName = document.getElementById('actor-character-name').value;
        const displayOrder = parseInt(document.getElementById('actor-display-order').value);
        
        const actor = allActors.find(a => a.actor_id === actorId);
        if (!actor) return;
        
        // Check if actor already exists
        const existingIndex = selectedActors.findIndex(a => a.actor_id === actorId);
        if (existingIndex >= 0) {
            selectedActors[existingIndex] = {
                actor_id: actorId,
                name: actor.name,
                photo_url: actor.photo_url,
                role_name: roleName,
                character_name: characterName,
                display_order: displayOrder
            };
        } else {
            selectedActors.push({
                actor_id: actorId,
                name: actor.name,
                photo_url: actor.photo_url,
                role_name: roleName,
                character_name: characterName,
                display_order: displayOrder
            });
        }
        
        // Update the main actors list (will be updated when modal closes)
        displaySelectedActors();
        
        // Update the selector modal to show selected state
        displayActorSelector();
        
        // Close details modal and show back selector modal
        closeActorDetailsModal();
    };

    /**
     * Display selected actors
     */
    function displaySelectedActors() {
        const container = document.getElementById('actors-list');
        const template = document.getElementById('actor-card-template');
        const emptyTemplate = document.getElementById('empty-actors-template');
        
        container.innerHTML = '';
        
        if (selectedActors.length === 0) {
            const emptyClone = emptyTemplate.content.cloneNode(true);
            container.appendChild(emptyClone);
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'actors-grid';
        
        selectedActors.forEach((actor, index) => {
            const clone = template.content.cloneNode(true);
            
            // Populate data
            const photoEl = clone.querySelector('[data-field="photo"]');
            if (actor.photo_url) {
                // Prepend API_BASE_URL for uploaded images (relative paths starting with /)
                const photoSrc = actor.photo_url.startsWith('/') ? `${API_BASE_URL}${actor.photo_url}` : actor.photo_url;
                photoEl.src = photoSrc;
                photoEl.alt = actor.name;
                photoEl.onerror = () => {
                    const placeholderTemplate = document.getElementById('actor-photo-placeholder-template');
                    const placeholderClone = placeholderTemplate.content.cloneNode(true);
                    photoEl.parentNode.replaceChild(placeholderClone, photoEl);
                };
            } else {
                const placeholderTemplate = document.getElementById('actor-photo-placeholder-template');
                const placeholderClone = placeholderTemplate.content.cloneNode(true);
                photoEl.parentNode.replaceChild(placeholderClone, photoEl);
            }
            
            clone.querySelector('[data-field="name"]').textContent = actor.name;
            
            const characterEl = clone.querySelector('[data-field="character"]');
            if (actor.character_name) {
                const charTemplate = document.getElementById('character-info-template');
                const charClone = charTemplate.content.cloneNode(true);
                charClone.querySelector('[data-field="character"]').textContent = actor.character_name;
                characterEl.appendChild(charClone);
            } else {
                characterEl.remove();
            }
            
            const roleEl = clone.querySelector('[data-field="role"]');
            if (actor.role_name) {
                const roleTemplate = document.getElementById('role-info-template');
                const roleClone = roleTemplate.content.cloneNode(true);
                roleClone.querySelector('[data-field="role"]').textContent = actor.role_name;
                roleEl.appendChild(roleClone);
            } else {
                roleEl.remove();
            }
            
            const orderEl = clone.querySelector('[data-field="order"]');
            const orderTemplate = document.getElementById('order-info-template');
            const orderClone = orderTemplate.content.cloneNode(true);
            orderClone.querySelector('[data-field="order"]').textContent = actor.display_order;
            orderEl.appendChild(orderClone);
            
            // Attach event listener
            clone.querySelector('[data-action="remove-actor"]').addEventListener('click', () => removeActor(index));
            
            grid.appendChild(clone);
        });
        
        container.appendChild(grid);
    }

    /**
     * Remove actor
     */
    function removeActor(index) {
        selectedActors.splice(index, 1);
        displaySelectedActors();
    }

    // ============ VIDEOS MANAGEMENT ============

    /**
     * Add video
     */
    window.addVideoRow = function() {
        const modal = document.getElementById('add-video-modal');
        if (!modal) return;
        
        // Clear form
        document.getElementById('video-url').value = '';
        document.getElementById('video-type').value = 'TRAILER';
        document.getElementById('video-title').value = '';
        document.getElementById('video-url-group').style.display = 'block';
        document.getElementById('video-file-group').style.display = 'none';
        const videoFileInput = document.getElementById('video-file');
        if (videoFileInput) videoFileInput.value = '';
        
        // Reset toggle buttons
        const videoToggleBtns = document.querySelectorAll('.source-toggle-btn[data-target="video"]');
        videoToggleBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.source === 'url') {
                btn.classList.add('active');
            }
        });
        
        // Show modal
        modal.classList.add('show');
        
        // Setup source toggle
        const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn[data-target="video"]');
        sourceToggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all buttons
                sourceToggleBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                this.classList.add('active');
                
                if (this.dataset.source === 'url') {
                    document.getElementById('video-url-group').style.display = 'block';
                    document.getElementById('video-file-group').style.display = 'none';
                } else {
                    document.getElementById('video-url-group').style.display = 'none';
                    document.getElementById('video-file-group').style.display = 'block';
                }
            });
        });
        
        // Setup close handlers
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('show');
        }
        
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        };
    };

    /**
     * Close video modal
     */
    window.closeVideoModal = function() {
        document.getElementById('add-video-modal').classList.remove('show');
    };

    /**
     * Save video
     */
    window.saveVideo = async function() {
        const sourceBtn = document.querySelector('.source-toggle-btn[data-target="video"].active');
        const sourceType = sourceBtn ? sourceBtn.dataset.source : 'url';
        const videoType = document.getElementById('video-type').value;
        const title = document.getElementById('video-title').value.trim();
        
        let videoUrl = '';
        
        if (sourceType === 'url') {
            videoUrl = document.getElementById('video-url').value.trim();
            if (!videoUrl) {
                alert('Please enter video URL');
                return;
            }
        } else {
            // Upload file
            const fileInput = document.getElementById('video-file');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select a video file');
                return;
            }
            
            // Check file size (500MB max)
            if (file.size > 500 * 1024 * 1024) {
                alert('File size exceeds 500MB limit');
                return;
            }
            
            // Upload file
            try {
                showAlert('Uploading video...', 'info');
                videoUrl = await uploadFile(file, 'videos');
                console.log('Video uploaded:', videoUrl);
            } catch (error) {
                console.error('Upload error:', error);
                alert('Failed to upload video: ' + error.message);
                return;
            }
        }
        
        videosList.push({
            video_url: videoUrl,
            video_type: videoType,
            title: title || 'Untitled',
            duration_seconds: null,
            display_order: videosList.length
        });
        
        displayVideosList();
        closeVideoModal();
    };

    /**
     * Display videos list
     */
    function displayVideosList() {
        const container = document.getElementById('videos-list');
        const template = document.getElementById('video-card-template');
        const emptyTemplate = document.getElementById('empty-videos-template');
        
        container.innerHTML = '';
        
        if (videosList.length === 0) {
            const emptyClone = emptyTemplate.content.cloneNode(true);
            container.appendChild(emptyClone);
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'videos-grid';
        
        videosList.forEach((video, index) => {
            const clone = template.content.cloneNode(true);
            
            // Populate data
            clone.querySelector('[data-field="embed"]').innerHTML = getVideoEmbed(video.video_url);
            clone.querySelector('[data-field="title"]').textContent = video.title || 'Untitled';
            clone.querySelector('[data-field="type"]').textContent = `Type: ${video.video_type}`;
            clone.querySelector('[data-field="url"]').textContent = video.video_url;
            
            // Attach event listener
            clone.querySelector('[data-action="remove-video"]').addEventListener('click', () => removeVideo(index));
            
            grid.appendChild(clone);
        });
        
        container.appendChild(grid);
    }

    /**
     * Remove video
     */
    function removeVideo(index) {
        videosList.splice(index, 1);
        displayVideosList();
    }

    /**
     * Get video embed HTML
     */
    function getVideoEmbed(url) {
        if (!url) {
            return `<div class="video-placeholder"><i class="fas fa-video"></i><p>No Video</p></div>`;
        }
        
        // Check if YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(youtubeRegex);
        
        if (match && match[1]) {
            return `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe>`;
        }
        
        // Check if video file (uploaded or external URL)
        if (url.match(/\.(mp4|webm|ogg|avi|mov|mkv)$/i)) {
            // If it's a relative path (uploaded file), prepend API_BASE_URL
            const videoSrc = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
            return `<video width="100%" height="200" controls preload="metadata">
                        <source src="${videoSrc}" type="video/mp4">
                        <source src="${videoSrc}" type="video/webm">
                        <source src="${videoSrc}" type="video/ogg">
                        Your browser does not support the video tag.
                    </video>`;
        }
        
        return `<div class="video-placeholder"><i class="fas fa-video"></i><p>Video Preview</p></div>`;
    }

    // ============ IMAGES MANAGEMENT ============

    /**
     * Add image
     */
    window.addImageRow = function() {
        const modal = document.getElementById('add-image-modal');
        if (!modal) return;
        
        // Clear form
        document.getElementById('image-url').value = '';
        document.getElementById('image-type').value = 'POSTER';
        document.getElementById('image-caption').value = '';
        document.getElementById('image-url-group').style.display = 'block';
        document.getElementById('image-file-group').style.display = 'none';
        document.getElementById('image-preview').style.display = 'none';
        const fileInput = document.getElementById('image-file');
        if (fileInput) fileInput.value = '';
        
        // Reset toggle buttons
        const imageToggleBtns = document.querySelectorAll('.source-toggle-btn[data-target="image"]');
        imageToggleBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.source === 'url') {
                btn.classList.add('active');
            }
        });
        
        // Show modal
        modal.classList.add('show');
        
        // Setup source toggle
        const sourceToggleBtns = document.querySelectorAll('.source-toggle-btn[data-target="image"]');
        sourceToggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all buttons
                sourceToggleBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                this.classList.add('active');
                
                if (this.dataset.source === 'url') {
                    document.getElementById('image-url-group').style.display = 'block';
                    document.getElementById('image-file-group').style.display = 'none';
                    document.getElementById('image-preview').style.display = 'none';
                } else {
                    document.getElementById('image-url-group').style.display = 'none';
                    document.getElementById('image-file-group').style.display = 'block';
                }
            });
        });
        
        // Setup file preview
        const imageFilePreview = document.getElementById('image-file');
        if (imageFilePreview) {
            imageFilePreview.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.getElementById('image-preview-img').src = e.target.result;
                        document.getElementById('image-preview').style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Setup close handlers
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('show');
        }
        
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        };
    };

    /**
     * Close image modal
     */
    window.closeImageModal = function() {
        document.getElementById('add-image-modal').classList.remove('show');
    };

    /**
     * Save image
     */
    window.saveImage = async function() {
        const sourceBtn = document.querySelector('.source-toggle-btn[data-target="image"].active');
        const sourceType = sourceBtn ? sourceBtn.dataset.source : 'url';
        const imageType = document.getElementById('image-type').value;
        const caption = document.getElementById('image-caption').value.trim();
        
        let imageUrl = '';
        
        if (sourceType === 'url') {
            imageUrl = document.getElementById('image-url').value.trim();
            if (!imageUrl) {
                alert('Please enter image URL');
                return;
            }
        } else {
            // Upload file
            const fileInput = document.getElementById('image-file');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select an image file');
                return;
            }
            
            // Check file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size exceeds 10MB limit');
                return;
            }
            
            // Upload file
            try {
                showAlert('Uploading image...', 'info');
                imageUrl = await uploadFile(file, 'images');
                console.log('Image uploaded:', imageUrl);
            } catch (error) {
                console.error('Upload error:', error);
                alert('Failed to upload image: ' + error.message);
                return;
            }
        }
        
        imagesList.push({
            image_url: imageUrl,
            image_type: imageType,
            caption: caption || '',
            display_order: imagesList.length
        });
        
        displayImagesList();
        closeImageModal();
    };

    /**
     * Display images list
     */
    function displayImagesList() {
        const container = document.getElementById('images-list');
        const template = document.getElementById('image-card-template');
        const emptyTemplate = document.getElementById('empty-images-template');
        
        container.innerHTML = '';
        
        if (imagesList.length === 0) {
            const emptyClone = emptyTemplate.content.cloneNode(true);
            container.appendChild(emptyClone);
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'images-grid';
        
        imagesList.forEach((image, index) => {
            const clone = template.content.cloneNode(true);
            
            // Populate data
            const imgEl = clone.querySelector('[data-field="image"]');
            // If it's a relative path (uploaded file), prepend API_BASE_URL
            const imageSrc = image.image_url.startsWith('/') ? `${API_BASE_URL}${image.image_url}` : image.image_url;
            imgEl.src = imageSrc;
            imgEl.alt = image.caption || 'Movie image';
            
            // Handle image load error
            imgEl.onerror = function() {
                this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
            };
            
            clone.querySelector('[data-field="type"]').textContent = image.image_type;
            
            const captionEl = clone.querySelector('[data-field="caption"]');
            if (image.caption) {
                captionEl.textContent = image.caption;
            } else {
                captionEl.remove();
            }
            
            // Attach event listener
            clone.querySelector('[data-action="remove-image"]').addEventListener('click', () => removeImage(index));
            
            grid.appendChild(clone);
        });
        
        container.appendChild(grid);
    }

    /**
     * Remove image
     */
    function removeImage(index) {
        imagesList.splice(index, 1);
        displayImagesList();
    }

})();
