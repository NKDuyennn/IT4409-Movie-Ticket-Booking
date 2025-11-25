"""
Authentication Routes
Các endpoints cho authentication: login, register, logout, etc.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.auth_service import AuthService
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Endpoint đăng ký user mới
    
    Request body:
        {
            "email": "user@example.com",
            "password": "password123",
            "full_name": "Nguyen Van A",
            "phone_number": "0123456789" (optional),
            "date_of_birth": "1990-01-01" (optional)
        }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                'success': False,
                'message': 'Không có dữ liệu'
            }), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        phone_number = data.get('phone_number', '').strip() if data.get('phone_number') else None
        date_of_birth_str = data.get('date_of_birth')
        
        # Validate required fields
        if not email:
            return jsonify({
                'success': False,
                'message': 'Email không được để trống'
            }), 400
        
        if not password:
            return jsonify({
                'success': False,
                'message': 'Mật khẩu không được để trống'
            }), 400
        
        if not full_name:
            return jsonify({
                'success': False,
                'message': 'Họ tên không được để trống'
            }), 400
        
        # Parse date_of_birth if provided
        date_of_birth = None
        if date_of_birth_str:
            try:
                date_of_birth = datetime.strptime(date_of_birth_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Định dạng ngày sinh không hợp lệ (YYYY-MM-DD)'
                }), 400
        
        # Register user
        success, message, user = AuthService.register_user(
            email=email,
            password=password,
            full_name=full_name,
            phone_number=phone_number,
            date_of_birth=date_of_birth
        )
        
        if not success:
            return jsonify({
                'success': False,
                'message': message
            }), 400
        
        return jsonify({
            'success': True,
            'message': message,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint đăng nhập
    
    Request body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                'success': False,
                'message': 'Không có dữ liệu'
            }), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email:
            return jsonify({
                'success': False,
                'message': 'Email không được để trống'
            }), 400
        
        if not password:
            return jsonify({
                'success': False,
                'message': 'Mật khẩu không được để trống'
            }), 400
        
        # Login user
        success, message, tokens, user = AuthService.login_user(email, password)
        
        if not success:
            return jsonify({
                'success': False,
                'message': message
            }), 401
        
        return jsonify({
            'success': True,
            'message': message,
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Endpoint lấy thông tin user hiện tại
    Yêu cầu JWT token trong header
    """
    try:
        current_user_id = get_jwt_identity()
        user = AuthService.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy user'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi server: {str(e)}'
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Endpoint đăng xuất
    Note: Với JWT, việc logout chủ yếu được xử lý ở client side
    bằng cách xóa token
    """
    return jsonify({
        'success': True,
        'message': 'Đăng xuất thành công'
    }), 200


@auth_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Auth service is running'
    }), 200

