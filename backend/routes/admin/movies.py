"""
Admin movies routes
Handle CRUD operations for movies
"""
from flask import Blueprint, jsonify, request
from services.admin.movies_service import MoviesService
from middleware.auth_middleware import admin_required

movies_bp = Blueprint('admin_movies', __name__)


@movies_bp.route('', methods=['GET'])
@admin_required()
def list_movies():
    """
    List all movies with pagination and filters
    Query params: page, per_page, is_showing, search
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', None, type=str)
    
    # Handle is_showing filter
    is_showing = None
    is_showing_param = request.args.get('is_showing', None)
    if is_showing_param is not None:
        is_showing = is_showing_param.lower() == 'true'
    
    result = MoviesService.get_all_movies(
        page=page,
        per_page=per_page,
        is_showing=is_showing,
        search=search
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@movies_bp.route('', methods=['POST'])
@admin_required()
def create_movie():
    """
    Create a new movie
    Request body: movie data including actors, images, videos
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    # Validate required fields
    required_fields = ['title', 'duration_minutes']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
    
    result = MoviesService.create_movie(data)
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400


@movies_bp.route('/<int:movie_id>', methods=['GET'])
@admin_required()
def get_movie(movie_id):
    """Get specific movie details with actors, images, and videos"""
    result = MoviesService.get_movie_by_id(movie_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404


@movies_bp.route('/<int:movie_id>', methods=['PUT'])
@admin_required()
def update_movie(movie_id):
    """Update movie information"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    result = MoviesService.update_movie(movie_id, data)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@movies_bp.route('/<int:movie_id>', methods=['DELETE'])
@admin_required()
def delete_movie(movie_id):
    """Delete a movie"""
    result = MoviesService.delete_movie(movie_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@movies_bp.route('/actors', methods=['GET'])
@admin_required()
def list_actors():
    """
    List all actors for selection
    Query params: search
    """
    search = request.args.get('search', None, type=str)
    result = MoviesService.get_all_actors(search=search)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400
