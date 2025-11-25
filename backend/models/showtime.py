"""
Showtime Model - Bảng showtimes
Schema: showtimes (showtime_id, movie_id, screen_id, show_datetime, base_price, 
                  available_seats, status, created_at)
"""
from database.db import db
from datetime import datetime


class Showtime(db.Model):
    """Model cho bảng showtimes"""
    __tablename__ = 'showtimes'
    
    # Columns - khớp 100% với database schema
    showtime_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False, index=True)
    screen_id = db.Column(db.Integer, db.ForeignKey('screens.screen_id', ondelete='CASCADE'), nullable=False, index=True)
    show_datetime = db.Column(db.DateTime, nullable=False, index=True)
    base_price = db.Column(db.Numeric(10, 2), nullable=False)
    available_seats = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), default='SCHEDULED', nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    movie = db.relationship('Movie', back_populates='showtimes')
    screen = db.relationship('Screen', back_populates='showtimes')
    bookings = db.relationship('Booking', back_populates='showtime', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Showtime movie_id={self.movie_id} at {self.show_datetime}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'showtime_id': self.showtime_id,
            'movie_id': self.movie_id,
            'screen_id': self.screen_id,
            'show_datetime': self.show_datetime.isoformat() if self.show_datetime else None,
            'base_price': float(self.base_price) if self.base_price else 0.0,
            'available_seats': self.available_seats,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

