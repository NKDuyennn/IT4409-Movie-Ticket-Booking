"""
Admin routes blueprint (placeholders)

This file defines admin-related API endpoints. Implementations are intentionally
lightweight placeholders to show structure. Add real logic in `services/admin_service.py`.
"""
from flask import Blueprint, jsonify, request

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/stats', methods=['GET'])
def get_stats():
    """Return basic statistics used by admin dashboard.

    Expected to be extended to query real database models.
    """
    # Placeholder data; replace with calls to admin service
    data = {
        'total_users': 124,
        'total_movies': 56,
        'total_screens': 12,
        'total_bookings': 1423,
        'revenue_today': 1520.50
    }
    return jsonify({'success': True, 'data': data}), 200


@admin_bp.route('/users', methods=['GET', 'POST'])
def users():
    """Admin CRUD for users (list/create placeholder)."""
    if request.method == 'GET':
        # Return sample list
        return jsonify({'success': True, 'data': []}), 200
    # POST -> create user (not implemented)
    return jsonify({'success': False, 'message': 'Not implemented'}), 501


@admin_bp.route('/cinemas', methods=['GET', 'POST'])
def cinemas():
    """Admin CRUD for cinemas/screens/seats (placeholder)."""
    return jsonify({'success': False, 'message': 'Not implemented'}), 501


@admin_bp.route('/movies', methods=['GET', 'POST'])
def movies():
    """Admin CRUD for movies/showtimes/promotions (placeholder)."""
    return jsonify({'success': False, 'message': 'Not implemented'}), 501
