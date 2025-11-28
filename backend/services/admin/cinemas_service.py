"""
Cinema Management Service
Handles business logic for cinemas, screens, and seats CRUD operations
"""
from database.db import db
from models.movie import Cinema, Screen
from models.seat import Seat
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import desc


class CinemasService:
    """Service class for cinema management operations"""
    
    @staticmethod
    def get_all_cinemas(page=1, per_page=10, city=None, search=None):
        """
        Get all cinemas with pagination and filters
        
        Args:
            page (int): Page number
            per_page (int): Number of items per page
            city (str): Filter by city
            search (str): Search by cinema name
            
        Returns:
            dict: Paginated cinema list with metadata
        """
        try:
            query = Cinema.query
            
            # Apply filters
            if city:
                query = query.filter(Cinema.city == city)
            
            if search:
                query = query.filter(Cinema.name.like(f'%{search}%'))
            
            # Order by created_at desc
            query = query.order_by(desc(Cinema.created_at))
            
            # Paginate
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            
            cinemas = []
            for cinema in pagination.items:
                cinema_dict = cinema.to_dict()
                # Add screen count
                cinema_dict['screen_count'] = cinema.screens.count()
                cinemas.append(cinema_dict)
            
            return {
                'success': True,
                'data': cinemas,
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
    def get_cinema_by_id(cinema_id):
        """
        Get cinema details by ID with screens and seats info
        
        Args:
            cinema_id (int): Cinema ID
            
        Returns:
            dict: Cinema details with screens
        """
        try:
            cinema = Cinema.query.get(cinema_id)
            
            if not cinema:
                return {'success': False, 'message': 'Cinema not found'}
            
            cinema_dict = cinema.to_dict()
            
            # Get screens with seat count
            screens = []
            for screen in cinema.screens:
                screen_dict = screen.to_dict()
                screen_dict['seat_count'] = screen.seats.count()
                screens.append(screen_dict)
            
            cinema_dict['screens'] = screens
            cinema_dict['total_screens'] = len(screens)
            
            return {'success': True, 'data': cinema_dict}
        except SQLAlchemyError as e:
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def create_cinema(data):
        """
        Create a new cinema
        
        Args:
            data (dict): Cinema data (name, address, city, phone_number, latitude, longitude)
            
        Returns:
            dict: Created cinema data
        """
        try:
            # Validate required fields
            required_fields = ['name', 'address', 'city']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {'success': False, 'message': f'Missing required field: {field}'}
            
            # Create cinema
            cinema = Cinema(
                name=data['name'],
                address=data['address'],
                city=data['city'],
                phone_number=data.get('phone_number'),
                latitude=data.get('latitude'),
                longitude=data.get('longitude')
            )
            
            db.session.add(cinema)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Cinema created successfully',
                'data': cinema.to_dict()
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def update_cinema(cinema_id, data):
        """
        Update cinema information
        
        Args:
            cinema_id (int): Cinema ID
            data (dict): Updated cinema data
            
        Returns:
            dict: Updated cinema data
        """
        try:
            cinema = Cinema.query.get(cinema_id)
            
            if not cinema:
                return {'success': False, 'message': 'Cinema not found'}
            
            # Update fields
            if 'name' in data:
                cinema.name = data['name']
            if 'address' in data:
                cinema.address = data['address']
            if 'city' in data:
                cinema.city = data['city']
            if 'phone_number' in data:
                cinema.phone_number = data['phone_number']
            if 'latitude' in data:
                cinema.latitude = data['latitude']
            if 'longitude' in data:
                cinema.longitude = data['longitude']
            
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Cinema updated successfully',
                'data': cinema.to_dict()
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def delete_cinema(cinema_id):
        """
        Delete a cinema (cascade delete screens and seats)
        
        Args:
            cinema_id (int): Cinema ID
            
        Returns:
            dict: Success message
        """
        try:
            cinema = Cinema.query.get(cinema_id)
            
            if not cinema:
                return {'success': False, 'message': 'Cinema not found'}
            
            # Check if cinema has any showtimes
            for screen in cinema.screens:
                if screen.showtimes.count() > 0:
                    return {
                        'success': False,
                        'message': 'Cannot delete cinema with active showtimes'
                    }
            
            db.session.delete(cinema)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Cinema deleted successfully'
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    # ==================== SCREEN MANAGEMENT ====================
    
    @staticmethod
    def get_screens_by_cinema(cinema_id):
        """
        Get all screens for a cinema
        
        Args:
            cinema_id (int): Cinema ID
            
        Returns:
            dict: List of screens with seat count
        """
        try:
            cinema = Cinema.query.get(cinema_id)
            
            if not cinema:
                return {'success': False, 'message': 'Cinema not found'}
            
            screens = []
            for screen in cinema.screens:
                screen_dict = screen.to_dict()
                screen_dict['seat_count'] = screen.seats.count()
                screens.append(screen_dict)
            
            return {'success': True, 'data': screens}
        except SQLAlchemyError as e:
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def get_screen_by_id(screen_id):
        """
        Get screen details by ID with seats
        
        Args:
            screen_id (int): Screen ID
            
        Returns:
            dict: Screen details with seats
        """
        try:
            screen = Screen.query.get(screen_id)
            
            if not screen:
                return {'success': False, 'message': 'Screen not found'}
            
            screen_dict = screen.to_dict()
            
            # Get seats grouped by row
            seats = Seat.query.filter_by(screen_id=screen_id).order_by(Seat.seat_row, Seat.seat_number).all()
            
            seats_by_row = {}
            for seat in seats:
                if seat.seat_row not in seats_by_row:
                    seats_by_row[seat.seat_row] = []
                seats_by_row[seat.seat_row].append(seat.to_dict())
            
            screen_dict['seats'] = seats_by_row
            screen_dict['total_seats'] = len(seats)
            
            return {'success': True, 'data': screen_dict}
        except SQLAlchemyError as e:
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def create_screen(cinema_id, data):
        """
        Create a new screen for a cinema
        
        Args:
            cinema_id (int): Cinema ID
            data (dict): Screen data (screen_name, total_seats, screen_type)
            
        Returns:
            dict: Created screen data
        """
        try:
            # Validate cinema exists
            cinema = Cinema.query.get(cinema_id)
            if not cinema:
                return {'success': False, 'message': 'Cinema not found'}
            
            # Validate required fields
            if 'screen_name' not in data or not data['screen_name']:
                return {'success': False, 'message': 'Screen name is required'}
            
            # Create screen with total_seats = 0 initially
            screen = Screen(
                cinema_id=cinema_id,
                screen_name=data['screen_name'],
                total_seats=0,
                screen_type=data.get('screen_type', 'STANDARD')
            )
            
            db.session.add(screen)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Screen created successfully',
                'data': screen.to_dict()
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def update_screen(screen_id, data):
        """
        Update screen information
        
        Args:
            screen_id (int): Screen ID
            data (dict): Updated screen data
            
        Returns:
            dict: Updated screen data
        """
        try:
            screen = Screen.query.get(screen_id)
            
            if not screen:
                return {'success': False, 'message': 'Screen not found'}
            
            # Update fields
            if 'screen_name' in data:
                screen.screen_name = data['screen_name']
            if 'screen_type' in data:
                screen.screen_type = data['screen_type']
            
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Screen updated successfully',
                'data': screen.to_dict()
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def delete_screen(screen_id):
        """
        Delete a screen (cascade delete seats)
        
        Args:
            screen_id (int): Screen ID
            
        Returns:
            dict: Success message
        """
        try:
            screen = Screen.query.get(screen_id)
            
            if not screen:
                return {'success': False, 'message': 'Screen not found'}
            
            # Check if screen has any showtimes
            if screen.showtimes.count() > 0:
                return {
                    'success': False,
                    'message': 'Cannot delete screen with active showtimes'
                }
            
            db.session.delete(screen)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Screen deleted successfully'
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    # ==================== SEAT MANAGEMENT ====================
    
    @staticmethod
    def create_seats_for_screen(screen_id, seats_data):
        """
        Create multiple seats for a screen
        
        Args:
            screen_id (int): Screen ID
            seats_data (list): List of seat data [{seat_row, seat_number, seat_type}, ...]
            
        Returns:
            dict: Success message with created seats count
        """
        try:
            screen = Screen.query.get(screen_id)
            
            if not screen:
                return {'success': False, 'message': 'Screen not found'}
            
            created_seats = []
            
            for seat_data in seats_data:
                # Validate required fields
                if 'seat_row' not in seat_data or 'seat_number' not in seat_data:
                    continue
                
                # Check if seat already exists
                existing_seat = Seat.query.filter_by(
                    screen_id=screen_id,
                    seat_row=seat_data['seat_row'],
                    seat_number=seat_data['seat_number']
                ).first()
                
                if existing_seat:
                    continue
                
                seat = Seat(
                    screen_id=screen_id,
                    seat_row=seat_data['seat_row'],
                    seat_number=seat_data['seat_number'],
                    seat_type=seat_data.get('seat_type', 'REGULAR'),
                    is_available=seat_data.get('is_available', True)
                )
                
                db.session.add(seat)
                created_seats.append(seat)
            
            db.session.commit()
            
            # Update screen's total_seats count
            total_seats_count = Seat.query.filter_by(screen_id=screen_id).count()
            screen.total_seats = total_seats_count
            db.session.commit()
            
            return {
                'success': True,
                'message': f'{len(created_seats)} seats created successfully',
                'data': [seat.to_dict() for seat in created_seats]
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def generate_seats_for_screen(screen_id, rows, seats_per_row, seat_type='REGULAR'):
        """
        Auto-generate seats for a screen based on layout
        
        Args:
            screen_id (int): Screen ID
            rows (list): List of row letters (e.g., ['A', 'B', 'C'])
            seats_per_row (int): Number of seats per row
            seat_type (str): Type of seats (REGULAR, VIP, COUPLE)
            
        Returns:
            dict: Success message with created seats count
        """
        try:
            screen = Screen.query.get(screen_id)
            
            if not screen:
                return {'success': False, 'message': 'Screen not found'}
            
            seats_data = []
            for row in rows:
                for seat_num in range(1, seats_per_row + 1):
                    seats_data.append({
                        'seat_row': row,
                        'seat_number': seat_num,
                        'seat_type': seat_type
                    })
            
            return CinemasService.create_seats_for_screen(screen_id, seats_data)
        except Exception as e:
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    @staticmethod
    def update_seat(seat_id, data):
        """
        Update seat information
        
        Args:
            seat_id (int): Seat ID
            data (dict): Updated seat data
            
        Returns:
            dict: Updated seat data
        """
        try:
            seat = Seat.query.get(seat_id)
            
            if not seat:
                return {'success': False, 'message': 'Seat not found'}
            
            # Update fields
            if 'seat_type' in data:
                seat.seat_type = data['seat_type']
            if 'is_available' in data:
                seat.is_available = data['is_available']
            
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Seat updated successfully',
                'data': seat.to_dict()
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def delete_seat(seat_id):
        """
        Delete a seat
        
        Args:
            seat_id (int): Seat ID
            
        Returns:
            dict: Success message
        """
        try:
            seat = Seat.query.get(seat_id)
            
            if not seat:
                return {'success': False, 'message': 'Seat not found'}
            
            screen_id = seat.screen_id
            db.session.delete(seat)
            db.session.commit()
            
            # Update screen's total_seats count
            screen = Screen.query.get(screen_id)
            if screen:
                total_seats_count = Seat.query.filter_by(screen_id=screen_id).count()
                screen.total_seats = total_seats_count
                db.session.commit()
            
            return {
                'success': True,
                'message': 'Seat deleted successfully'
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
    
    @staticmethod
    def bulk_delete_seats(screen_id, seat_ids):
        """
        Delete multiple seats at once
        
        Args:
            screen_id (int): Screen ID
            seat_ids (list): List of seat IDs to delete
            
        Returns:
            dict: Success message with deleted count
        """
        try:
            deleted_count = Seat.query.filter(
                Seat.seat_id.in_(seat_ids),
                Seat.screen_id == screen_id
            ).delete(synchronize_session=False)
            
            db.session.commit()
            
            # Update screen's total_seats count
            screen = Screen.query.get(screen_id)
            if screen:
                total_seats_count = Seat.query.filter_by(screen_id=screen_id).count()
                screen.total_seats = total_seats_count
                db.session.commit()
            
            return {
                'success': True,
                'message': f'{deleted_count} seats deleted successfully'
            }
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'success': False, 'message': f'Database error: {str(e)}'}
