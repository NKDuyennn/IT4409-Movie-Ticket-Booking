"""
Movie, Cinema, Screen, Review Models
Schema: 
- movies (movie_id, title, description, duration_minutes, release_date, director, cast, 
         genre, language, poster_url, trailer_url, rating, age_rating, is_showing, 
         created_at, updated_at)
- cinemas (cinema_id, name, address, city, phone_number, latitude, longitude, 
          created_at, updated_at)
- screens (screen_id, cinema_id, screen_name, total_seats, screen_type)
- reviews (review_id, user_id, movie_id, rating, comment, created_at)
"""
from database.db import db
from datetime import datetime


class Movie(db.Model):
    """Model cho bảng movies"""
    __tablename__ = 'movies'
    
    # Columns - khớp 100% với database schema
    movie_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=False)
    release_date = db.Column(db.Date, nullable=True, index=True)
    director = db.Column(db.String(255), nullable=True)
    cast = db.Column(db.Text, nullable=True)
    genre = db.Column(db.String(100), nullable=True)
    language = db.Column(db.String(50), nullable=True)
    poster_url = db.Column(db.String(500), nullable=True)
    trailer_url = db.Column(db.String(500), nullable=True)
    rating = db.Column(db.Numeric(3, 1), default=0.0, nullable=True)
    age_rating = db.Column(db.String(10), default='P', nullable=True, index=True)
    is_showing = db.Column(db.Boolean, default=True, nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    showtimes = db.relationship('Showtime', back_populates='movie', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', back_populates='movie', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Movie {self.title}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'movie_id': self.movie_id,
            'title': self.title,
            'description': self.description,
            'duration_minutes': self.duration_minutes,
            'release_date': self.release_date.isoformat() if self.release_date else None,
            'director': self.director,
            'cast': self.cast,
            'genre': self.genre,
            'language': self.language,
            'poster_url': self.poster_url,
            'trailer_url': self.trailer_url,
            'rating': float(self.rating) if self.rating else 0.0,
            'age_rating': self.age_rating,
            'is_showing': self.is_showing,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Cinema(db.Model):
    """Model cho bảng cinemas"""
    __tablename__ = 'cinemas'
    
    # Columns - khớp 100% với database schema
    cinema_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False, index=True)
    phone_number = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Numeric(10, 8), nullable=True)
    longitude = db.Column(db.Numeric(11, 8), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    screens = db.relationship('Screen', back_populates='cinema', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Cinema {self.name}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'cinema_id': self.cinema_id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'phone_number': self.phone_number,
            'latitude': float(self.latitude) if self.latitude else None,
            'longitude': float(self.longitude) if self.longitude else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Screen(db.Model):
    """Model cho bảng screens"""
    __tablename__ = 'screens'
    
    # Columns - khớp 100% với database schema
    screen_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cinema_id = db.Column(db.Integer, db.ForeignKey('cinemas.cinema_id', ondelete='CASCADE'), nullable=False, index=True)
    screen_name = db.Column(db.String(100), nullable=False)
    total_seats = db.Column(db.Integer, nullable=False)
    screen_type = db.Column(db.String(50), nullable=True)
    
    # Relationships
    cinema = db.relationship('Cinema', back_populates='screens')
    seats = db.relationship('Seat', back_populates='screen', lazy='dynamic', cascade='all, delete-orphan')
    showtimes = db.relationship('Showtime', back_populates='screen', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Screen {self.screen_name}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'screen_id': self.screen_id,
            'cinema_id': self.cinema_id,
            'screen_name': self.screen_name,
            'total_seats': self.total_seats,
            'screen_type': self.screen_type
        }


class Review(db.Model):
    """Model cho bảng reviews"""
    __tablename__ = 'reviews'
    
    # Columns - khớp 100% với database schema
    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)  # CHECK constraint: 1-5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='reviews')
    movie = db.relationship('Movie', back_populates='reviews')
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'movie_id', name='unique_user_movie_review'),
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    )
    
    def __repr__(self):
        return f'<Review user_id={self.user_id} movie_id={self.movie_id}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'review_id': self.review_id,
            'user_id': self.user_id,
            'movie_id': self.movie_id,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

