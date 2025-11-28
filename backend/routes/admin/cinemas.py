"""
Admin cinemas routes
Handle CRUD operations for cinemas, screens, and seats
"""
from flask import Blueprint, jsonify, request
from middleware.auth_middleware import admin_required
from services.admin.cinemas_service import CinemasService

cinemas_bp = Blueprint('admin_cinemas', __name__)


# ==================== CINEMA ROUTES ====================

@cinemas_bp.route('', methods=['GET'])
@admin_required()
def list_cinemas():
    """
    List all cinemas with pagination and filters
    Query params: page, per_page, city, search
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        city = request.args.get('city', None)
        search = request.args.get('search', None)
        
        result = CinemasService.get_all_cinemas(
            page=page,
            per_page=per_page,
            city=city,
            search=search
        )
        
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('', methods=['POST'])
@admin_required()
def create_cinema():
    """
    Create a new cinema
    Body: {name, address, city, phone_number, latitude, longitude}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        result = CinemasService.create_cinema(data)
        
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>', methods=['GET'])
@admin_required()
def get_cinema(cinema_id):
    """Get specific cinema details with screens"""
    try:
        result = CinemasService.get_cinema_by_id(cinema_id)
        
        return jsonify(result), 200 if result['success'] else 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>', methods=['PUT'])
@admin_required()
def update_cinema(cinema_id):
    """
    Update cinema information
    Body: {name, address, city, phone_number, latitude, longitude}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        result = CinemasService.update_cinema(cinema_id, data)
        
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>', methods=['DELETE'])
@admin_required()
def delete_cinema(cinema_id):
    """Delete a cinema (cascade delete screens and seats)"""
    try:
        result = CinemasService.delete_cinema(cinema_id)
        
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== SCREEN ROUTES ====================

@cinemas_bp.route('/<int:cinema_id>/screens', methods=['GET'])
@admin_required()
def list_screens(cinema_id):
    """List all screens for a cinema"""
    try:
        result = CinemasService.get_screens_by_cinema(cinema_id)
        
        return jsonify(result), 200 if result['success'] else 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>/screens', methods=['POST'])
@admin_required()
def create_screen(cinema_id):
    """
    Create a new screen for a cinema
    Body: {screen_name, screen_type}
    Note: total_seats is calculated automatically from seats
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        result = CinemasService.create_screen(cinema_id, data)
        
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>/screens/<int:screen_id>', methods=['GET'])
@admin_required()
def get_screen(cinema_id, screen_id):
    """Get specific screen details with seats"""
    try:
        result = CinemasService.get_screen_by_id(screen_id)
        
        return jsonify(result), 200 if result['success'] else 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>/screens/<int:screen_id>', methods=['PUT'])
@admin_required()
def update_screen(cinema_id, screen_id):
    """
    Update screen information
    Body: {screen_name, screen_type}
    Note: total_seats is calculated automatically from seats
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        result = CinemasService.update_screen(screen_id, data)
        
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>/screens/<int:screen_id>', methods=['DELETE'])
@admin_required()
def delete_screen(cinema_id, screen_id):
    """Delete a screen (cascade delete seats)"""
    try:
        result = CinemasService.delete_screen(screen_id)
        
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== SEAT ROUTES ====================

@cinemas_bp.route('/<int:cinema_id>/screens/<int:screen_id>/seats', methods=['POST'])
@admin_required()
def create_seats(cinema_id, screen_id):
    """
    Create seats for a screen
    Body: {seats: [{seat_row, seat_number, seat_type}, ...]} OR
          {generate: true, rows: ['A','B',...], seats_per_row: 10, seat_type: 'REGULAR'}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        # Check if auto-generate mode
        if data.get('generate'):
            result = CinemasService.generate_seats_for_screen(
                screen_id,
                data.get('rows', []),
                data.get('seats_per_row', 10),
                data.get('seat_type', 'REGULAR')
            )
        else:
            # Manual seat creation
            seats_data = data.get('seats', [])
            result = CinemasService.create_seats_for_screen(screen_id, seats_data)
        
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>/screens/<int:screen_id>/seats/<int:seat_id>', methods=['PUT'])
@admin_required()
def update_seat(cinema_id, screen_id, seat_id):
    """
    Update seat information
    Body: {seat_type, is_available}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        result = CinemasService.update_seat(seat_id, data)
        
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>/screens/<int:screen_id>/seats/<int:seat_id>', methods=['DELETE'])
@admin_required()
def delete_seat(cinema_id, screen_id, seat_id):
    """Delete a seat"""
    try:
        result = CinemasService.delete_seat(seat_id)
        
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@cinemas_bp.route('/<int:cinema_id>/screens/<int:screen_id>/seats/bulk-delete', methods=['POST'])
@admin_required()
def bulk_delete_seats(cinema_id, screen_id):
    """
    Delete multiple seats
    Body: {seat_ids: [1, 2, 3, ...]}
    """
    try:
        data = request.get_json()
        
        if not data or 'seat_ids' not in data:
            return jsonify({'success': False, 'message': 'seat_ids required'}), 400
        
        result = CinemasService.bulk_delete_seats(screen_id, data['seat_ids'])
        
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
