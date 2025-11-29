"""
Admin showtimes routes
Handle CRUD operations for showtimes management
"""
from flask import Blueprint, jsonify, request
from services.admin.showtimes_service import ShowtimesService
from middleware.auth_middleware import admin_required

showtimes_bp = Blueprint('admin_showtimes', __name__)
showtimes_service = ShowtimesService()


@showtimes_bp.route('', methods=['GET'])
@admin_required()
def list_showtimes():
    """List all showtimes with optional filters."""
    try:
        # Get query parameters for filtering
        movie_id = request.args.get('movie_id', type=int)
        cinema_id = request.args.get('cinema_id', type=int)
        show_date = request.args.get('show_date')
        
        showtimes = showtimes_service.get_all_showtimes(
            movie_id=movie_id,
            cinema_id=cinema_id,
            show_date=show_date
        )
        
        return jsonify({
            'success': True,
            'data': showtimes
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch showtimes: {str(e)}'
        }), 500


@showtimes_bp.route('', methods=['POST'])
@admin_required()
def create_showtime():
    """Create a new showtime."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['movie_id', 'screen_id', 'show_datetime', 'base_price']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        showtime = showtimes_service.create_showtime(data)
        
        return jsonify({
            'success': True,
            'message': 'Showtime created successfully',
            'data': showtime
        }), 201
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create showtime: {str(e)}'
        }), 500


@showtimes_bp.route('/<int:showtime_id>', methods=['GET'])
@admin_required()
def get_showtime(showtime_id):
    """Get specific showtime details."""
    try:
        showtime = showtimes_service.get_showtime_by_id(showtime_id)
        
        if not showtime:
            return jsonify({
                'success': False,
                'message': 'Showtime not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': showtime
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch showtime: {str(e)}'
        }), 500


@showtimes_bp.route('/<int:showtime_id>', methods=['PUT'])
@admin_required()
def update_showtime(showtime_id):
    """Update showtime information."""
    try:
        data = request.get_json()
        
        showtime = showtimes_service.update_showtime(showtime_id, data)
        
        if not showtime:
            return jsonify({
                'success': False,
                'message': 'Showtime not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Showtime updated successfully',
            'data': showtime
        }), 200
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update showtime: {str(e)}'
        }), 500


@showtimes_bp.route('/<int:showtime_id>', methods=['DELETE'])
@admin_required()
def delete_showtime(showtime_id):
    """Delete a showtime."""
    try:
        success = showtimes_service.delete_showtime(showtime_id)
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Showtime not found or cannot be deleted'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Showtime deleted successfully'
        }), 200
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete showtime: {str(e)}'
        }), 500


@showtimes_bp.route('/available-screens', methods=['GET'])
@admin_required()
def get_available_screens():
    """Get available screens for a specific datetime."""
    try:
        cinema_id = request.args.get('cinema_id', type=int)
        show_datetime = request.args.get('show_datetime')
        duration_minutes = request.args.get('duration_minutes', type=int)
        
        if not cinema_id or not show_datetime or not duration_minutes:
            return jsonify({
                'success': False,
                'message': 'Missing required parameters: cinema_id, show_datetime, duration_minutes'
            }), 400
        
        screens = showtimes_service.get_available_screens_for_datetime(
            cinema_id, show_datetime, duration_minutes
        )
        
        return jsonify({
            'success': True,
            'data': screens
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch available screens: {str(e)}'
        }), 500
