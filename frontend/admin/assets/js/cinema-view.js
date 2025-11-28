/**
 * Cinema View JavaScript - View and manage cinema details, screens, and seats
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    let cinemaId = null;
    let currentCinema = null;
    let currentScreenId = null;
    let currentScreenSeats = [];
    let allScreens = [];
    let currentPage = 1;
    const screensPerPage = 5;

    /**
     * Get cinema ID from URL
     */
    function getCinemaId() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('id'));
    }

    /**
     * Load cinema details
     */
    function loadCinemaDetails() {
        const loadingState = document.getElementById('loading-state');
        const detailsSection = document.getElementById('cinema-details');

        loadingState.style.display = 'block';
        detailsSection.style.display = 'none';

        fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            loadingState.style.display = 'none';

            if (result.success && result.data) {
                currentCinema = result.data;
                displayCinemaInfo(result.data);
                displayScreens(result.data.screens || []);
                detailsSection.style.display = 'block';
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
     * Display cinema information
     */
    function displayCinemaInfo(cinema) {
        document.getElementById('cinema-title').textContent = cinema.name;
        document.getElementById('cinema-name').textContent = cinema.name;
        document.getElementById('cinema-city').textContent = cinema.city || '-';
        document.getElementById('cinema-address').textContent = cinema.address || '-';
        document.getElementById('cinema-phone').textContent = cinema.phone_number || '-';
        
        // Set screens count in both locations (header badge and list if exists)
        const screensCountElements = document.querySelectorAll('#cinema-screens-count');
        screensCountElements.forEach(el => {
            if (el) el.textContent = cinema.total_screens || 0;
        });
    }

    /**
     * Display screens list
     */
    function displayScreens(screens) {
        allScreens = screens;
        currentPage = 1;
        renderScreensPage();
    }

    /**
     * Render screens for current page
     */
    function renderScreensPage() {
        const container = document.getElementById('screens-list');
        const template = document.getElementById('screen-card-template');
        const emptyTemplate = document.getElementById('empty-screens-template');

        container.innerHTML = '';

        if (allScreens.length === 0) {
            const emptyClone = emptyTemplate.content.cloneNode(true);
            container.appendChild(emptyClone);
            document.getElementById('screens-pagination-container').style.display = 'none';
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(allScreens.length / screensPerPage);
        const startIndex = (currentPage - 1) * screensPerPage;
        const endIndex = startIndex + screensPerPage;
        const screensToDisplay = allScreens.slice(startIndex, endIndex);

        // Render screens
        screensToDisplay.forEach(screen => {
            const clone = template.content.cloneNode(true);
            const row = clone.querySelector('tr');
            
            // Populate data fields
            clone.querySelector('[data-field="screen_name"]').textContent = screen.screen_name;
            clone.querySelector('[data-field="screen_type"]').textContent = screen.screen_type || 'STANDARD';
            clone.querySelector('[data-field="total_seats"]').textContent = screen.total_seats || 0;
            clone.querySelector('[data-field="available_seats"]').textContent = screen.seat_count || 0;
            
            // Attach event listeners
            clone.querySelector('[data-action="view-seats"]').addEventListener('click', () => 
                viewScreenSeats(screen.screen_id, screen.screen_name)
            );
            clone.querySelector('[data-action="edit"]').addEventListener('click', () => 
                editScreen(screen.screen_id)
            );
            clone.querySelector('[data-action="delete"]').addEventListener('click', () => 
                deleteScreen(screen.screen_id, screen.screen_name)
            );
            
            container.appendChild(clone);
        });

        // Display pagination
        displayScreensPagination(totalPages);
    }

    /**
     * Display pagination for screens
     */
    function displayScreensPagination(totalPages) {
        const paginationContainer = document.getElementById('screens-pagination-container');
        const pagination = document.getElementById('screens-pagination');
        const paginationInfo = document.getElementById('screens-pagination-info');

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        pagination.innerHTML = '';

        // Previous button
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', () => changeScreenPage(currentPage - 1));
            pagination.appendChild(prevBtn);
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn active';
                pageBtn.textContent = i;
                pagination.appendChild(pageBtn);
            } else if (
                i === 1 || 
                i === totalPages || 
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn';
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => changeScreenPage(i));
                pagination.appendChild(pageBtn);
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                const dots = document.createElement('span');
                dots.className = 'page-dots';
                dots.textContent = '...';
                pagination.appendChild(dots);
            }
        }

        // Next button
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', () => changeScreenPage(currentPage + 1));
            pagination.appendChild(nextBtn);
        }

        // Info text
        const startIndex = (currentPage - 1) * screensPerPage + 1;
        const endIndex = Math.min(currentPage * screensPerPage, allScreens.length);
        paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${allScreens.length} screens`;
    }

    /**
     * Change screen page
     */
    function changeScreenPage(page) {
        currentPage = page;
        renderScreensPage();
    }

    /**
     * Setup cinema action events
     */
    function setupCinemaEvents() {
        // Edit cinema button
        const editBtn = document.getElementById('edit-cinema-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                window.location.href = `cinema-edit.html?id=${cinemaId}`;
            });
        }

        // Delete cinema button  
        const deleteBtn = document.getElementById('delete-cinema-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (!confirm(`Are you sure you want to delete "${currentCinema.name}"?\n\nThis will delete all screens, seats, and showtimes. This action cannot be undone.`)) {
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
                        setTimeout(() => window.location.href = 'cinemas.html', 1500);
                    } else {
                        showAlert(result.message || 'Failed to delete cinema', 'error');
                    }
                })
                .catch(error => {
                    showAlert('Error: ' + error.message, 'error');
                });
            });
        }
    }

    // ==================== ADD SCREEN ====================

    let currentEditingScreen = null;
    let currentSeatData = [];
    let tempScreenData = null;

    function setupAddScreenEvents() {
        const addScreenBtn = document.getElementById('add-screen-btn');
        if (addScreenBtn) {
            console.log('Add Screen button found, attaching event listener');
            addScreenBtn.addEventListener('click', function() {
                console.log('Add Screen button clicked');
                openAddScreenModal();
            });
        } else {
            console.error('Add Screen button not found');
        }
    }

    window.openAddScreenModal = function() {
        console.log('openAddScreenModal called');
        const modal = document.getElementById('add-screen-modal');
        
        if (!modal) {
            console.error('Add screen modal not found');
            return;
        }
        
        console.log('Opening modal');
        modal.classList.add('active');
        
        // Reset form
        document.getElementById('screen-name').value = '';
        document.getElementById('screen-type').value = 'STANDARD';
        
        console.log('Modal opened successfully');
    };

    window.closeAddScreenModal = function() {
        const modal = document.getElementById('add-screen-modal');
        const form = document.getElementById('add-screen-form');
        
        if (modal) modal.classList.remove('active');
        if (form) form.reset();
        
        // Don't reset tempScreenData here as it's needed for the seat modal
        // tempScreenData will be reset when seat modal is closed
        currentSeatData = [];
    };

    function setupAddScreenFormEvent() {
        const form = document.getElementById('add-screen-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const screenNameInput = document.getElementById('screen-name');
                const screenTypeInput = document.getElementById('screen-type');
                
                if (!screenNameInput) {
                    showAlert('Form error: Screen name input not found', 'error');
                    return;
                }
                
                // Store screen data temporarily
                tempScreenData = {
                    name: screenNameInput.value.trim(),
                    type: screenTypeInput ? screenTypeInput.value : 'STANDARD'
                };
                
                if (!tempScreenData.name) {
                    showAlert('Please enter screen name', 'error');
                    return;
                }
                
                // Close add screen modal and open seat modal
                closeAddScreenModal();
                openSeatModal();
            });
        }
    }

    /**
     * Open seat configuration modal for new screen
     */
    function openSeatModal() {
        if (!tempScreenData || !tempScreenData.name) {
            showAlert('Screen data not found. Please try again.', 'error');
            return;
        }
        
        // Update modal title
        document.getElementById('modal-screen-title').textContent = `${tempScreenData.name} - Seats`;

        // Reset seat data
        currentSeatData = [];
        
        // Add default rows
        const defaultRows = ['A', 'B', 'C', 'D', 'E'];
        defaultRows.forEach(letter => {
            const rowData = {
                row: letter,
                seats: []
            };
            
            for (let i = 1; i <= 10; i++) {
                rowData.seats.push({
                    row: letter,
                    number: i,
                    type: 'REGULAR'
                });
            }
            
            currentSeatData.push(rowData);
        });

        renderSeatGrid();
        
        // Show modal
        document.getElementById('seat-modal').classList.add('active');
    }

    /**
     * Close seat configuration modal
     */
    window.closeSeatModal = function() {
        document.getElementById('seat-modal').classList.remove('active');
        currentEditingScreen = null;
        currentSeatData = [];
        tempScreenData = null;
    };

    /**
     * Open add row modal
     */
    window.addSeatRow = function() {
        // Find next available row letter
        const usedLetters = currentSeatData.map(r => r.row);
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let nextLetter = 'A';
        
        for (let i = 0; i < alphabet.length; i++) {
            if (!usedLetters.includes(alphabet[i])) {
                nextLetter = alphabet[i];
                break;
            }
        }

        // Set default values
        document.getElementById('new-row-letter').value = nextLetter;
        document.getElementById('new-seat-count').value = 10;
        document.getElementById('new-seat-type').value = 'REGULAR';

        // Show add row modal
        document.getElementById('add-row-modal').classList.add('active');
    };

    /**
     * Open add individual seat modal
     */
    window.addIndividualSeat = function() {
        // Populate row options
        const rowSelect = document.getElementById('individual-row-letter');
        rowSelect.innerHTML = '<option value="">Select Row</option>';
        
        currentSeatData.forEach(rowData => {
            const option = document.createElement('option');
            option.value = rowData.row;
            option.textContent = `Row ${rowData.row} (${rowData.seats.length} seats)`;
            rowSelect.appendChild(option);
        });

        // Add "New Row" option
        const newRowOption = document.createElement('option');
        newRowOption.value = 'NEW_ROW';
        newRowOption.textContent = '+ Create New Row';
        rowSelect.appendChild(newRowOption);

        // Reset other fields
        document.getElementById('individual-seat-number').value = '';
        document.getElementById('individual-seat-type').value = 'REGULAR';

        // Show add individual modal
        document.getElementById('add-individual-modal').classList.add('active');
    };

    /**
     * Close add individual modal
     */
    window.closeAddIndividualModal = function() {
        document.getElementById('add-individual-modal').classList.remove('active');
    };

    /**
     * Confirm add individual seat
     */
    window.confirmAddIndividualSeat = function() {
        const rowLetter = document.getElementById('individual-row-letter').value.trim().toUpperCase();
        const seatNumber = parseInt(document.getElementById('individual-seat-number').value);
        const seatType = document.getElementById('individual-seat-type').value;

        if (!rowLetter || rowLetter === '') {
            showAlert('Please select a row', 'error');
            return;
        }

        if (!seatNumber || seatNumber < 1) {
            showAlert('Please enter a valid seat number', 'error');
            return;
        }

        // Handle new row creation
        if (rowLetter === 'NEW_ROW') {
            const newRowLetter = prompt('Enter new row letter:');
            if (!newRowLetter) return;
            
            const rowData = {
                row: newRowLetter.toUpperCase(),
                seats: [{
                    row: newRowLetter.toUpperCase(),
                    number: seatNumber,
                    type: seatType
                }]
            };
            
            currentSeatData.push(rowData);
            currentSeatData.sort((a, b) => a.row.localeCompare(b.row));
        } else {
            // Add to existing row
            const rowData = currentSeatData.find(r => r.row === rowLetter);
            if (rowData) {
                // Check if seat number already exists
                if (rowData.seats.some(s => s.number === seatNumber)) {
                    showAlert(`Seat ${seatNumber} already exists in row ${rowLetter}`, 'error');
                    return;
                }
                
                rowData.seats.push({
                    row: rowLetter,
                    number: seatNumber,
                    type: seatType
                });
                
                // Sort seats by number
                rowData.seats.sort((a, b) => a.number - b.number);
            }
        }

        renderSeatGrid();
        closeAddIndividualModal();
    };

    /**
     * Close add row modal
     */
    window.closeAddRowModal = function() {
        document.getElementById('add-row-modal').classList.remove('active');
    };

    /**
     * Confirm add row
     */
    window.confirmAddRow = function() {
        const rowLetter = document.getElementById('new-row-letter').value.trim().toUpperCase();
        const seatCount = parseInt(document.getElementById('new-seat-count').value);
        const seatType = document.getElementById('new-seat-type').value;

        if (!rowLetter) {
            showAlert('Please enter a row letter', 'error');
            return;
        }

        if (currentSeatData.some(r => r.row === rowLetter)) {
            showAlert(`Row ${rowLetter} already exists`, 'error');
            return;
        }

        if (seatCount < 1 || seatCount > 50) {
            showAlert('Number of seats must be between 1 and 50', 'error');
            return;
        }

        // Add new row
        const rowData = {
            row: rowLetter,
            seats: []
        };

        for (let i = 1; i <= seatCount; i++) {
            rowData.seats.push({
                row: rowLetter,
                number: i,
                type: seatType
            });
        }

        currentSeatData.push(rowData);
        
        // Sort by row letter
        currentSeatData.sort((a, b) => a.row.localeCompare(b.row));

        renderSeatGrid();
        closeAddRowModal();
        showInlineNotification(`Row ${rowLetter} added successfully`, 'success');
    };

    /**
     * Render seat grid
     */
    function renderSeatGrid() {
        const container = document.getElementById('seat-grid');
        container.innerHTML = '';

        if (currentSeatData.length === 0) {
            container.innerHTML = '<p class="no-seats">No seats configured yet. Add rows or individual seats.</p>';
            return;
        }

        currentSeatData.forEach(rowData => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';
            
            const rowLabel = document.createElement('div');
            rowLabel.className = 'seat-row-label';
            rowLabel.textContent = rowData.row;
            rowDiv.appendChild(rowLabel);
            
            const seatsContainer = document.createElement('div');
            seatsContainer.className = 'seat-row-seats';
            
            rowData.seats.forEach(seat => {
                const seatDiv = document.createElement('div');
                seatDiv.className = `seat seat-${seat.type.toLowerCase()}`;
                seatDiv.textContent = seat.number;
                seatDiv.setAttribute('data-row', seat.row);
                seatDiv.setAttribute('data-number', seat.number);
                seatDiv.setAttribute('data-type', seat.type);
                
                // Add click event for selection
                seatDiv.addEventListener('click', function() {
                    this.classList.toggle('selected');
                });
                
                seatsContainer.appendChild(seatDiv);
            });
            
            rowDiv.appendChild(seatsContainer);
            container.appendChild(rowDiv);
        });
    }

    /**
     * Apply bulk type change to selected seats
     */
    window.applyBulkTypeChange = function() {
        const newType = document.getElementById('bulk-seat-type').value;
        const selectedSeats = document.querySelectorAll('.seat.selected');

        if (!newType) {
            showAlert('Please select a seat type', 'warning');
            return;
        }

        if (selectedSeats.length === 0) {
            showAlert('Please select seats to change', 'warning');
            return;
        }

        let changedCount = 0;
        selectedSeats.forEach(seat => {
            const row = seat.getAttribute('data-row');
            const number = parseInt(seat.getAttribute('data-number'));
            
            // Update in data
            const rowData = currentSeatData.find(r => r.row === row);
            if (rowData) {
                const seatData = rowData.seats.find(s => s.number === number);
                if (seatData) {
                    seatData.type = newType;
                    changedCount++;
                }
            }
        });

        // Reset selection
        document.getElementById('bulk-seat-type').value = '';
        
        renderSeatGrid();
        showInlineNotification(`Changed ${changedCount} seat(s) to ${newType}`, 'success');
    };

    /**
     * Save seat configuration for new screen
     */
    window.saveSeatConfiguration = function() {
        if (!tempScreenData) {
            showAlert('No screen data found', 'error');
            return;
        }

        if (currentSeatData.length === 0) {
            showAlert('Please add at least one seat', 'error');
            return;
        }

        // Convert seat data to API format
        const seats = [];
        currentSeatData.forEach(rowData => {
            rowData.seats.forEach(seat => {
                seats.push({
                    seat_row: seat.row,
                    seat_number: seat.number,
                    seat_type: seat.type
                });
            });
        });

        // Create screen and seats
        createScreenWithSeats(tempScreenData, seats);
    };

    /**
     * Create screen with seats
     */
    async function createScreenWithSeats(screenData, seats) {
        try {
            // First create the screen
            const screenResult = await fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    screen_name: screenData.name,
                    screen_type: screenData.type
                })
            }).then(handleResponse);

            if (!screenResult.success) {
                throw new Error(screenResult.message || 'Failed to create screen');
            }

            const screenId = screenResult.data.screen_id;

            // Then create all seats
            const seatsResult = await fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${screenId}/seats`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ seats: seats })
            }).then(handleResponse);

            if (!seatsResult.success) {
                throw new Error(seatsResult.message || 'Failed to create seats');
            }

            showAlert('Screen created successfully with seats', 'success');
            closeSeatModal();
            loadCinemaDetails();
        } catch (error) {
            showAlert('Error: ' + error.message, 'error');
        }
    }

    /**
     * Show inline notification
     */
    function showInlineNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `inline-notification ${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    };

    // ==================== EDIT SCREEN ====================

    window.editScreen = function(screenId) {
        // Find screen data
        const screen = currentCinema.screens.find(s => s.screen_id === screenId);
        if (!screen) return;

        // Populate form
        document.getElementById('edit-screen-id').value = screenId;
        document.getElementById('edit-screen-name').value = screen.screen_name;
        document.getElementById('edit-screen-type').value = screen.screen_type || 'STANDARD';

        // Open modal
        document.getElementById('edit-screen-modal').classList.add('active');
    };

    window.closeEditScreenModal = function() {
        const modal = document.getElementById('edit-screen-modal');
        const form = document.getElementById('edit-screen-form');
        
        if (modal) modal.classList.remove('active');
        if (form) form.reset();
    };

    function setupEditScreenFormEvent() {
        const form = document.getElementById('edit-screen-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                const screenId = document.getElementById('edit-screen-id').value;
                const screenData = {
                    screen_name: document.getElementById('edit-screen-name').value.trim(),
                    screen_type: document.getElementById('edit-screen-type').value
                };

                fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${screenId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(screenData)
                })
                .then(handleResponse)
                .then(result => {
                    if (result.success) {
                        showAlert('Screen updated successfully', 'success');
                        closeEditScreenModal();
                        loadCinemaDetails();
                    } else {
                        showAlert(result.message || 'Failed to update screen', 'error');
                    }
                })
                .catch(error => {
                    showAlert('Error: ' + error.message, 'error');
                });
            });
        }
    }

    // ==================== DELETE SCREEN ====================

    window.deleteScreen = function(screenId, screenName) {
        if (!confirm(`Delete screen "${screenName}"?\n\nThis will also delete all seats. This action cannot be undone.`)) {
            return;
        }

        fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${screenId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Screen deleted successfully', 'success');
                loadCinemaDetails();
            } else {
                showAlert(result.message || 'Failed to delete screen', 'error');
            }
        })
        .catch(error => {
            showAlert('Error: ' + error.message, 'error');
        });
    };

    // ==================== VIEW/MANAGE SEATS ====================

    window.viewScreenSeats = function(screenId, screenName) {
        currentScreenId = screenId;
        document.getElementById('seats-modal-title').textContent = `${screenName} - Seats`;

        // Load seats
        fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${screenId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success && result.data) {
                currentScreenSeats = result.data.seats || {};
                displaySeatsGrid(result.data.seats || {});
                document.getElementById('view-seats-modal').classList.add('active');
            } else {
                showAlert('Failed to load seats', 'error');
            }
        })
        .catch(error => {
            showAlert('Error loading seats: ' + error.message, 'error');
        });
    };

    window.closeViewSeatsModal = function() {
        document.getElementById('view-seats-modal').classList.remove('active');
        currentScreenId = null;
        currentScreenSeats = [];
    };

    /**
     * Display seats grid
     */
    function displaySeatsGrid(seatsByRow) {
        const container = document.getElementById('seats-grid-container');
        const gridTemplate = document.getElementById('seats-grid-template');
        const rowTemplate = document.getElementById('seat-row-template');
        const seatTemplate = document.getElementById('seat-template');
        const emptyTemplate = document.getElementById('empty-seats-template');

        container.innerHTML = '';

        if (Object.keys(seatsByRow).length === 0) {
            const emptyClone = emptyTemplate.content.cloneNode(true);
            container.appendChild(emptyClone);
            return;
        }

        const gridClone = gridTemplate.content.cloneNode(true);
        const rowsContainer = gridClone.querySelector('[data-seats-rows]');

        // Sort rows alphabetically
        const rows = Object.keys(seatsByRow).sort();

        rows.forEach(rowLabel => {
            const rowClone = rowTemplate.content.cloneNode(true);
            
            // Set row label
            rowClone.querySelector('[data-row-label]').textContent = rowLabel;
            
            const seatsContainer = rowClone.querySelector('[data-seats-container]');
            const seats = seatsByRow[rowLabel].sort((a, b) => a.seat_number - b.seat_number);

            seats.forEach(seat => {
                const seatClone = seatTemplate.content.cloneNode(true);
                const seatElement = seatClone.querySelector('.seat');
                
                // Add seat classes
                seatElement.classList.add(`seat-${seat.seat_type.toLowerCase()}`);
                if (!seat.is_available) {
                    seatElement.classList.add('unavailable');
                }
                
                // Set attributes
                seatElement.setAttribute('data-seat-id', seat.seat_id);
                seatElement.setAttribute('data-seat-type', seat.seat_type);
                seatElement.title = `Row ${seat.seat_row}, Seat ${seat.seat_number} - ${seat.seat_type}`;
                
                // Set seat number
                seatClone.querySelector('[data-seat-number]').textContent = seat.seat_number;
                
                // Attach click event
                seatElement.addEventListener('click', () => toggleSeatSelection(seat.seat_id));
                
                seatsContainer.appendChild(seatClone);
            });

            rowsContainer.appendChild(rowClone);
        });

        container.appendChild(gridClone);
    }

    /**
     * Toggle seat selection for batch operations
     */
    window.toggleSeatSelection = function(seatId) {
        const seatElement = document.querySelector(`[data-seat-id="${seatId}"]`);
        if (seatElement) {
            seatElement.classList.toggle('selected');
        }
    };

    /**
     * Get next available row letter
     */
    function getNextRowLetter() {
        if (!currentScreenSeats || Object.keys(currentScreenSeats).length === 0) {
            return 'A';
        }
        
        const existingRows = Object.keys(currentScreenSeats).sort();
        const lastRow = existingRows[existingRows.length - 1];
        
        // Get next letter in alphabet
        const nextCharCode = lastRow.charCodeAt(0) + 1;
        return String.fromCharCode(nextCharCode);
    }

    /**
     * Open Add Seat Modal
     */
    window.openAddSeatModal = function() {
        const modal = document.getElementById('add-seat-modal');
        modal.classList.add('active');
        document.querySelector('.add-seat-options').style.display = 'grid';
        document.getElementById('new-row-form').style.display = 'none';
        document.getElementById('existing-row-form').style.display = 'none';
        
        populateExistingRows();
    };

    /**
     * Close Add Seat Modal
     */
    window.closeAddSeatModal = function() {
        const modal = document.getElementById('add-seat-modal');
        modal.classList.remove('active');
        document.getElementById('new-row-form').reset();
        document.getElementById('existing-row-form').reset();
    };

    /**
     * Select add option
     */
    window.selectAddOption = function(option) {
        document.querySelector('.add-seat-options').style.display = 'none';
        
        if (option === 'new-row') {
            // Auto-populate next row letter
            const nextLetter = getNextRowLetter();
            const newRowLetterInput = document.getElementById('new-row-letter');
            if (newRowLetterInput) {
                newRowLetterInput.value = nextLetter;
            }
            document.getElementById('new-row-form').style.display = 'block';
        } else {
            // Populate existing rows dropdown
            populateExistingRows();
            document.getElementById('existing-row-form').style.display = 'block';
        }
    };

    /**
     * Back to options
     */
    window.backToOptions = function() {
        document.querySelector('.add-seat-options').style.display = 'grid';
        document.getElementById('new-row-form').style.display = 'none';
        document.getElementById('existing-row-form').style.display = 'none';
    };

    /**
     * Populate existing rows dropdown
     */
    function populateExistingRows() {
        const select = document.getElementById('existing-row-select');
        select.innerHTML = '<option value="">-- Select Row --</option>';
        
        const rows = Object.keys(currentScreenSeats).sort();
        rows.forEach(row => {
            const option = document.createElement('option');
            option.value = row;
            option.textContent = `Row ${row} (${currentScreenSeats[row].length} seats)`;
            select.appendChild(option);
        });
    }

    /**
     * Setup seat form events
     */
    function setupSeatFormEvents() {
        // New row form
        const newRowForm = document.getElementById('new-row-form');
        if (newRowForm) {
            newRowForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const rowLetter = document.getElementById('new-row-letter').value.trim().toUpperCase();
                const seatCount = parseInt(document.getElementById('new-row-seats').value);
                const seatType = document.getElementById('new-row-type').value;

                // Validation
                if (!rowLetter || rowLetter.length !== 1 || !/^[A-Z]$/.test(rowLetter)) {
                    showAlert('Please enter a valid row letter (A-Z)', 'error');
                    return;
                }

                if (currentScreenSeats && currentScreenSeats[rowLetter]) {
                    showAlert(`Row ${rowLetter} already exists. Please choose a different letter.`, 'error');
                    return;
                }

                if (seatCount < 1 || seatCount > 50) {
                    showAlert('Please enter a valid number of seats (1-50)', 'error');
                    return;
                }

                const seats = [];
                for (let i = 1; i <= seatCount; i++) {
                    seats.push({
                        seat_row: rowLetter,
                        seat_number: i,
                        seat_type: seatType
                    });
                }

                fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${currentScreenId}/seats`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ seats: seats })
                })
                .then(handleResponse)
                .then(result => {
                    if (result.success) {
                        showAlert(`Added row ${rowLetter} with ${seatCount} seats successfully`, 'success');
                        closeAddSeatModal();
                        viewScreenSeats(currentScreenId, document.getElementById('seats-modal-title').textContent.split(' - ')[0]);
                    } else {
                        showAlert(result.message || 'Failed to add seats', 'error');
                    }
                })
                .catch(error => {
                    showAlert('Error: ' + error.message, 'error');
                });
            });
        }

        // Existing row form
        const existingRowForm = document.getElementById('existing-row-form');
        if (existingRowForm) {
            existingRowForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const rowLetter = document.getElementById('existing-row-select').value;
                const seatCount = parseInt(document.getElementById('existing-row-seats').value);
                const seatType = document.getElementById('existing-row-type').value;

                if (!rowLetter) {
                    showAlert('Please select a row', 'warning');
                    return;
                }

                // Find the highest seat number in the existing row
                const existingSeats = currentScreenSeats[rowLetter] || [];
                const maxSeatNumber = existingSeats.length > 0 
                    ? Math.max(...existingSeats.map(s => s.seat_number)) 
                    : 0;

                const seats = [];
                for (let i = 1; i <= seatCount; i++) {
                    seats.push({
                        seat_row: rowLetter,
                        seat_number: maxSeatNumber + i,
                        seat_type: seatType
                    });
                }

                fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${currentScreenId}/seats`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ seats: seats })
                })
                .then(handleResponse)
                .then(result => {
                    if (result.success) {
                        showAlert(`Added ${seatCount} seat(s) to row ${rowLetter} successfully`, 'success');
                        closeAddSeatModal();
                        viewScreenSeats(currentScreenId, document.getElementById('seats-modal-title').textContent.split(' - ')[0]);
                    } else {
                        showAlert(result.message || 'Failed to add seats', 'error');
                    }
                })
                .catch(error => {
                    showAlert('Error: ' + error.message, 'error');
                });
            });
        }
    }

    /**
     * Change type of selected seats
     */
    window.changeSelectedSeatsType = function() {
        const newType = document.getElementById('change-type-select').value;
        
        if (!newType) {
            showAlert('Please select a seat type', 'warning');
            return;
        }

        const selectedSeats = document.querySelectorAll('#seats-grid-container .seat.selected');
        
        if (selectedSeats.length === 0) {
            showAlert('No seats selected', 'warning');
            return;
        }

        // Get seat IDs and filter out invalid ones
        const seatIds = Array.from(selectedSeats)
            .map(el => {
                const seatId = el.getAttribute('data-seat-id');
                return seatId ? parseInt(seatId) : null;
            })
            .filter(id => id !== null && !isNaN(id));

        if (seatIds.length === 0) {
            showAlert('Invalid seat selection', 'error');
            return;
        }

        // Update each seat using existing update API
        const updatePromises = seatIds.map(seatId => {
            return fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${currentScreenId}/seats/${seatId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ seat_type: newType })
            }).then(handleResponse);
        });

        Promise.all(updatePromises)
        .then(results => {
            const allSuccess = results.every(r => r.success);
            if (allSuccess) {
                showAlert(`Changed ${seatIds.length} seat(s) to ${newType} successfully`, 'success');
                document.getElementById('change-type-select').value = '';
                viewScreenSeats(currentScreenId, document.getElementById('seats-modal-title').textContent.split(' - ')[0]);
            } else {
                showAlert('Some seats failed to update', 'error');
            }
        })
        .catch(error => {
            showAlert('Error: ' + error.message, 'error');
        });
    };

    /**
     * Delete selected seats from temporary configuration (for seat creation modal)
     */
    window.deleteSelectedSeatsFromConfig = function() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        
        if (selectedSeats.length === 0) {
            showAlert('No seats selected', 'warning');
            return;
        }

        if (!confirm(`Remove ${selectedSeats.length} selected seat(s) from configuration?`)) {
            return;
        }

        // Remove selected seats from currentSeatData
        selectedSeats.forEach(seatEl => {
            const row = seatEl.getAttribute('data-row');
            const number = parseInt(seatEl.getAttribute('data-number'));
            
            // Find the row in currentSeatData
            const rowData = currentSeatData.find(r => r.row === row);
            if (rowData) {
                // Remove the seat from the row
                rowData.seats = rowData.seats.filter(seat => seat.number !== number);
                
                // If row is empty, remove the entire row
                if (rowData.seats.length === 0) {
                    const rowIndex = currentSeatData.indexOf(rowData);
                    currentSeatData.splice(rowIndex, 1);
                }
            }
        });

        // Re-render the seat grid
        renderSeatGrid();
        showInlineNotification('Selected seats removed from configuration', 'success');
    };

    /**
     * Delete selected seats (for existing screen view)
     */
    window.deleteSelectedSeats = function() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        
        if (selectedSeats.length === 0) {
            showAlert('No seats selected', 'warning');
            return;
        }

        if (!confirm(`Delete ${selectedSeats.length} selected seat(s)?`)) {
            return;
        }

        const seatIds = Array.from(selectedSeats).map(el => parseInt(el.getAttribute('data-seat-id')));

        fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${currentScreenId}/seats/bulk-delete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ seat_ids: seatIds })
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Seats deleted successfully', 'success');
                viewScreenSeats(currentScreenId, document.getElementById('seats-modal-title').textContent.split(' - ')[0]);
            } else {
                showAlert(result.message || 'Failed to delete seats', 'error');
            }
        })
        .catch(error => {
            showAlert('Error: ' + error.message, 'error');
        });
    };

    /**
     * Show action tooltip next to button
     */
    function showActionTooltip(tooltipId, message, type = 'info') {
        const tooltip = document.getElementById(tooltipId);
        if (!tooltip) return;

        tooltip.textContent = message;
        tooltip.className = `action-tooltip ${type}`;
        tooltip.classList.add('show');

        // Auto-hide after 2 seconds
        setTimeout(() => {
            tooltip.classList.remove('show');
        }, 2000);
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

        // Setup all event listeners
        setupCinemaEvents();
        setupAddScreenEvents();
        setupAddScreenFormEvent();
        setupEditScreenFormEvent();
        setupSeatFormEvents();

        loadCinemaDetails();
    }

    // ==================== DELETE SCREEN ====================

    window.deleteScreen = function(screenId, screenName) {
        if (!confirm(`Delete screen "${screenName}"?\n\nThis will also delete all seats. This action cannot be undone.`)) {
            return;
        }

        fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${screenId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(handleResponse)
        .then(result => {
            if (result.success) {
                showAlert('Screen deleted successfully', 'success');
                loadCinemaDetails();
            } else {
                showAlert(result.message || 'Failed to delete screen', 'error');
            }
        })
        .catch(error => {
            showAlert('Error: ' + error.message, 'error');
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
