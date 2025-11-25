"""
Database Initialization Module
Khởi tạo SQLAlchemy và Flask-Migrate
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Khởi tạo SQLAlchemy instance
db = SQLAlchemy()
migrate = Migrate()


def init_db(app):
    """
    Khởi tạo database với Flask app
    
    Args:
        app: Flask application instance
        
    Returns:
        db: SQLAlchemy instance
    """
    # Initialize SQLAlchemy with app
    db.init_app(app)
    
    # Initialize Flask-Migrate with app and db
    migrate.init_app(app, db)
    
    with app.app_context():
        # Import tất cả models để SQLAlchemy nhận biết
        # Thứ tự import theo dependencies
        from models import (
            User, Movie, Cinema, Screen, Review,
            Seat, Showtime, Booking, BookingSeat,
            Payment, Promotion, BookingPromotion
        )
        
        # KHÔNG tự động tạo bảng vì đã có SQL script
        # db.create_all() - Comment out vì dùng create_database.sql
        
        print("✅ Database models loaded successfully")
        print(f"📊 Total models: {len(db.Model.__subclasses__())}")
        
    return db

