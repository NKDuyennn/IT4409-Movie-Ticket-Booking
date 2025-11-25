"""
Payment Model - Bảng payments
Schema: payments (payment_id, booking_id, amount, payment_method, transaction_id, 
                 payment_status, payment_datetime, created_at)
"""
from database.db import db
from datetime import datetime


class Payment(db.Model):
    """Model cho bảng payments"""
    __tablename__ = 'payments'
    
    # Columns - khớp 100% với database schema
    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.booking_id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    transaction_id = db.Column(db.String(255), nullable=True, index=True)
    payment_status = db.Column(db.String(50), default='PENDING', nullable=True, index=True)
    payment_datetime = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    booking = db.relationship('Booking', back_populates='payment')
    
    def __repr__(self):
        return f'<Payment booking_id={self.booking_id}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'payment_id': self.payment_id,
            'booking_id': self.booking_id,
            'amount': float(self.amount) if self.amount else 0.0,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'payment_status': self.payment_status,
            'payment_datetime': self.payment_datetime.isoformat() if self.payment_datetime else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

