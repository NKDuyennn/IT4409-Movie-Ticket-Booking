/**
 * Promotions Management Page
 * Handles CRUD operations for promotions in admin panel
 */

let currentPromotions = [];
let editingPromotionId = null;

// Initialize page
$(document).ready(function() {
  console.log('Promotions management page loaded');
  
  // Set active menu item
  setActiveMenuItem('menu-promotions');
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  $('#promotion-start-date, #promotion-end-date').attr('min', today);
  
  // Load initial data
  loadPromotions();
  
  // Event listeners
  $('#btn-add-promotion').on('click', openAddPromotionModal);
  $('#btn-filter').on('click', applyFilters);
  $('#btn-clear-filter').on('click', clearFilters);
  $('#promotion-form').on('submit', savePromotion);
  $('#confirm-delete').on('click', deletePromotion);
  
  // Modal close handlers
  $('.modal-close, .modal-cancel').on('click', closeModals);
  $(window).on('click', function(event) {
    if ($(event.target).hasClass('modal')) {
      closeModals();
    }
  });
});

/**
 * Load promotions from API
 */
function loadPromotions() {
  console.log('Loading promotions...');
  
  $.ajax({
    url: `${API_BASE_URL}/api/admin/promotions`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    success: function(response) {
      console.log('Promotions loaded:', response);
      if (response.success) {
        currentPromotions = response.data || [];
        renderPromotionsTable(currentPromotions);
      } else {
        showError('Failed to load promotions');
      }
    },
    error: function(xhr) {
      console.error('Error loading promotions:', xhr);
      handleApiError(xhr, 'Failed to load promotions');
    }
  });
}

/**
 * Render promotions table
 */
function renderPromotionsTable(promotions) {
  const tbody = $('#promotions-table-body');
  
  if (!promotions || promotions.length === 0) {
    tbody.html('<tr><td colspan="8" class="text-center">No promotions found</td></tr>');
    return;
  }
  
  let html = '';
  promotions.forEach(promotion => {
    const statusClass = promotion.status === 'active' ? 'status-active' : 'status-inactive';
    
    html += `
      <tr>
        <td>${promotion.promotion_id}</td>
        <td>${escapeHtml(promotion.name || 'N/A')}</td>
        <td>${escapeHtml(promotion.code || 'N/A')}</td>
        <td>${promotion.discount_percentage}%</td>
        <td>${formatDate(promotion.start_date)}</td>
        <td>${formatDate(promotion.end_date)}</td>
        <td><span class="status-badge ${statusClass}">${promotion.status}</span></td>
        <td>
          <button class="btn-icon btn-edit" onclick="editPromotion(${promotion.promotion_id})" title="Edit">
            <i class="fa fa-edit"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="confirmDeletePromotion(${promotion.promotion_id})" title="Delete">
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
  const status = $('#filter-status').val();
  
  let filtered = currentPromotions;
  
  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }
  
  renderPromotionsTable(filtered);
}

/**
 * Clear filters
 */
function clearFilters() {
  $('#filter-status').val('');
  renderPromotionsTable(currentPromotions);
}

/**
 * Open add promotion modal
 */
function openAddPromotionModal() {
  editingPromotionId = null;
  $('#modal-title').text('Add Promotion');
  $('#promotion-form')[0].reset();
  $('#promotion-id').val('');
  $('#promotion-modal').fadeIn();
}

/**
 * Edit promotion
 */
function editPromotion(promotionId) {
  const promotion = currentPromotions.find(p => p.promotion_id === promotionId);
  
  if (!promotion) {
    showError('Promotion not found');
    return;
  }
  
  editingPromotionId = promotionId;
  $('#modal-title').text('Edit Promotion');
  $('#promotion-id').val(promotion.promotion_id);
  $('#promotion-name').val(promotion.name);
  $('#promotion-code').val(promotion.code);
  $('#promotion-description').val(promotion.description);
  $('#promotion-discount').val(promotion.discount_percentage);
  $('#promotion-max-discount').val(promotion.max_discount_amount);
  $('#promotion-start-date').val(promotion.start_date);
  $('#promotion-end-date').val(promotion.end_date);
  $('#promotion-usage-limit').val(promotion.usage_limit);
  $('#promotion-status').val(promotion.status);
  
  $('#promotion-modal').fadeIn();
}

/**
 * Save promotion
 */
function savePromotion(e) {
  e.preventDefault();
  
  const promotionData = {
    name: $('#promotion-name').val(),
    code: $('#promotion-code').val(),
    description: $('#promotion-description').val(),
    discount_percentage: parseFloat($('#promotion-discount').val()),
    max_discount_amount: parseFloat($('#promotion-max-discount').val()) || null,
    start_date: $('#promotion-start-date').val(),
    end_date: $('#promotion-end-date').val(),
    usage_limit: parseInt($('#promotion-usage-limit').val()) || null,
    status: $('#promotion-status').val()
  };
  
  const isEdit = editingPromotionId !== null;
  const url = isEdit 
    ? `${API_BASE_URL}/api/admin/promotions/${editingPromotionId}`
    : `${API_BASE_URL}/api/admin/promotions`;
  const method = isEdit ? 'PUT' : 'POST';
  
  $.ajax({
    url: url,
    method: method,
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify(promotionData),
    success: function(response) {
      if (response.success) {
        showSuccess(isEdit ? 'Promotion updated successfully' : 'Promotion created successfully');
        closeModals();
        loadPromotions();
      } else {
        showError(response.message || 'Failed to save promotion');
      }
    },
    error: function(xhr) {
      handleApiError(xhr, 'Failed to save promotion');
    }
  });
}

/**
 * Confirm delete promotion
 */
function confirmDeletePromotion(promotionId) {
  editingPromotionId = promotionId;
  $('#delete-modal').fadeIn();
}

/**
 * Delete promotion
 */
function deletePromotion() {
  if (!editingPromotionId) return;
  
  $.ajax({
    url: `${API_BASE_URL}/api/admin/promotions/${editingPromotionId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    success: function(response) {
      if (response.success) {
        showSuccess('Promotion deleted successfully');
        closeModals();
        loadPromotions();
      } else {
        showError(response.message || 'Failed to delete promotion');
      }
    },
    error: function(xhr) {
      handleApiError(xhr, 'Failed to delete promotion');
    }
  });
}

/**
 * Close all modals
 */
function closeModals() {
  $('.modal').fadeOut();
  editingPromotionId = null;
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
