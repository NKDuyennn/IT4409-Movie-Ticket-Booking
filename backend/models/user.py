"""
User Model - Bảng users
Schema: users (user_id, email, password_hash, full_name, phone_number, date_of_birth, 
        role, created_at, updated_at, is_active)
"""
from database.db import db
from datetime import datetime
import bcrypt


class User(db.Model):
    """Model cho bảng users với phân quyền role"""
    __tablename__ = 'users'
    
    # Columns - khớp 100% với database schema
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    role = db.Column(db.Enum('user', 'admin', name='user_role'), default='user', nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    
    # Relationships
    bookings = db.relationship('Booking', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Mã hóa và lưu mật khẩu"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Kiểm tra mật khẩu"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def is_admin(self):
        """Kiểm tra user có phải admin không"""
        return self.role == 'admin'
    
    def to_dict(self, include_sensitive=False):
        """Chuyển đổi object thành dictionary"""
        user_dict = {
            'user_id': self.user_id,
            'email': self.email,
            'full_name': self.full_name,
            'phone_number': self.phone_number,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }
        
        if include_sensitive:
            user_dict['password_hash'] = self.password_hash
            
        return user_dict

