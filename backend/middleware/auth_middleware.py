"""
Authentication Middleware
Các decorators để kiểm tra quyền truy cập
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models.user import User


def admin_required():
    """
    Decorator kiểm tra user có quyền admin không
    Sử dụng sau @jwt_required()
    
    Example:
        @app.route('/admin/users')
        @jwt_required()
        @admin_required()
        def get_all_users():
            pass
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                # Verify JWT token
                verify_jwt_in_request()
                
                # Lấy user_id từ JWT (convert string về int)
                current_user_id = int(get_jwt_identity())
                
                # Tìm user trong database
                user = User.query.get(current_user_id)
            except Exception as e:
                print(f"[DEBUG] Exception in admin_required: {e}")
                return jsonify({
                    'success': False,
                    'message': 'Token không hợp lệ'
                }), 401
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User không tồn tại'
                }), 404
            
            # Kiểm tra role
            if not user.is_admin():
                return jsonify({
                    'success': False,
                    'message': 'Bạn không có quyền truy cập. Chỉ admin mới có thể thực hiện hành động này.'
                }), 403
            
            # User là admin, cho phép truy cập
            return fn(*args, **kwargs)
        
        return decorator
    return wrapper


def get_current_user():
    """
    Helper function để lấy thông tin user hiện tại từ JWT
    
    Returns:
        User object hoặc None
    """
    try:
        verify_jwt_in_request()
        current_user_id = int(get_jwt_identity())
        return User.query.get(current_user_id)
    except Exception:
        return None


def is_current_user_admin():
    """
    Helper function kiểm tra user hiện tại có phải admin không
    
    Returns:
        Boolean
    """
    user = get_current_user()
    return user and user.is_admin()

