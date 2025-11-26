"""
Admin dashboard routes
Handle dashboard statistics and overview data
"""
from flask import Blueprint, jsonify

dashboard_bp = Blueprint('admin_dashboard', __name__)


@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    """Return dashboard statistics.
    
    Returns key metrics for admin dashboard including:
    - Total users
    - Total movies
    - Total bookings
    - Revenue
    """
    # TODO: Query real data from database
    data = {
        'total_users': 124,
        'total_movies': 56,
        'total_bookings': 1423,
        'revenue_today': 1520.50
    }
    return jsonify({'success': True, 'data': data}), 200
