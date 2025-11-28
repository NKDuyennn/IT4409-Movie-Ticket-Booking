"""
Movie Image Model
Schema:
- movie_images (image_id, movie_id, image_url, image_type, caption, display_order, created_at)
"""
from database.db import db
from datetime import datetime


class MovieImage(db.Model):
    """Model cho bảng movie_images"""
    __tablename__ = 'movie_images'
    
    # Columns
    image_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    image_type = db.Column(db.String(50), default='POSTER', nullable=True, index=True)
    caption = db.Column(db.String(255), nullable=True)
    display_order = db.Column(db.Integer, default=0, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    movie = db.relationship('Movie', back_populates='images')
    
    def __repr__(self):
        return f'<MovieImage {self.image_id} for movie {self.movie_id}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'image_id': self.image_id,
            'movie_id': self.movie_id,
            'image_url': self.image_url,
            'image_type': self.image_type,
            'caption': self.caption,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
