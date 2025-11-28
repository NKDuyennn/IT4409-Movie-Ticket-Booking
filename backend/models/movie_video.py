"""
Movie Video Model
Schema:
- movie_videos (video_id, movie_id, video_url, video_type, title, duration_seconds, display_order, created_at)
"""
from database.db import db
from datetime import datetime


class MovieVideo(db.Model):
    """Model cho bảng movie_videos"""
    __tablename__ = 'movie_videos'
    
    # Columns
    video_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False, index=True)
    video_url = db.Column(db.String(500), nullable=False)
    video_type = db.Column(db.String(50), default='TRAILER', nullable=True, index=True)
    title = db.Column(db.String(255), nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    display_order = db.Column(db.Integer, default=0, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    movie = db.relationship('Movie', back_populates='videos')
    
    def __repr__(self):
        return f'<MovieVideo {self.video_id} for movie {self.movie_id}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'video_id': self.video_id,
            'movie_id': self.movie_id,
            'video_url': self.video_url,
            'video_type': self.video_type,
            'title': self.title,
            'duration_seconds': self.duration_seconds,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
