/**
 * Movie Create JavaScript - Create new movie with actors, videos, and images
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    // State management
    let selectedActors = [];
    let videosList = [];
    let imagesList = [];
    let allActors = [];

    /**
     * Initialize page
     */
    document.addEventListener('DOMContentLoaded', function() {
        setupTabs();
        loadAllActors();
        
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
     * Handle form submission
     */
    function handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Creating...';

        const formData = collectFormData();
        
        fetch(`${API_BASE_URL}/api/admin/movies`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Movie created successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'movies.html';
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to create movie');
            }
        })
        .catch(error => {
            console.error('Error creating movie:', error);
            showAlert(error.message || 'Failed to create movie', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Create Movie';
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
        if (allActors.length === 0) {
            showAlert('Loading actors...', 'info');
            loadAllActors().then(() => {
                openActorSelectorModal();
            });
        } else {
            openActorSelectorModal();
        }
    };

    /**
     * Open actor selector modal UI
     */
    function openActorSelectorModal() {
        const modal = document.getElementById('actor-selector-modal');
        if (!modal) {
            console.error('Actor selector modal not found');
            return;
        }
        
        modal.classList.add('show');
        modal.style.display = 'block';
        displayActorSelector();
        
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
            closeBtn.onclick = () => {
                modal.classList.remove('show');
                modal.style.display = 'none';
            };
        }
        
        // Click outside to close
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
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
                photoEl.src = actor.photo_url;
                photoEl.alt = actor.name;
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
        
        // Close selector modal
        const selectorModal = document.getElementById('actor-selector-modal');
        selectorModal.classList.remove('show');
        selectorModal.style.display = 'none';
        
        // Open details modal
        const modal = document.getElementById('actor-details-modal');
        modal.classList.add('show');
        modal.style.display = 'block';
        
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
        const modal = document.getElementById('actor-details-modal');
        modal.classList.remove('show');
        modal.style.display = 'none';
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
        
        selectedActors.push({
            actor_id: actorId,
            name: actor.name,
            photo_url: actor.photo_url,
            role_name: roleName,
            character_name: characterName,
            display_order: displayOrder
        });
        
        displaySelectedActors();
        closeActorDetailsModal();
        
        // Reopen selector modal to continue adding actors
        const selectorModal = document.getElementById('actor-selector-modal');
        selectorModal.classList.add('show');
        selectorModal.style.display = 'block';
        displayActorSelector();
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
                photoEl.src = actor.photo_url;
                photoEl.alt = actor.name;
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
     * Add video - Open modal
     */
    window.addVideoRow = function() {
        const modal = document.getElementById('video-upload-modal');
        modal.classList.add('show');
        modal.style.display = 'block';
        
        // Reset form
        document.getElementById('video-url').value = '';
        document.getElementById('video-file').value = '';
        document.getElementById('video-type').value = 'TRAILER';
        document.getElementById('video-title').value = '';
        
        // Setup source toggle
        setupSourceToggle('video');
        
        // Setup close handlers
        setupModalClose(modal);
    };

    /**
     * Close video modal
     */
    window.closeVideoModal = function() {
        const modal = document.getElementById('video-upload-modal');
        modal.classList.remove('show');
        modal.style.display = 'none';
    };

    /**
     * Save video
     */
    window.saveVideo = async function() {
        const sourceType = document.querySelector('.source-toggle-btn.active[data-target="video"]').dataset.source;
        let videoUrl = '';
        
        if (sourceType === 'url') {
            videoUrl = document.getElementById('video-url').value.trim();
            if (!videoUrl) {
                showAlert('Please enter a video URL', 'error');
                return;
            }
        } else {
            const fileInput = document.getElementById('video-file');
            if (!fileInput.files || !fileInput.files[0]) {
                showAlert('Please select a video file', 'error');
                return;
            }
            
            try {
                videoUrl = await uploadFile(fileInput.files[0], 'videos');
            } catch (error) {
                showAlert('Failed to upload video: ' + error.message, 'error');
                return;
            }
        }
        
        const videoType = document.getElementById('video-type').value;
        const title = document.getElementById('video-title').value.trim();
        
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
        // Check if YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(youtubeRegex);
        
        if (match && match[1]) {
            return `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe>`;
        }
        
        // Prepend API_BASE_URL for uploaded videos (relative paths starting with /)
        const videoSrc = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
        
        // Check if video file
        if (url.match(/\.(mp4|webm|ogg|avi|mov|mkv)$/i)) {
            return `<video width="100%" height="200" controls><source src="${videoSrc}"></video>`;
        }
        
        return `<div class="video-placeholder"><i class="fas fa-video"></i><p>Video Preview</p></div>`;
    }

    // ============ IMAGES MANAGEMENT ============

    /**
     * Add image - Open modal
     */
    window.addImageRow = function() {
        const modal = document.getElementById('image-upload-modal');
        modal.classList.add('show');
        modal.style.display = 'block';
        
        // Reset form
        document.getElementById('image-url').value = '';
        document.getElementById('image-file').value = '';
        document.getElementById('image-type').value = 'POSTER';
        document.getElementById('image-caption').value = '';
        
        // Setup source toggle
        setupSourceToggle('image');
        
        // Setup close handlers
        setupModalClose(modal);
    };

    /**
     * Close image modal
     */
    window.closeImageModal = function() {
        const modal = document.getElementById('image-upload-modal');
        modal.classList.remove('show');
        modal.style.display = 'none';
    };

    /**
     * Save image
     */
    window.saveImage = async function() {
        const sourceType = document.querySelector('.source-toggle-btn.active[data-target="image"]').dataset.source;
        let imageUrl = '';
        
        if (sourceType === 'url') {
            imageUrl = document.getElementById('image-url').value.trim();
            if (!imageUrl) {
                showAlert('Please enter an image URL', 'error');
                return;
            }
        } else {
            const fileInput = document.getElementById('image-file');
            if (!fileInput.files || !fileInput.files[0]) {
                showAlert('Please select an image file', 'error');
                return;
            }
            
            try {
                imageUrl = await uploadFile(fileInput.files[0], 'images');
            } catch (error) {
                showAlert('Failed to upload image: ' + error.message, 'error');
                return;
            }
        }
        
        const imageType = document.getElementById('image-type').value;
        const caption = document.getElementById('image-caption').value.trim();
        
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
            
            // Populate data with proper URL handling
            const imgEl = clone.querySelector('[data-field="image"]');
            const imageSrc = image.image_url.startsWith('/') ? `${API_BASE_URL}${image.image_url}` : image.image_url;
            imgEl.src = imageSrc;
            imgEl.alt = image.caption || 'Movie image';
            imgEl.onerror = function() {
                this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect fill="%23667eea" width="200" height="300"/><text fill="white" x="50%" y="50%" text-anchor="middle" dy=".3em">Image not available</text></svg>';
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

    // ============ UPLOAD & MODAL HELPERS ============

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
     * Setup source toggle buttons
     */
    function setupSourceToggle(target) {
        const buttons = document.querySelectorAll(`.source-toggle-btn[data-target="${target}"]`);
        const urlInput = document.getElementById(`${target}-url-input`);
        const fileInput = document.getElementById(`${target}-file-input`);
        
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all buttons with same target
                buttons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Toggle inputs
                if (this.dataset.source === 'url') {
                    urlInput.style.display = 'block';
                    fileInput.style.display = 'none';
                } else {
                    urlInput.style.display = 'none';
                    fileInput.style.display = 'block';
                }
            });
        });
    }

    /**
     * Setup modal close handlers
     */
    function setupModalClose(modal) {
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.onclick = function() {
            modal.classList.remove('show');
            modal.style.display = 'none';
        };
        
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
            }
        };
    }

})();
