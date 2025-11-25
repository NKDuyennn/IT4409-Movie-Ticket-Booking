"""
Seat Model - Bảng seats
Schema: seats (seat_id, screen_id, seat_row, seat_number, seat_type, is_available)
"""
from database.db import db


class Seat(db.Model):
    """Model cho bảng seats"""
    __tablename__ = 'seats'
    
    # Columns - khớp 100% với database schema
    seat_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    screen_id = db.Column(db.Integer, db.ForeignKey('screens.screen_id', ondelete='CASCADE'), nullable=False, index=True)
    seat_row = db.Column(db.String(10), nullable=False)
    seat_number = db.Column(db.Integer, nullable=False)
    seat_type = db.Column(db.String(50), default='REGULAR', nullable=True)
    is_available = db.Column(db.Boolean, default=True, nullable=True)
    
    # Relationships
    screen = db.relationship('Screen', back_populates='seats')
    booking_seats = db.relationship('BookingSeat', back_populates='seat', lazy='dynamic', cascade='all, delete-orphan')
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('screen_id', 'seat_row', 'seat_number', name='unique_seat'),
    )
    
    def __repr__(self):
        return f'<Seat {self.seat_row}{self.seat_number}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'seat_id': self.seat_id,
            'screen_id': self.screen_id,
            'seat_row': self.seat_row,
            'seat_number': self.seat_number,
            'seat_type': self.seat_type,
            'is_available': self.is_available
        }

