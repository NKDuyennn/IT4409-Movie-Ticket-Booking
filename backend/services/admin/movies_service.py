"""
Movie Management Service
Handles business logic for movies CRUD operations including actors, images, and videos
"""
from database.db import db
from models.movie import Movie
from models.actor import Actor, MovieActor
from models.movie_image import MovieImage
from models.movie_video import MovieVideo
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import desc, or_
from datetime import datetime
import os


class MoviesService:
    """Service class for movie management operations"""
    
    @staticmethod
    def get_all_movies(page=1, per_page=10, is_showing=None, search=None):
        """
        Get all movies with pagination and filters
        
        Args:
            page (int): Page number
            per_page (int): Number of items per page
            is_showing (bool): Filter by showing status
            search (str): Search by movie title or director
            
        Returns:
            dict: Paginated movie list with metadata
        """
        try:
            query = Movie.query
            
            # Apply filters
            if is_showing is not None:
                query = query.filter(Movie.is_showing == is_showing)
            
            if search:
                query = query.filter(
                    or_(
                        Movie.title.like(f'%{search}%'),
                        Movie.director.like(f'%{search}%')
                    )
                )
            
            # Order by is_showing desc (showing movies first), then release_date desc
            query = query.order_by(desc(Movie.is_showing), desc(Movie.release_date))
            
            # Paginate
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            
            movies = []
            for movie in pagination.items:
                movie_dict = movie.to_dict()
                # Add additional info
                movie_dict['actor_count'] = movie.movie_actors.count()
                movie_dict['image_count'] = movie.images.count()
                movie_dict['video_count'] = movie.videos.count()
                movie_dict['review_count'] = movie.reviews.count()
                
                # Get poster image (prefer POSTER type, otherwise first image)
                poster_image = movie.images.filter_by(image_type='POSTER').first()
                if not poster_image:
                    poster_image = movie.images.first()
                movie_dict['poster_url'] = poster_image.image_url if poster_image else None
                
                movies.append(movie_dict)
            
            return {
                'success': True,
                'data': movies,
                'pagination': {
                    'total': pagination.total,
                    'page': pagination.page,
                    'per_page': pagination.per_page,
                    'total_pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            }
        except SQLAlchemyError as e:
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def get_movie_by_id(movie_id):
        """
        Get movie details by ID with actors, images, and videos
        
        Args:
            movie_id (int): Movie ID
            
        Returns:
            dict: Movie details with related data
        """
        try:
            movie = Movie.query.get(movie_id)
            
            if not movie:
                return {'success': False, 'message': 'Movie not found'}
            
            movie_dict = movie.to_dict()
            
            # Get actors
            actors = []
            for movie_actor in movie.movie_actors.order_by(MovieActor.display_order):
                actors.append(movie_actor.to_dict())
            movie_dict['actors'] = actors
            
            # Get images
            images = []
            for image in movie.images.order_by(MovieImage.display_order):
                images.append(image.to_dict())
            movie_dict['images'] = images
            
            # Get videos
            videos = []
            for video in movie.videos.order_by(MovieVideo.display_order):
                videos.append(video.to_dict())
            movie_dict['videos'] = videos
            
            return {'success': True, 'data': movie_dict}
        except SQLAlchemyError as e:
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def create_movie(data):
        """
        Create a new movie with actors, images, and videos
        
        Args:
            data (dict): Movie data including:
                - title, description, duration_minutes, release_date, director
                - genre, language, age_rating, is_showing
                - actors: list of {actor_id, role_name, character_name, display_order}
                - images: list of {image_url, image_type, caption, display_order}
                - videos: list of {video_url, video_type, title, duration_seconds, display_order}
            
        Returns:
            dict: Created movie data
        """
        try:
            # Create movie
            movie = Movie(
                title=data.get('title'),
                description=data.get('description'),
                duration_minutes=data.get('duration_minutes'),
                release_date=datetime.strptime(data.get('release_date'), '%Y-%m-%d').date() if data.get('release_date') else None,
                director=data.get('director'),
                genre=data.get('genre'),
                language=data.get('language'),
                rating=data.get('rating', 0.0),
                age_rating=data.get('age_rating', 'P'),
                is_showing=data.get('is_showing', True)
            )
            
            db.session.add(movie)
            db.session.flush()  # Get movie_id
            
            # Add actors
            if 'actors' in data and data['actors']:
                for actor_data in data['actors']:
                    movie_actor = MovieActor(
                        movie_id=movie.movie_id,
                        actor_id=actor_data['actor_id'],
                        role_name=actor_data.get('role_name'),
                        character_name=actor_data.get('character_name'),
                        display_order=actor_data.get('display_order', 0)
                    )
                    db.session.add(movie_actor)
            
            # Add images
            if 'images' in data and data['images']:
                for image_data in data['images']:
                    movie_image = MovieImage(
                        movie_id=movie.movie_id,
                        image_url=image_data['image_url'],
                        image_type=image_data.get('image_type', 'POSTER'),
                        caption=image_data.get('caption'),
                        display_order=image_data.get('display_order', 0)
                    )
                    db.session.add(movie_image)
            
            # Add videos
            if 'videos' in data and data['videos']:
                for video_data in data['videos']:
                    movie_video = MovieVideo(
                        movie_id=movie.movie_id,
                        video_url=video_data['video_url'],
                        video_type=video_data.get('video_type', 'TRAILER'),
                        title=video_data.get('title'),
                        duration_seconds=video_data.get('duration_seconds'),
                        display_order=video_data.get('display_order', 0)
                    )
                    db.session.add(movie_video)
            
            db.session.commit()
            
            return {'success': True, 'data': movie.to_dict(), 'message': 'Movie created successfully'}
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
        except ValueError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Invalid data format: {str(e)}'}
    
    @staticmethod
    def update_movie(movie_id, data):
        """
        Update movie information including actors, images, and videos
        
        Args:
            movie_id (int): Movie ID
            data (dict): Updated movie data
            
        Returns:
            dict: Updated movie data
        """
        try:
            movie = Movie.query.get(movie_id)
            
            if not movie:
                return {'success': False, 'message': 'Movie not found'}
            
            # Update movie fields
            if 'title' in data:
                movie.title = data['title']
            if 'description' in data:
                movie.description = data['description']
            if 'duration_minutes' in data:
                movie.duration_minutes = data['duration_minutes']
            if 'release_date' in data:
                movie.release_date = datetime.strptime(data['release_date'], '%Y-%m-%d').date() if data['release_date'] else None
            if 'director' in data:
                movie.director = data['director']
            if 'genre' in data:
                movie.genre = data['genre']
            if 'language' in data:
                movie.language = data['language']
            if 'rating' in data:
                movie.rating = data['rating']
            if 'age_rating' in data:
                movie.age_rating = data['age_rating']
            if 'is_showing' in data:
                movie.is_showing = data['is_showing']
            
            movie.updated_at = datetime.utcnow()
            
            # Update actors (delete old, add new)
            if 'actors' in data:
                # Delete existing actors
                MovieActor.query.filter_by(movie_id=movie_id).delete()
                
                # Add new actors
                for actor_data in data['actors']:
                    movie_actor = MovieActor(
                        movie_id=movie_id,
                        actor_id=actor_data['actor_id'],
                        role_name=actor_data.get('role_name'),
                        character_name=actor_data.get('character_name'),
                        display_order=actor_data.get('display_order', 0)
                    )
                    db.session.add(movie_actor)
            
            # Update images (delete old, add new)
            if 'images' in data:
                # Get old images to delete files
                old_images = MovieImage.query.filter_by(movie_id=movie_id).all()
                new_image_urls = [img['image_url'] for img in data['images']]
                
                # Delete files for removed images
                for old_image in old_images:
                    if old_image.image_url not in new_image_urls:
                        MoviesService._delete_uploaded_file(old_image.image_url)
                
                # Delete all old image records
                MovieImage.query.filter_by(movie_id=movie_id).delete()
                
                # Add new images
                for image_data in data['images']:
                    movie_image = MovieImage(
                        movie_id=movie_id,
                        image_url=image_data['image_url'],
                        image_type=image_data.get('image_type', 'POSTER'),
                        caption=image_data.get('caption'),
                        display_order=image_data.get('display_order', 0)
                    )
                    db.session.add(movie_image)
            
            # Update videos (delete old, add new)
            if 'videos' in data:
                # Get old videos to delete files
                old_videos = MovieVideo.query.filter_by(movie_id=movie_id).all()
                new_video_urls = [vid['video_url'] for vid in data['videos']]
                
                # Delete files for removed videos
                for old_video in old_videos:
                    if old_video.video_url not in new_video_urls:
                        MoviesService._delete_uploaded_file(old_video.video_url)
                
                # Delete all old video records
                MovieVideo.query.filter_by(movie_id=movie_id).delete()
                
                # Add new videos
                for video_data in data['videos']:
                    movie_video = MovieVideo(
                        movie_id=movie_id,
                        video_url=video_data['video_url'],
                        video_type=video_data.get('video_type', 'TRAILER'),
                        title=video_data.get('title'),
                        duration_seconds=video_data.get('duration_seconds'),
                        display_order=video_data.get('display_order', 0)
                    )
                    db.session.add(movie_video)
            
            db.session.commit()
            
            return {'success': True, 'data': movie.to_dict(), 'message': 'Movie updated successfully'}
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
        except ValueError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Invalid data format: {str(e)}'}
    
    @staticmethod
    def delete_movie(movie_id):
        """
        Delete a movie (cascade delete actors, images, videos)
        
        Args:
            movie_id (int): Movie ID
            
        Returns:
            dict: Success status
        """
        try:
            movie = Movie.query.get(movie_id)
            
            if not movie:
                return {'success': False, 'message': 'Movie not found'}
            
            # Delete image files
            for image in movie.images.all():
                MoviesService._delete_uploaded_file(image.image_url)
            
            # Delete video files
            for video in movie.videos.all():
                MoviesService._delete_uploaded_file(video.video_url)
            
            db.session.delete(movie)
            db.session.commit()
            
            return {'success': True, 'message': 'Movie deleted successfully'}
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def get_all_actors(search=None):
        """
        Get all actors for selection
        
        Args:
            search (str): Search by actor name
            
        Returns:
            dict: List of actors
        """
        try:
            query = Actor.query
            
            if search:
                query = query.filter(Actor.name.like(f'%{search}%'))
            
            query = query.order_by(Actor.name)
            actors = [actor.to_dict() for actor in query.all()]
            
            return {'success': True, 'data': actors}
        
        except SQLAlchemyError as e:
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def _delete_uploaded_file(file_url):
        """
        Delete uploaded file from filesystem
        
        Args:
            file_url (str): File URL (e.g., /uploads/images/filename.jpg)
        """
        try:
            # Only delete files from uploads folder (not external URLs)
            if file_url and file_url.startswith('/uploads/'):
                # Get the file path relative to backend folder
                file_path = os.path.join('uploads', file_url.split('/uploads/')[-1])
                
                # Check if file exists and delete it
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"Deleted file: {file_path}")
                else:
                    print(f"File not found: {file_path}")
        except Exception as e:
            # Log error but don't fail the operation
            print(f"Error deleting file {file_url}: {str(e)}")
