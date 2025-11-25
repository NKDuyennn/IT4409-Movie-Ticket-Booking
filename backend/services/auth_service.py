"""
Authentication Service
Xử lý logic nghiệp vụ cho authentication
"""

from models.user import User
from database.db import db
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import datetime
import re


class AuthService:
    """Service class cho authentication"""
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password(password):
        """
        Validate password strength
        Ít nhất 6 ký tự
        """
        if len(password) < 6:
            return False, "Mật khẩu phải có ít nhất 6 ký tự"
        return True, "OK"
    
    @staticmethod
    def register_user(email, password, full_name, phone_number=None, date_of_birth=None, role='user'):
        """
        Đăng ký user mới
        
        Args:
            email: Email của user
            password: Mật khẩu
            full_name: Họ tên đầy đủ
            phone_number: Số điện thoại (optional)
            date_of_birth: Ngày sinh (optional)
            role: Vai trò (user/admin), mặc định là 'user'
            
        Returns:
            tuple: (success: bool, message: str, user: User)
        """
        try:
            # Validate email
            if not AuthService.validate_email(email):
                return False, "Email không hợp lệ", None
            
            # Validate password
            is_valid, msg = AuthService.validate_password(password)
            if not is_valid:
                return False, msg, None
            
            # Kiểm tra email đã tồn tại chưa
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return False, "Email đã được đăng ký", None
            
            # Validate full_name
            if not full_name or len(full_name.strip()) == 0:
                return False, "Họ tên không được để trống", None
            
            # Validate role
            if role not in ['user', 'admin']:
                role = 'user'  # Default to user if invalid
            
            # Tạo user mới
            new_user = User(
                email=email,
                full_name=full_name.strip(),
                phone_number=phone_number,
                date_of_birth=date_of_birth,
                role=role,
                is_active=True
            )
            new_user.set_password(password)
            
            # Lưu vào database
            db.session.add(new_user)
            db.session.commit()
            
            return True, "Đăng ký thành công", new_user
            
        except Exception as e:
            db.session.rollback()
            return False, f"Lỗi: {str(e)}", None
    
    @staticmethod
    def login_user(email, password):
        """
        Đăng nhập user
        
        Args:
            email: Email của user
            password: Mật khẩu
            
        Returns:
            tuple: (success: bool, message: str, tokens: dict, user: User)
        """
        try:
            # Tìm user theo email
            user = User.query.filter_by(email=email).first()
            
            if not user:
                return False, "Email hoặc mật khẩu không đúng", None, None
            
            # Kiểm tra user có active không
            if not user.is_active:
                return False, "Tài khoản đã bị khóa", None, None
            
            # Kiểm tra password
            if not user.check_password(password):
                return False, "Email hoặc mật khẩu không đúng", None, None
            
            # Tạo tokens
            access_token = create_access_token(identity=user.user_id)
            refresh_token = create_refresh_token(identity=user.user_id)
            
            tokens = {
                'access_token': access_token,
                'refresh_token': refresh_token
            }
            
            return True, "Đăng nhập thành công", tokens, user
            
        except Exception as e:
            return False, f"Lỗi: {str(e)}", None, None
    
    @staticmethod
    def get_user_by_id(user_id):
        """
        Lấy thông tin user theo ID
        
        Args:
            user_id: ID của user
            
        Returns:
            User object hoặc None
        """
        try:
            return User.query.get(user_id)
        except Exception:
            return None

