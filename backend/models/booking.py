"""
Booking, BookingSeat, Promotion, BookingPromotion Models
Schema:
- bookings (booking_id, user_id, showtime_id, booking_code, booking_datetime, 
           total_amount, status, created_at, updated_at)
- booking_seats (booking_seat_id, booking_id, seat_id, price)
- promotions (promotion_id, code, name, description, discount_percentage, 
             discount_amount, valid_from, valid_to, usage_limit, used_count, 
             is_active, created_at)
- booking_promotions (booking_promotion_id, booking_id, promotion_id, discount_applied)
"""
from database.db import db
from datetime import datetime
import random
import string


class Booking(db.Model):
    """Model cho bảng bookings"""
    __tablename__ = 'bookings'
    
    # Columns - khớp 100% với database schema
    booking_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    showtime_id = db.Column(db.Integer, db.ForeignKey('showtimes.showtime_id', ondelete='CASCADE'), nullable=False, index=True)
    booking_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    booking_datetime = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(50), default='PENDING', nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='bookings')
    showtime = db.relationship('Showtime', back_populates='bookings')
    booking_seats = db.relationship('BookingSeat', back_populates='booking', lazy='dynamic', cascade='all, delete-orphan')
    payment = db.relationship('Payment', back_populates='booking', uselist=False, cascade='all, delete-orphan')
    booking_promotions = db.relationship('BookingPromotion', back_populates='booking', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Booking {self.booking_code}>'
    
    @staticmethod
    def generate_booking_code():
        """Tạo mã booking ngẫu nhiên"""
        return 'BK' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'booking_id': self.booking_id,
            'user_id': self.user_id,
            'showtime_id': self.showtime_id,
            'booking_code': self.booking_code,
            'booking_datetime': self.booking_datetime.isoformat() if self.booking_datetime else None,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class BookingSeat(db.Model):
    """Model cho bảng booking_seats"""
    __tablename__ = 'booking_seats'
    
    # Columns - khớp 100% với database schema
    booking_seat_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.booking_id', ondelete='CASCADE'), nullable=False, index=True)
    seat_id = db.Column(db.Integer, db.ForeignKey('seats.seat_id', ondelete='CASCADE'), nullable=False, index=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Relationships
    booking = db.relationship('Booking', back_populates='booking_seats')
    seat = db.relationship('Seat', back_populates='booking_seats')
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('booking_id', 'seat_id', name='unique_booking_seat'),
    )
    
    def __repr__(self):
        return f'<BookingSeat booking_id={self.booking_id} seat_id={self.seat_id}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'booking_seat_id': self.booking_seat_id,
            'booking_id': self.booking_id,
            'seat_id': self.seat_id,
            'price': float(self.price) if self.price else 0.0
        }


class Promotion(db.Model):
    """Model cho bảng promotions"""
    __tablename__ = 'promotions'
    
    # Columns - khớp 100% với database schema
    promotion_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    discount_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    discount_amount = db.Column(db.Numeric(10, 2), nullable=True)
    valid_from = db.Column(db.Date, nullable=False, index=True)
    valid_to = db.Column(db.Date, nullable=False, index=True)
    usage_limit = db.Column(db.Integer, nullable=True)
    used_count = db.Column(db.Integer, default=0, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    booking_promotions = db.relationship('BookingPromotion', back_populates='promotion', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Promotion {self.code}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'promotion_id': self.promotion_id,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'discount_percentage': float(self.discount_percentage) if self.discount_percentage else None,
            'discount_amount': float(self.discount_amount) if self.discount_amount else None,
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_to': self.valid_to.isoformat() if self.valid_to else None,
            'usage_limit': self.usage_limit,
            'used_count': self.used_count,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BookingPromotion(db.Model):
    """Model cho bảng booking_promotions"""
    __tablename__ = 'booking_promotions'
    
    # Columns - khớp 100% với database schema
    booking_promotion_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.booking_id', ondelete='CASCADE'), nullable=False, index=True)
    promotion_id = db.Column(db.Integer, db.ForeignKey('promotions.promotion_id', ondelete='CASCADE'), nullable=False, index=True)
    discount_applied = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Relationships
    booking = db.relationship('Booking', back_populates='booking_promotions')
    promotion = db.relationship('Promotion', back_populates='booking_promotions')
    
    def __repr__(self):
        return f'<BookingPromotion booking_id={self.booking_id} promotion_id={self.promotion_id}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'booking_promotion_id': self.booking_promotion_id,
            'booking_id': self.booking_id,
            'promotion_id': self.promotion_id,
            'discount_applied': float(self.discount_applied) if self.discount_applied else 0.0
        }

