"""
Script kiểm tra models và database connection
Chạy: python test_models.py
"""
import sys
import os

# Thêm thư mục backend vào Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from config import Config
from database.db import init_db

def test_database_connection():
    """Kiểm tra kết nối database"""
    print("=" * 70)
    print("🧪 TESTING DATABASE CONNECTION & MODELS")
    print("=" * 70)
    
    # Tạo Flask app
    app = Flask(__name__)
    app.config.from_object(Config)
    
    try:
        # Khởi tạo database
        print("\n1️⃣ Initializing database...")
        db = init_db(app)
        print("✅ Database initialized successfully")
        
        # Import models
        print("\n2️⃣ Loading models...")
        from models import (
            User, Movie, Cinema, Screen, Review,
            Seat, Showtime, Booking, BookingSeat,
            Payment, Promotion, BookingPromotion
        )
        print("✅ All models imported successfully")
        
        # Test database connection
        print("\n3️⃣ Testing database connection...")
        with app.app_context():
            # Test query
            from sqlalchemy import text
            result = db.session.execute(text("SELECT VERSION()"))
            version = result.scalar()
            print(f"✅ MySQL version: {version}")
            
            # Check tables
            print("\n4️⃣ Checking database tables...")
            result = db.session.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result]
            
            expected_tables = [
                'users', 'movies', 'cinemas', 'screens', 'seats',
                'showtimes', 'bookings', 'booking_seats', 'payments',
                'reviews', 'promotions', 'booking_promotions'
            ]
            
            print(f"\nExpected tables: {len(expected_tables)}")
            print(f"Found tables: {len(tables)}")
            
            for table in expected_tables:
                if table in tables:
                    print(f"  ✅ {table}")
                else:
                    print(f"  ❌ {table} - MISSING!")
            
            # Test user count
            print("\n5️⃣ Testing sample data...")
            user_count = db.session.execute(text("SELECT COUNT(*) FROM users")).scalar()
            print(f"✅ Users in database: {user_count}")
            
            if user_count > 0:
                result = db.session.execute(text("SELECT email, full_name, role FROM users LIMIT 5"))
                print("\nSample users:")
                for email, name, role in result:
                    print(f"  - {email} | {name} | {role}")
            
        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED!")
        print("=" * 70)
        print("\n📝 Summary:")
        print("  ✅ Database connection: OK")
        print("  ✅ Models loading: OK")
        print(f"  ✅ Tables found: {len(tables)}/{len(expected_tables)}")
        print(f"  ✅ Sample data: {user_count} users")
        print("\n🎉 Your database is ready to use!")
        
        return True
        
    except Exception as e:
        print("\n" + "=" * 70)
        print("❌ TEST FAILED!")
        print("=" * 70)
        print(f"\n❌ Error: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("  1. Check if MySQL is running")
        print("  2. Verify database credentials in .env or config.py")
        print("  3. Make sure database 'movie_ticket' exists")
        print("  4. Run create_database.sql script first")
        return False


if __name__ == '__main__':
    success = test_database_connection()
    sys.exit(0 if success else 1)
