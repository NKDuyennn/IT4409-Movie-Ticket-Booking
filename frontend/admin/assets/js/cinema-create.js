/**
 * Cinema Create JavaScript - Multi-step form
 */
(function() {
    'use strict';

    const API_BASE_URL = window.CONFIG ? CONFIG.API_URL : 'http://localhost:5000';

    let currentStep = 1;
    let screens = [];
    let screenIdCounter = 0;

    /**
     * Navigate to next step
     */
    window.nextStep = function(step) {
        // Validate current step before proceeding
        if (currentStep === 1 && !validateCinemaInfo()) {
            return;
        }

        if (currentStep === 2 && screens.length === 0) {
            showAlert('Please add at least one screen', 'warning');
            return;
        }

        // Hide current step
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        
        // Show next step
        document.getElementById(`step-${step}`).classList.add('active');
        currentStep = step;

        // If moving to step 3, generate seat configuration forms
        if (step === 3) {
            generateSeatConfigurations();
        }
    };

    /**
     * Navigate to previous step
     */
    window.prevStep = function(step) {
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        document.getElementById(`step-${step}`).classList.add('active');
        currentStep = step;
    };

    /**
     * Validate cinema information
     */
    function validateCinemaInfo() {
        const name = document.getElementById('cinema-name').value.trim();
        const address = document.getElementById('cinema-address').value.trim();
        const city = document.getElementById('cinema-city').value;

        if (!name) {
            showAlert('Cinema name is required', 'error');
            return false;
        }

        if (!address) {
            showAlert('Address is required', 'error');
            return false;
        }

        if (!city) {
            showAlert('City is required', 'error');
            return false;
        }

        return true;
    }

    /**
     * Add a new screen row
     */
    window.addScreenRow = function() {
        screenIdCounter++;
        const screenId = `screen-${screenIdCounter}`;
        
        const template = document.getElementById('screen-row-template');
        const clone = template.content.cloneNode(true);
        const screenRow = clone.querySelector('.screen-row');
        
        // Set screen ID
        screenRow.id = screenId;
        screenRow.setAttribute('data-screen-id', screenId);
        
        // Set screen title
        clone.querySelector('[data-screen-title]').textContent = `Screen ${screenIdCounter}`;
        
        // Attach remove button event
        clone.querySelector('[data-action="remove"]').addEventListener('click', () => removeScreenRow(screenId));

        document.getElementById('screens-container').appendChild(clone);

        // Add to screens array
        screens.push({
            id: screenId,
            name: '',
            type: 'STANDARD',
            totalSeats: 0,
            seatConfig: null
        });
    };

    /**
     * Remove a screen row
     */
    window.removeScreenRow = function(screenId) {
        const element = document.getElementById(screenId);
        if (element) {
            element.remove();
        }

        // Remove from screens array
        screens = screens.filter(s => s.id !== screenId);
    };

    /**
     * Collect screen data from form
     */
    function collectScreenData() {
        const updatedScreens = [];

        screens.forEach(screen => {
            const screenElement = document.getElementById(screen.id);
            if (!screenElement) return;

            const name = screenElement.querySelector('.screen-name').value.trim();
            const type = screenElement.querySelector('.screen-type').value;

            if (name) {
                updatedScreens.push({
                    ...screen,
                    name: name,
                    type: type
                });
            }
        });

        screens = updatedScreens;
    }

    /**
     * Generate seat configuration forms for all screens
     */
    function generateSeatConfigurations() {
        collectScreenData();

        const container = document.getElementById('seats-container');
        const template = document.getElementById('screen-card-template');
        container.innerHTML = '';

        screens.forEach((screen) => {
            console.log('Generating config for screen:', screen.id, 'seatConfig:', screen.seatConfig);
            
            const clone = template.content.cloneNode(true);
            
            // Set screen card data
            const screenCard = clone.querySelector('[data-screen-card]');
            screenCard.dataset.screenId = screen.id;
            
            // Set title
            clone.querySelector('[data-card-title]').textContent = screen.name;
            
            // Set seat count (support both old and new format)
            let seatCount = 0;
            if (screen.seatConfig) {
                if (screen.seatConfig.seats) {
                    // New format: individual seats
                    seatCount = screen.seatConfig.seats.length;
                } else if (screen.seatConfig.rows) {
                    // Old format: row configs
                    seatCount = screen.seatConfig.rows.reduce((total, row) => total + row.seatCount, 0);
                }
            }
            
            console.log('Calculated seat count for screen', screen.id, ':', seatCount);
            clone.querySelector('[data-seat-count]').textContent = `${seatCount} seats`;
            
            // Show appropriate message/preview
            if (seatCount === 0) {
                clone.querySelector('[data-no-seats]').style.display = 'block';
                clone.querySelector('[data-seat-preview]').style.display = 'none';
            } else {
                clone.querySelector('[data-no-seats]').style.display = 'none';
                clone.querySelector('[data-seat-preview]').style.display = 'block';
                
                // Add seat type breakdown if using new format
                if (screen.seatConfig.seats) {
                    const seatsByType = { REGULAR: 0, VIP: 0, COUPLE: 0 };
                    screen.seatConfig.seats.forEach(seat => {
                        if (seatsByType.hasOwnProperty(seat.type)) {
                            seatsByType[seat.type]++;
                        }
                    });
                    
                    const previewElement = clone.querySelector('[data-seat-preview]');
                    previewElement.innerHTML = `
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.7);">
                            Regular: ${seatsByType.REGULAR}, VIP: ${seatsByType.VIP}, Couple: ${seatsByType.COUPLE}
                        </div>
                    `;
                }
            }
            
            // Setup configure seats button
            const configBtn = clone.querySelector('[data-action="configure-seats"]');
            configBtn.addEventListener('click', () => {
                openSeatModal(screen.id);
            });
            
            container.appendChild(clone);
        });
    }

    let currentEditingScreen = null;
    let currentSeatData = [];

    /**
     * Open seat configuration modal
     */
    function openSeatModal(screenId) {
        currentEditingScreen = screens.find(s => s.id === screenId);
        if (!currentEditingScreen) return;

        // Update modal title
        document.getElementById('modal-screen-title').textContent = `${currentEditingScreen.name} - Seats`;

        // Load existing seat data
        currentSeatData = [];
        if (currentEditingScreen.seatConfig && currentEditingScreen.seatConfig.seats) {
            // Group seats by row
            const seatsByRow = {};
            currentEditingScreen.seatConfig.seats.forEach(seat => {
                if (!seatsByRow[seat.row]) {
                    seatsByRow[seat.row] = [];
                }
                seatsByRow[seat.row].push({
                    row: seat.row,
                    number: seat.number,
                    type: seat.type
                });
            });

            // Convert to currentSeatData format
            Object.keys(seatsByRow).forEach(row => {
                currentSeatData.push({
                    row: row,
                    seats: seatsByRow[row].sort((a, b) => a.number - b.number)
                });
            });
            
            // Sort rows alphabetically
            currentSeatData.sort((a, b) => a.row.localeCompare(b.row));
        } else if (currentEditingScreen.seatConfig && currentEditingScreen.seatConfig.rows) {
            // Legacy format support
            currentEditingScreen.seatConfig.rows.forEach(rowConfig => {
                const rowData = {
                    row: rowConfig.rowLetter,
                    seats: []
                };
                
                for (let i = 1; i <= rowConfig.seatCount; i++) {
                    rowData.seats.push({
                        row: rowConfig.rowLetter,
                        number: i,
                        type: rowConfig.seatType
                    });
                }
                
                currentSeatData.push(rowData);
            });
        }

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
            option.textContent = `Row ${rowData.row}`;
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
            showInlineNotification('Please select a row', 'warning');
            return;
        }

        if (!seatNumber || seatNumber < 1) {
            showInlineNotification('Please enter a valid seat number', 'warning');
            return;
        }

        // Handle new row creation
        if (rowLetter === 'NEW_ROW') {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const usedLetters = currentSeatData.map(r => r.row);
            let newRowLetter = 'A';
            
            for (let i = 0; i < alphabet.length; i++) {
                if (!usedLetters.includes(alphabet[i])) {
                    newRowLetter = alphabet[i];
                    break;
                }
            }

            // Create new row with just this seat
            const rowData = {
                row: newRowLetter,
                seats: [{
                    row: newRowLetter,
                    number: seatNumber,
                    type: seatType
                }]
            };

            currentSeatData.push(rowData);
            currentSeatData.sort((a, b) => a.row.localeCompare(b.row));

            showInlineNotification(`Seat ${newRowLetter}${seatNumber} added in new row`, 'success');
        } else {
            // Add to existing row
            const existingRow = currentSeatData.find(r => r.row === rowLetter);
            
            if (!existingRow) {
                showInlineNotification('Selected row not found', 'error');
                return;
            }

            // Check if seat number already exists
            if (existingRow.seats.some(s => s.number === seatNumber)) {
                showInlineNotification(`Seat ${rowLetter}${seatNumber} already exists`, 'warning');
                return;
            }

            // Add seat to existing row
            existingRow.seats.push({
                row: rowLetter,
                number: seatNumber,
                type: seatType
            });

            // Sort seats by number
            existingRow.seats.sort((a, b) => a.number - b.number);

            showInlineNotification(`Seat ${rowLetter}${seatNumber} added`, 'success');
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
            showInlineNotification('Row letter is required', 'warning');
            return;
        }

        if (currentSeatData.some(r => r.row === rowLetter)) {
            showInlineNotification('Row letter already exists', 'warning');
            return;
        }

        if (seatCount < 1 || seatCount > 50) {
            showInlineNotification('Seat count must be between 1 and 50', 'warning');
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
            container.innerHTML = '<p class="no-seats-message">No seats configured. Click "Add Seats" to start.</p>';
            return;
        }

        currentSeatData.forEach(rowData => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';

            // Row label
            const label = document.createElement('div');
            label.className = 'seat-row-label';
            label.textContent = rowData.row;
            rowDiv.appendChild(label);

            // Seats container
            const seatsContainer = document.createElement('div');
            seatsContainer.className = 'seat-row-seats';

            rowData.seats.forEach(seat => {
                const seatDiv = document.createElement('div');
                // Set base class and type-specific class
                seatDiv.className = `seat seat-${seat.type.toLowerCase()}`;
                seatDiv.textContent = seat.number;
                seatDiv.dataset.row = seat.row;
                seatDiv.dataset.number = seat.number;
                seatDiv.dataset.type = seat.type;
                
                // Click to select
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
     * Delete selected seats
     */
    window.deleteSelectedSeats = function() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        
        if (selectedSeats.length === 0) {
            showInlineNotification('Please select seats to delete', 'warning');
            return;
        }

        if (!confirm(`Delete ${selectedSeats.length} selected seat(s)?`)) {
            return;
        }

        const seatsToDelete = [];
        selectedSeats.forEach(seat => {
            seatsToDelete.push({
                row: seat.dataset.row,
                number: parseInt(seat.dataset.number)
            });
        });

        // Remove seats from data
        currentSeatData.forEach(rowData => {
            rowData.seats = rowData.seats.filter(seat => {
                return !seatsToDelete.some(s => s.row === seat.row && s.number === seat.number);
            });
        });

        // Remove empty rows
        currentSeatData = currentSeatData.filter(rowData => rowData.seats.length > 0);

        renderSeatGrid();
        showInlineNotification(`Deleted ${selectedSeats.length} seat(s)`, 'success');
    };

    /**
     * Apply bulk type change to selected seats
     */
    window.applyBulkTypeChange = function() {
        const newType = document.getElementById('bulk-seat-type').value;
        const selectedSeats = document.querySelectorAll('.seat.selected');

        if (!newType) {
            showInlineNotification('Please select a seat type', 'warning');
            return;
        }

        if (selectedSeats.length === 0) {
            showInlineNotification('Please select seats to change', 'warning');
            return;
        }

        let changedCount = 0;
        selectedSeats.forEach(seat => {
            const row = seat.dataset.row;
            const number = parseInt(seat.dataset.number);
            const oldType = seat.dataset.type;

            // Find and update seat in data
            currentSeatData.forEach(rowData => {
                if (rowData.row === row) {
                    const seatData = rowData.seats.find(s => s.number === number);
                    if (seatData) {
                        seatData.type = newType;
                        changedCount++;
                        
                        // Update seat element classes to reflect the change
                        seat.className = `seat seat-${newType.toLowerCase()}`;
                        seat.dataset.type = newType;
                        
                        // Keep selected state
                        seat.classList.add('selected');
                    }
                }
            });
        });

        // Reset selection
        document.getElementById('bulk-seat-type').value = '';
        
        // Re-render to ensure proper layout with new widths
        renderSeatGrid();
        showInlineNotification(`Changed ${changedCount} seat(s) to ${newType}`, 'success');
    };

    /**
     * Save seat configuration for current screen
     */
    window.saveSeatConfiguration = function() {
        if (!currentEditingScreen) return;

        // Convert seat data to individual seat configs (preserve seat types)
        const seats = [];
        currentSeatData.forEach(rowData => {
            rowData.seats.forEach(seat => {
                seats.push({
                    row: seat.row,
                    number: seat.number,
                    type: seat.type
                });
            });
        });

        // Update screen seat config
        currentEditingScreen.seatConfig = {
            seats: seats
        };

        // Save screen ID before closing modal
        const screenId = currentEditingScreen.id;

        console.log('Saving seat configuration for screen:', screenId);
        console.log('Seats to save:', seats);
        console.log('Current step:', currentStep);

        // Update the seat count in step 3 (with delay to ensure DOM is ready)
        setTimeout(() => {
            console.log('Attempting to update display for screen:', screenId);
            updateSeatCountDisplayNew(screenId, seats);
            
            // Also refresh the entire step 3 if we're currently in it
            if (currentStep === 3) {
                console.log('Refreshing step 3 seat configurations');
                generateSeatConfigurations();
            }
        }, 100);

        showInlineNotification('Seat configuration saved', 'success');
        closeSeatModal();
    };

    /**
     * Update seat count display in step 3
     */
    function updateSeatCountDisplay(screenId, rowConfigs) {
        // Only update if we're in step 3
        if (currentStep !== 3) {
            return;
        }
        
        // Try multiple selectors to find the screen card
        let screenCard = document.querySelector(`[data-screen-id="${screenId}"]`);
        
        // If not found, try alternative approach
        if (!screenCard) {
            const allScreenCards = document.querySelectorAll('[data-screen-card]');
            screenCard = Array.from(allScreenCards).find(card => card.dataset.screenId === screenId);
        }
        
        if (screenCard) {
            const totalSeats = rowConfigs.reduce((sum, row) => sum + row.seatCount, 0);
            const seatCountElement = screenCard.querySelector('[data-seat-count]');
            const noSeatsElement = screenCard.querySelector('[data-no-seats]');
            const previewElement = screenCard.querySelector('[data-seat-preview]');
            
            if (seatCountElement && totalSeats > 0) {
                seatCountElement.textContent = `${totalSeats} seats`;
                if (noSeatsElement) noSeatsElement.style.display = 'none';
                if (previewElement) previewElement.style.display = 'block';
                
                // Add seat type breakdown
                const seatsByType = {
                    REGULAR: 0,
                    VIP: 0,
                    COUPLE: 0
                };

                rowConfigs.forEach(row => {
                    seatsByType[row.seatType] += row.seatCount;
                });

                if (previewElement) {
                    previewElement.innerHTML = `
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.7);">
                            Regular: ${seatsByType.REGULAR}, VIP: ${seatsByType.VIP}, Couple: ${seatsByType.COUPLE}
                        </div>
                    `;
                }
            } else if (seatCountElement) {
                seatCountElement.textContent = '0 seats';
                if (noSeatsElement) noSeatsElement.style.display = 'block';
                if (previewElement) previewElement.style.display = 'none';
            }
        } else {
            console.warn('Screen card not found for screenId:', screenId);
            // Try to find by alternative method
            const allScreenCards = document.querySelectorAll('[data-screen-card]');
            console.log('Available screen cards:', Array.from(allScreenCards).map(el => el.dataset.screenId));
        }
    }

    /**
     * Update seat count display in step 3 (new format with individual seats)
     */
    function updateSeatCountDisplayNew(screenId, seats) {
        console.log('updateSeatCountDisplayNew called with:', { screenId, seatCount: seats.length, currentStep });
        
        // Only update if we're in step 3
        if (currentStep !== 3) {
            console.log('Not in step 3, skipping update');
            return;
        }
        
        // Try multiple selectors to find the screen card
        let screenCard = document.querySelector(`[data-screen-id="${screenId}"]`);
        console.log('Found screen card by data-screen-id:', screenCard);
        
        // If not found, try alternative approach
        if (!screenCard) {
            const allScreenCards = document.querySelectorAll('[data-screen-card]');
            console.log('All screen cards:', allScreenCards);
            screenCard = Array.from(allScreenCards).find(card => card.dataset.screenId === screenId);
            console.log('Found screen card by dataset search:', screenCard);
        }
        
        if (screenCard) {
            const totalSeats = seats.length;
            const seatCountElement = screenCard.querySelector('[data-seat-count]');
            const noSeatsElement = screenCard.querySelector('[data-no-seats]');
            const previewElement = screenCard.querySelector('[data-seat-preview]');
            
            console.log('Elements found:', { seatCountElement, noSeatsElement, previewElement });
            
            if (seatCountElement && totalSeats > 0) {
                seatCountElement.textContent = `${totalSeats} seats`;
                if (noSeatsElement) noSeatsElement.style.display = 'none';
                if (previewElement) previewElement.style.display = 'block';

                // Add seat type breakdown
                const seatsByType = {
                    REGULAR: 0,
                    VIP: 0,
                    COUPLE: 0
                };

                seats.forEach(seat => {
                    if (seatsByType.hasOwnProperty(seat.type)) {
                        seatsByType[seat.type]++;
                    }
                });

                if (previewElement) {
                    previewElement.innerHTML = `
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.7);">
                            Regular: ${seatsByType.REGULAR}, VIP: ${seatsByType.VIP}, Couple: ${seatsByType.COUPLE}
                        </div>
                    `;
                }
            } else if (seatCountElement) {
                seatCountElement.textContent = '0 seats';
                if (noSeatsElement) noSeatsElement.style.display = 'block';
                if (previewElement) previewElement.style.display = 'none';
            }
        } else {
            console.warn('Screen card not found for screenId:', screenId);
        }
    }

    /**
     * Add a row configuration to a screen
     */
    function addRowConfig(screenId, rowLetter = '', seatCount = 10, seatType = 'REGULAR') {
        const template = document.getElementById('row-config-template');
        const configSection = document.querySelector(`[data-screen-config][data-screen-id="${screenId}"]`);
        const rowsContainer = configSection.querySelector('[data-rows-container]');
        
        const clone = template.content.cloneNode(true);
        
        // Set values
        const rowLetterInput = clone.querySelector('[data-input="row-letter"]');
        const seatCountInput = clone.querySelector('[data-input="seat-count"]');
        const seatTypeInput = clone.querySelector('[data-input="seat-type"]');
        
        rowLetterInput.value = rowLetter;
        seatCountInput.value = seatCount;
        seatTypeInput.value = seatType;
        
        // Setup remove button
        const removeBtn = clone.querySelector('[data-action="remove-row"]');
        removeBtn.addEventListener('click', function() {
            this.closest('.row-config-item').remove();
        });
        
        rowsContainer.appendChild(clone);
    }

    /**
     * Collect seat configurations (only if no seat config exists from modal)
     */
    function collectSeatConfigurations() {
        screens.forEach(screen => {
            // Skip if we already have seat config from modal (new format)
            if (screen.seatConfig && screen.seatConfig.seats) {
                return;
            }
            
            const configSection = document.querySelector(`[data-screen-config][data-screen-id="${screen.id}"]`);
            if (!configSection) return;
            
            const rowItems = configSection.querySelectorAll('.row-config-item');
            const rowConfigs = [];
            
            rowItems.forEach(item => {
                const rowLetter = item.querySelector('[data-input="row-letter"]').value.trim().toUpperCase();
                const seatCount = parseInt(item.querySelector('[data-input="seat-count"]').value);
                const seatType = item.querySelector('[data-input="seat-type"]').value;
                
                if (rowLetter && seatCount > 0) {
                    rowConfigs.push({
                        rowLetter: rowLetter,
                        seatCount: seatCount,
                        seatType: seatType
                    });
                }
            });
            
            // Only set if we found row configs
            if (rowConfigs.length > 0) {
                screen.seatConfig = {
                    rows: rowConfigs
                };
            }
        });
    }

    /**
     * Submit form - Create cinema with screens and seats
     */
    function submitForm(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Creating...';

        // Collect all data
        collectScreenData();
        collectSeatConfigurations();

        // Validate that all screens have seat configurations
        const screensWithoutSeats = screens.filter(screen => 
            !screen.seatConfig || 
            (!screen.seatConfig.seats && !screen.seatConfig.rows) ||
            (screen.seatConfig.seats && screen.seatConfig.seats.length === 0) ||
            (screen.seatConfig.rows && screen.seatConfig.rows.length === 0)
        );

        if (screensWithoutSeats.length > 0) {
            const screenNames = screensWithoutSeats.map(s => s.name).join(', ');
            showAlert(`Please configure seats for: ${screenNames}`, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa fa-check"></i> Create Cinema';
            return;
        }

        // Build cinema data
        const cinemaData = {
            name: document.getElementById('cinema-name').value.trim(),
            address: document.getElementById('cinema-address').value.trim(),
            city: document.getElementById('cinema-city').value,
            phone_number: document.getElementById('cinema-phone').value.trim() || null,
            latitude: parseFloat(document.getElementById('cinema-latitude').value) || null,
            longitude: parseFloat(document.getElementById('cinema-longitude').value) || null
        };

        // Step 1: Create cinema
        fetch(`${API_BASE_URL}/api/admin/cinemas`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(cinemaData)
        })
        .then(handleResponse)
        .then(result => {
            if (!result.success) {
                throw new Error(result.message || 'Failed to create cinema');
            }

            const cinemaId = result.data.cinema_id;

            // Step 2: Create screens with seats
            return createScreensWithSeats(cinemaId);
        })
        .then(cinemaId => {
            showAlert('Cinema created successfully!', 'success');
            setTimeout(() => {
                window.location.href = `cinema-view.html?id=${cinemaId}`;
            }, 1500);
        })
        .catch(error => {
            showAlert('Error: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa fa-check"></i> Create Cinema';
        });
    }

    /**
     * Create screens and their seats
     */
    async function createScreensWithSeats(cinemaId) {
        for (const screen of screens) {
            try {
                // Validate seat configuration exists
                if (!screen.seatConfig || (!screen.seatConfig.seats && !screen.seatConfig.rows) || 
                    (screen.seatConfig.seats && screen.seatConfig.seats.length === 0) ||
                    (screen.seatConfig.rows && screen.seatConfig.rows.length === 0)) {
                    throw new Error(`Seat configuration required for ${screen.name}`);
                }

                // Create screen
                const screenData = {
                    screen_name: screen.name,
                    screen_type: screen.type
                };

                const screenResult = await fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(screenData)
                }).then(handleResponse);

                if (!screenResult.success) {
                    throw new Error(`Failed to create screen ${screen.name}: ${screenResult.message}`);
                }

                const screenId = screenResult.data.screen_id;

                // Create seats - handle both new and old format
                if (screen.seatConfig.seats) {
                    // New format: individual seats
                    const seatsToCreate = screen.seatConfig.seats.map(seat => ({
                        seat_row: seat.row,
                        seat_number: seat.number,
                        seat_type: seat.type
                    }));

                    const seatsData = {
                        seats: seatsToCreate
                    };

                    await fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${screenId}/seats`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(seatsData)
                    }).then(handleResponse);

                } else if (screen.seatConfig.rows) {
                    // Legacy format: row configs
                    for (const rowConfig of screen.seatConfig.rows) {
                        const seatsData = {
                            generate: true,
                            rows: [rowConfig.rowLetter],
                            seats_per_row: rowConfig.seatCount,
                            seat_type: rowConfig.seatType
                        };

                        await fetch(`${API_BASE_URL}/api/admin/cinemas/${cinemaId}/screens/${screenId}/seats`, {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(seatsData)
                        }).then(handleResponse);
                    }
                }
            } catch (error) {
                console.error('Error creating screen/seats:', error);
                throw error; // Re-throw to handle in calling function
            }
        }

        return cinemaId;
    }

    /**
     * Show inline notification (toast-like)
     */
    function showInlineNotification(message, type = 'info') {
        // Remove existing notification if any
        const existing = document.querySelector('.inline-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `inline-notification inline-notification-${type}`;
        notification.innerHTML = `
            <i class="fa ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Initialize form
     */
    function init() {
        if (!isAuthenticated()) {
            redirectToLogin();
            return;
        }

        // Add first screen by default
        addScreenRow();

        // Setup form submission
        const form = document.getElementById('cinema-form');
        if (form) {
            form.addEventListener('submit', submitForm);
        }

        // Setup modal close on outside click
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('seat-modal')) {
                closeSeatModal();
                closeAddRowModal();
                closeAddIndividualModal();
            }
        });

        // Ensure modals are hidden on page load
        const seatModal = document.getElementById('seat-modal');
        const addRowModal = document.getElementById('add-row-modal');
        const addIndividualModal = document.getElementById('add-individual-modal');
        if (seatModal) seatModal.classList.remove('active');
        if (addRowModal) addRowModal.classList.remove('active');
        if (addIndividualModal) addIndividualModal.classList.remove('active');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
