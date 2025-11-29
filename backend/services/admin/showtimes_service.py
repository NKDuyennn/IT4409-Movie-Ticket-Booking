"""
Showtimes service for admin operations
Handles business logic for showtime management
"""
from database.db import db
from models.showtime import Showtime
from models.movie import Movie, Cinema, Screen
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, func
from datetime import datetime, date, time


class ShowtimesService:
    """Service class for managing showtimes"""
    
    @staticmethod
    def get_all_showtimes(movie_id=None, cinema_id=None, show_date=None):
        """Get all showtimes with optional filters"""
        try:
            query = db.session.query(
                Showtime,
                Movie.title.label('movie_title'),
                Cinema.name.label('cinema_name'),
                Screen.screen_name.label('screen_name')
            ).join(
                Movie, Showtime.movie_id == Movie.movie_id
            ).join(
                Screen, Showtime.screen_id == Screen.screen_id
            ).join(
                Cinema, Screen.cinema_id == Cinema.cinema_id
            )
            
            # Apply filters
            if movie_id:
                query = query.filter(Showtime.movie_id == movie_id)
            
            if cinema_id:
                query = query.filter(Cinema.cinema_id == cinema_id)
            
            if show_date:
                # Parse date if string
                if isinstance(show_date, str):
                    show_date = datetime.strptime(show_date, '%Y-%m-%d').date()
                query = query.filter(func.date(Showtime.show_datetime) == show_date)
            
            # Order by datetime descending
            query = query.order_by(Showtime.show_datetime.desc())
            
            results = query.all()
            
            # Auto-update status for past showtimes
            current_time = datetime.now()
            
            # Format results
            showtimes = []
            for showtime, movie_title, cinema_name, screen_name in results:
                # Auto-update status to COMPLETED if show time has passed
                if showtime.status == 'SCHEDULED' and showtime.show_datetime < current_time:
                    showtime.status = 'COMPLETED'
                    db.session.add(showtime)
                
                showtime_dict = showtime.to_dict()
                showtime_dict['movie_title'] = movie_title
                showtime_dict['cinema_name'] = cinema_name
                showtime_dict['screen_name'] = screen_name
                showtimes.append(showtime_dict)
            
            # Commit status updates
            db.session.commit()
            
            return showtimes
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def get_showtime_by_id(showtime_id):
        """Get showtime details by ID"""
        try:
            result = db.session.query(
                Showtime,
                Movie.title.label('movie_title'),
                Cinema.cinema_id.label('cinema_id'),
                Cinema.name.label('cinema_name'),
                Screen.screen_name.label('screen_name')
            ).join(
                Movie, Showtime.movie_id == Movie.movie_id
            ).join(
                Screen, Showtime.screen_id == Screen.screen_id
            ).join(
                Cinema, Screen.cinema_id == Cinema.cinema_id
            ).filter(
                Showtime.showtime_id == showtime_id
            ).first()
            
            if not result:
                return None
            
            showtime, movie_title, cinema_id, cinema_name, screen_name = result
            
            # Auto-update status to COMPLETED if show time has passed
            current_time = datetime.now()
            if showtime.status == 'SCHEDULED' and showtime.show_datetime < current_time:
                showtime.status = 'COMPLETED'
                db.session.add(showtime)
                db.session.commit()
            
            showtime_dict = showtime.to_dict()
            showtime_dict['movie_title'] = movie_title
            showtime_dict['cinema_id'] = cinema_id
            showtime_dict['cinema_name'] = cinema_name
            showtime_dict['screen_name'] = screen_name
            
            return showtime_dict
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def create_showtime(data):
        """Create a new showtime"""
        try:
            # Validate required fields
            required_fields = ['movie_id', 'screen_id', 'show_datetime', 'base_price']
            for field in required_fields:
                if field not in data or data[field] is None:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate movie exists and is showing
            movie = Movie.query.get(data['movie_id'])
            if not movie:
                raise ValueError("Movie not found")
            if not movie.is_showing:
                raise ValueError("Movie is not currently showing")
            
            # Validate screen exists
            screen = Screen.query.get(data['screen_id'])
            if not screen:
                raise ValueError("Screen not found")
            
            # Parse datetime
            show_datetime = data['show_datetime']
            if isinstance(show_datetime, str):
                show_datetime = datetime.fromisoformat(show_datetime.replace('Z', '+00:00'))
            
            # Check if showtime already exists for this screen at this time
            existing = Showtime.query.filter(
                and_(
                    Showtime.screen_id == data['screen_id'],
                    Showtime.show_datetime == show_datetime
                )
            ).first()
            
            if existing:
                raise ValueError("A showtime already exists for this screen at this time")
            
            # Create showtime
            showtime = Showtime(
                movie_id=data['movie_id'],
                screen_id=data['screen_id'],
                show_datetime=show_datetime,
                base_price=data['base_price'],
                available_seats=screen.total_seats,
                status=data.get('status', 'SCHEDULED')
            )
            
            db.session.add(showtime)
            db.session.commit()
            
            return ShowtimesService.get_showtime_by_id(showtime.showtime_id)
        except ValueError as e:
            db.session.rollback()
            raise e
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def update_showtime(showtime_id, data):
        """Update showtime information"""
        try:
            showtime = Showtime.query.get(showtime_id)
            
            if not showtime:
                return None
            
            # Update fields if provided
            if 'movie_id' in data:
                movie = Movie.query.get(data['movie_id'])
                if not movie:
                    raise ValueError("Movie not found")
                showtime.movie_id = data['movie_id']
            
            if 'screen_id' in data:
                screen = Screen.query.get(data['screen_id'])
                if not screen:
                    raise ValueError("Screen not found")
                showtime.screen_id = data['screen_id']
            
            if 'show_datetime' in data:
                show_datetime = data['show_datetime']
                if isinstance(show_datetime, str):
                    show_datetime = datetime.fromisoformat(show_datetime.replace('Z', '+00:00'))
                showtime.show_datetime = show_datetime
            
            if 'base_price' in data:
                showtime.base_price = data['base_price']
            
            if 'status' in data:
                showtime.status = data['status']
            
            db.session.commit()
            
            return ShowtimesService.get_showtime_by_id(showtime_id)
        except ValueError as e:
            db.session.rollback()
            raise e
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def delete_showtime(showtime_id):
        """Delete a showtime"""
        try:
            showtime = Showtime.query.get(showtime_id)
            
            if not showtime:
                return False
            
            # Check if there are any bookings for this showtime
            if showtime.bookings.count() > 0:
                raise ValueError("Cannot delete showtime with existing bookings")
            
            db.session.delete(showtime)
            db.session.commit()
            
            return True
        except ValueError as e:
            db.session.rollback()
            raise e
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def get_available_screens_for_datetime(cinema_id, show_datetime, duration_minutes):
        """Get screens available at a specific datetime considering movie duration"""
        try:
            # Parse datetime if string
            if isinstance(show_datetime, str):
                show_datetime = datetime.fromisoformat(show_datetime.replace('Z', '+00:00'))
            
            # Get all screens for cinema
            screens = Screen.query.filter_by(cinema_id=cinema_id).all()
            
            available_screens = []
            for screen in screens:
                # Check if screen has any conflicting showtimes
                # A conflict occurs if there's a showtime that overlaps with:
                # [show_datetime - buffer, show_datetime + duration + buffer]
                buffer_minutes = 30  # 30 minutes buffer between shows
                
                from datetime import timedelta
                start_check = show_datetime - timedelta(minutes=duration_minutes + buffer_minutes)
                end_check = show_datetime + timedelta(minutes=duration_minutes + buffer_minutes)
                
                conflicting = Showtime.query.filter(
                    and_(
                        Showtime.screen_id == screen.screen_id,
                        Showtime.show_datetime >= start_check,
                        Showtime.show_datetime <= end_check
                    )
                ).first()
                
                if not conflicting:
                    available_screens.append(screen.to_dict())
            
            return available_screens
        except SQLAlchemyError as e:
            raise Exception(f"Database error: {str(e)}")
