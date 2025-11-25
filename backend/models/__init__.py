"""
Models Package - Import tất cả models theo đúng thứ tự dependencies

Thứ tự import quan trọng để tránh circular import:
1. User (độc lập)
2. Movie, Cinema (độc lập)
3. Screen (phụ thuộc Cinema)
4. Seat (phụ thuộc Screen)
5. Showtime (phụ thuộc Movie, Screen)
6. Booking (phụ thuộc User, Showtime)
7. BookingSeat (phụ thuộc Booking, Seat)
8. Payment (phụ thuộc Booking)
9. Promotion (độc lập)
10. BookingPromotion (phụ thuộc Booking, Promotion)
11. Review (phụ thuộc User, Movie)
"""

# Independent models
from models.user import User
from models.movie import Movie, Cinema
from models.booking import Promotion

# Models with dependencies
from models.movie import Screen, Review
from models.seat import Seat
from models.showtime import Showtime
from models.booking import Booking, BookingSeat, BookingPromotion
from models.payment import Payment

__all__ = [
    # Users
    'User',
    
    # Movies & Cinemas
    'Movie',
    'Cinema',
    'Screen',
    'Review',
    
    # Seats & Showtimes
    'Seat',
    'Showtime',
    
    # Bookings
    'Booking',
    'BookingSeat',
    
    # Payments
    'Payment',
    
    # Promotions
    'Promotion',
    'BookingPromotion',
]
