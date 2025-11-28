"""
Models Package - Import tất cả models theo đúng thứ tự dependencies

Thứ tự import quan trọng để tránh circular import:
1. User (độc lập)
2. Movie, Cinema, Actor (độc lập)
3. MovieActor, MovieImage, MovieVideo (phụ thuộc Movie, Actor)
4. Screen (phụ thuộc Cinema)
5. Seat (phụ thuộc Screen)
6. Showtime (phụ thuộc Movie, Screen)
7. Booking (phụ thuộc User, Showtime)
8. BookingSeat (phụ thuộc Booking, Seat)
9. Payment (phụ thuộc Booking)
10. Promotion (độc lập)
11. BookingPromotion (phụ thuộc Booking, Promotion)
12. Review (phụ thuộc User, Movie)
"""

# Independent models
from models.user import User
from models.movie import Movie, Cinema
from models.actor import Actor
from models.booking import Promotion

# Models with dependencies
from models.actor import MovieActor
from models.movie_image import MovieImage
from models.movie_video import MovieVideo
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
    
    # Actors
    'Actor',
    'MovieActor',
    
    # Movie Media
    'MovieImage',
    'MovieVideo',
    
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
