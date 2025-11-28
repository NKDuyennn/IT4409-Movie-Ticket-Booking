"""
Actor and Movie-Actor relationship Models
Schema:
- actors (actor_id, name, bio, photo_url, date_of_birth, nationality, created_at, updated_at)
- movie_actors (movie_actor_id, movie_id, actor_id, role_name, character_name, display_order)
"""
from database.db import db
from datetime import datetime


class Actor(db.Model):
    """Model cho bảng actors"""
    __tablename__ = 'actors'
    
    # Columns
    actor_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    bio = db.Column(db.Text, nullable=True)
    photo_url = db.Column(db.String(500), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    nationality = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    movie_actors = db.relationship('MovieActor', back_populates='actor', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Actor {self.name}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'actor_id': self.actor_id,
            'name': self.name,
            'bio': self.bio,
            'photo_url': self.photo_url,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'nationality': self.nationality,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class MovieActor(db.Model):
    """Model cho bảng movie_actors (quan hệ nhiều-nhiều)"""
    __tablename__ = 'movie_actors'
    
    # Columns
    movie_actor_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False, index=True)
    actor_id = db.Column(db.Integer, db.ForeignKey('actors.actor_id', ondelete='CASCADE'), nullable=False, index=True)
    role_name = db.Column(db.String(255), nullable=True)
    character_name = db.Column(db.String(255), nullable=True)
    display_order = db.Column(db.Integer, default=0, nullable=True)
    
    # Relationships
    movie = db.relationship('Movie', back_populates='movie_actors')
    actor = db.relationship('Actor', back_populates='movie_actors')
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('movie_id', 'actor_id', name='unique_movie_actor'),
    )
    
    def __repr__(self):
        return f'<MovieActor movie_id={self.movie_id} actor_id={self.actor_id}>'
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            'movie_actor_id': self.movie_actor_id,
            'movie_id': self.movie_id,
            'actor_id': self.actor_id,
            'role_name': self.role_name,
            'character_name': self.character_name,
            'display_order': self.display_order,
            'actor': self.actor.to_dict() if self.actor else None
        }
