/**
 * Showtimes Management Page
 * Handles CRUD operations for showtimes in admin panel
 */

let currentShowtimes = [];
let currentMovies = [];
let currentCinemas = [];
let currentHalls = [];
let editingShowtimeId = null;

// Initialize page
$(document).ready(function() {
  console.log('Showtimes management page loaded');
  
  // Set active menu item
  setActiveMenuItem('menu-showtimes');
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  $('#showtime-date, #filter-date').attr('min', today);
  
  // Load initial data
  loadShowtimes();
  loadMovies();
  loadCinemas();
  
  // Event listeners
  $('#btn-add-showtime').on('click', openAddShowtimeModal);
  $('#btn-filter').on('click', applyFilters);
  $('#btn-clear-filter').on('click', clearFilters);
  $('#showtime-form').on('submit', saveShowtime);
  $('#showtime-cinema').on('change', loadHallsForCinema);
  $('#confirm-delete').on('click', deleteShowtime);
  
  // Modal close handlers
  $('.modal-close, .modal-cancel').on('click', closeModals);
  $(window).on('click', function(event) {
    if ($(event.target).hasClass('modal')) {
      closeModals();
    }
  });
});

/**
 * Load showtimes from API
 */
function loadShowtimes() {
  console.log('Loading showtimes...');
  
  $.ajax({
    url: `${API_BASE_URL}/api/admin/showtimes`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    success: function(response) {
      console.log('Showtimes loaded:', response);
      if (response.success) {
        currentShowtimes = response.data || [];
        renderShowtimesTable(currentShowtimes);
      } else {
        showError('Failed to load showtimes');
      }
    },
    error: function(xhr) {
      console.error('Error loading showtimes:', xhr);
      handleApiError(xhr, 'Failed to load showtimes');
    }
  });
}

/**
 * Load movies for dropdowns
 */
function loadMovies() {
  $.ajax({
    url: `${API_BASE_URL}/api/admin/movies`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    success: function(response) {
      if (response.success) {
        currentMovies = response.data || [];
        populateMovieDropdowns();
      }
    },
    error: function(xhr) {
      console.error('Error loading movies:', xhr);
    }
  });
}

/**
 * Load cinemas for dropdowns
 */
function loadCinemas() {
  $.ajax({
    url: `${API_BASE_URL}/api/admin/cinemas`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    success: function(response) {
      if (response.success) {
        currentCinemas = response.data || [];
        populateCinemaDropdowns();
      }
    },
    error: function(xhr) {
      console.error('Error loading cinemas:', xhr);
    }
  });
}

/**
 * Load halls for selected cinema
 */
function loadHallsForCinema() {
  const cinemaId = $('#showtime-cinema').val();
  
  if (!cinemaId) {
    $('#showtime-hall').html('<option value="">Select a hall</option>');
    return;
  }
  
  $.ajax({
    url: `${API_BASE_URL}/api/admin/cinemas/${cinemaId}/halls`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    success: function(response) {
      if (response.success) {
        currentHalls = response.data || [];
        populateHallDropdown();
      }
    },
    error: function(xhr) {
      console.error('Error loading halls:', xhr);
      $('#showtime-hall').html('<option value="">Error loading halls</option>');
    }
  });
}

/**
 * Populate movie dropdowns
 */
function populateMovieDropdowns() {
  const filterSelect = $('#filter-movie');
  const formSelect = $('#showtime-movie');
  
  filterSelect.html('<option value="">All Movies</option>');
  formSelect.html('<option value="">Select a movie</option>');
  
  currentMovies.forEach(movie => {
    const option = `<option value="${movie.movie_id}">${movie.title}</option>`;
    filterSelect.append(option);
    formSelect.append(option);
  });
}

/**
 * Populate cinema dropdowns
 */
function populateCinemaDropdowns() {
  const filterSelect = $('#filter-cinema');
  const formSelect = $('#showtime-cinema');
  
  filterSelect.html('<option value="">All Cinemas</option>');
  formSelect.html('<option value="">Select a cinema</option>');
  
  currentCinemas.forEach(cinema => {
    const option = `<option value="${cinema.cinema_id}">${cinema.name}</option>`;
    filterSelect.append(option);
    formSelect.append(option);
  });
}

/**
 * Populate hall dropdown
 */
function populateHallDropdown() {
  const select = $('#showtime-hall');
  select.html('<option value="">Select a hall</option>');
  
  currentHalls.forEach(hall => {
    const option = `<option value="${hall.hall_id}">${hall.name} (${hall.total_seats} seats)</option>`;
    select.append(option);
  });
}

/**
 * Render showtimes table
 */
function renderShowtimesTable(showtimes) {
  const tbody = $('#showtimes-table-body');
  
  if (!showtimes || showtimes.length === 0) {
    tbody.html('<tr><td colspan="10" class="text-center">No showtimes found</td></tr>');
    return;
  }
  
  let html = '';
  showtimes.forEach(showtime => {
    const statusClass = showtime.status === 'active' ? 'status-active' : 
                       showtime.status === 'sold_out' ? 'status-sold-out' : 'status-inactive';
    
    html += `
      <tr>
        <td>${showtime.showtime_id}</td>
        <td>${escapeHtml(showtime.movie_title || 'N/A')}</td>
        <td>${escapeHtml(showtime.cinema_name || 'N/A')}</td>
        <td>${escapeHtml(showtime.hall_name || 'N/A')}</td>
        <td>${formatDate(showtime.show_date)}</td>
        <td>${formatTime(showtime.show_time)}</td>
        <td>${formatCurrency(showtime.price)}</td>
        <td>${showtime.available_seats || 0} / ${showtime.total_seats || 0}</td>
        <td><span class="status-badge ${statusClass}">${showtime.status}</span></td>
        <td>
          <button class="btn-icon btn-edit" onclick="editShowtime(${showtime.showtime_id})" title="Edit">
            <i class="fa fa-edit"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="confirmDeleteShowtime(${showtime.showtime_id})" title="Delete">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.html(html);
}

/**
 * Apply filters
 */
function applyFilters() {
  const movieId = $('#filter-movie').val();
  const cinemaId = $('#filter-cinema').val();
  const date = $('#filter-date').val();
  
  let filtered = currentShowtimes;
  
  if (movieId) {
    filtered = filtered.filter(s => s.movie_id == movieId);
  }
  
  if (cinemaId) {
    filtered = filtered.filter(s => s.cinema_id == cinemaId);
  }
  
  if (date) {
    filtered = filtered.filter(s => s.show_date === date);
  }
  
  renderShowtimesTable(filtered);
}

/**
 * Clear filters
 */
function clearFilters() {
  $('#filter-movie').val('');
  $('#filter-cinema').val('');
  $('#filter-date').val('');
  renderShowtimesTable(currentShowtimes);
}

/**
 * Open add showtime modal
 */
function openAddShowtimeModal() {
  editingShowtimeId = null;
  $('#modal-title').text('Add Showtime');
  $('#showtime-form')[0].reset();
  $('#showtime-id').val('');
  $('#showtime-modal').fadeIn();
}

/**
 * Edit showtime
 */
function editShowtime(showtimeId) {
  const showtime = currentShowtimes.find(s => s.showtime_id === showtimeId);
  
  if (!showtime) {
    showError('Showtime not found');
    return;
  }
  
  editingShowtimeId = showtimeId;
  $('#modal-title').text('Edit Showtime');
  $('#showtime-id').val(showtime.showtime_id);
  $('#showtime-movie').val(showtime.movie_id);
  $('#showtime-cinema').val(showtime.cinema_id);
  
  // Load halls for the selected cinema, then set the hall value
  loadHallsForCinema().then(() => {
    $('#showtime-hall').val(showtime.hall_id);
  });
  
  $('#showtime-date').val(showtime.show_date);
  $('#showtime-time').val(showtime.show_time);
  $('#showtime-price').val(showtime.price);
  $('#showtime-status').val(showtime.status);
  
  $('#showtime-modal').fadeIn();
}

/**
 * Save showtime
 */
function saveShowtime(e) {
  e.preventDefault();
  
  const showtimeData = {
    movie_id: parseInt($('#showtime-movie').val()),
    cinema_id: parseInt($('#showtime-cinema').val()),
    hall_id: parseInt($('#showtime-hall').val()),
    show_date: $('#showtime-date').val(),
    show_time: $('#showtime-time').val(),
    price: parseFloat($('#showtime-price').val()),
    status: $('#showtime-status').val()
  };
  
  const isEdit = editingShowtimeId !== null;
  const url = isEdit 
    ? `${API_BASE_URL}/api/admin/showtimes/${editingShowtimeId}`
    : `${API_BASE_URL}/api/admin/showtimes`;
  const method = isEdit ? 'PUT' : 'POST';
  
  $.ajax({
    url: url,
    method: method,
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify(showtimeData),
    success: function(response) {
      if (response.success) {
        showSuccess(isEdit ? 'Showtime updated successfully' : 'Showtime created successfully');
        closeModals();
        loadShowtimes();
      } else {
        showError(response.message || 'Failed to save showtime');
      }
    },
    error: function(xhr) {
      handleApiError(xhr, 'Failed to save showtime');
    }
  });
}

/**
 * Confirm delete showtime
 */
function confirmDeleteShowtime(showtimeId) {
  editingShowtimeId = showtimeId;
  $('#delete-modal').fadeIn();
}

/**
 * Delete showtime
 */
function deleteShowtime() {
  if (!editingShowtimeId) return;
  
  $.ajax({
    url: `${API_BASE_URL}/api/admin/showtimes/${editingShowtimeId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    success: function(response) {
      if (response.success) {
        showSuccess('Showtime deleted successfully');
        closeModals();
        loadShowtimes();
      } else {
        showError(response.message || 'Failed to delete showtime');
      }
    },
    error: function(xhr) {
      handleApiError(xhr, 'Failed to delete showtime');
    }
  });
}

/**
 * Close all modals
 */
function closeModals() {
  $('.modal').fadeOut();
  editingShowtimeId = null;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB');
}

/**
 * Format time for display
 */
function formatTime(timeStr) {
  if (!timeStr) return 'N/A';
  return timeStr.substring(0, 5);
}

/**
 * Format currency (VND)
 */
function formatCurrency(amount) {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
