"""
Admin promotions routes
Handle CRUD operations for promotions management
"""
from flask import Blueprint, jsonify, request
from services.admin.promotions_service import PromotionsService
from middleware.auth_middleware import admin_required

promotions_bp = Blueprint('admin_promotions', __name__)
promotions_service = PromotionsService()


@promotions_bp.route('', methods=['GET'])
@admin_required()
def list_promotions():
    """List all promotions with optional filters."""
    try:
        # Get query parameters for filtering
        is_active_str = request.args.get('is_active', type=str)
        is_active = None
        
        # Convert string to boolean properly
        if is_active_str is not None:
            if is_active_str.lower() == 'true':
                is_active = True
            elif is_active_str.lower() == 'false':
                is_active = False
        
        promotions = promotions_service.get_all_promotions(is_active=is_active)
        
        return jsonify({
            'success': True,
            'data': promotions
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch promotions: {str(e)}'
        }), 500


@promotions_bp.route('', methods=['POST'])
@admin_required()
def create_promotion():
    """Create a new promotion."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['code', 'name', 'valid_from', 'valid_to']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        promotion = promotions_service.create_promotion(data)
        
        return jsonify({
            'success': True,
            'message': 'Promotion created successfully',
            'data': promotion
        }), 201
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create promotion: {str(e)}'
        }), 500


@promotions_bp.route('/<int:promotion_id>', methods=['GET'])
@admin_required()
def get_promotion(promotion_id):
    """Get specific promotion details."""
    try:
        promotion = promotions_service.get_promotion_by_id(promotion_id)
        
        if not promotion:
            return jsonify({
                'success': False,
                'message': 'Promotion not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': promotion
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch promotion: {str(e)}'
        }), 500


@promotions_bp.route('/<int:promotion_id>', methods=['PUT'])
@admin_required()
def update_promotion(promotion_id):
    """Update promotion information."""
    try:
        data = request.get_json()
        
        promotion = promotions_service.update_promotion(promotion_id, data)
        
        if not promotion:
            return jsonify({
                'success': False,
                'message': 'Promotion not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Promotion updated successfully',
            'data': promotion
        }), 200
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update promotion: {str(e)}'
        }), 500


@promotions_bp.route('/<int:promotion_id>', methods=['DELETE'])
@admin_required()
def delete_promotion(promotion_id):
    """Delete a promotion."""
    try:
        success = promotions_service.delete_promotion(promotion_id)
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Promotion not found or cannot be deleted'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Promotion deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete promotion: {str(e)}'
        }), 500
