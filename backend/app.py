"""
Flask Application Main File
MyShowz - Movie Ticket Booking System
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from database.db import init_db
import os

# Khởi tạo Flask app
# Đặt folder frontend làm static folder
app = Flask(__name__, 
            static_folder='../frontend',
            static_url_path='')
app.config.from_object(Config)

# Cấu hình CORS
CORS(app, resources={
    r"/api/*": {
        "origins": Config.CORS_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Khởi tạo JWT
jwt = JWTManager(app)

# Khởi tạo database
db = init_db(app)

# Import và đăng ký blueprints
from routes.auth import auth_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint không tồn tại'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Lỗi server nội bộ'
    }), 500


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'success': False,
        'message': 'Token đã hết hạn'
    }), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'success': False,
        'message': 'Token không hợp lệ'
    }), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'success': False,
        'message': 'Thiếu token xác thực'
    }), 401


# Root endpoint - Redirect to frontend
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

# Serve frontend pages
@app.route('/sign_in.html')
def sign_in():
    return send_from_directory('../frontend', 'sign_in.html')

@app.route('/index.html')
def home():
    return send_from_directory('../frontend', 'index.html')

@app.route('/movies.html')
def movies():
    return send_from_directory('../frontend', 'movies.html')

@app.route('/about.html')
def about():
    return send_from_directory('../frontend', 'about.html')

@app.route('/Contact_Us.html')
def contact():
    return send_from_directory('../frontend', 'Contact_Us.html')

@app.route('/ticket-booking.html')
def ticket_booking():
    return send_from_directory('../frontend', 'ticket-booking.html')

@app.route('/e-ticket.html')
def e_ticket():
    return send_from_directory('../frontend', 'e-ticket.html')

# Serve seat selection page
@app.route('/seat_selection/seat_sel.html')
def seat_selection():
    return send_from_directory('../frontend/seat_selection', 'seat_sel.html')

# API info endpoint
@app.route('/api')
def api_info():
    return jsonify({
        'success': True,
        'message': 'Welcome to MyShowz API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'health': '/api/health'
        }
    }), 200


@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Server is running',
        'database': 'connected'
    }), 200


if __name__ == '__main__':
    print("=" * 70)
    print("🎬 MyShowz Server Starting...")
    print("=" * 70)
    print(f"🌐 Frontend: http://localhost:5000")
    print(f"   ├─ Home Page:   http://localhost:5000/")
    print(f"   ├─ Sign In:     http://localhost:5000/sign_in.html")
    print(f"   └─ Movies:      http://localhost:5000/movies.html")
    print(f"")
    print(f"🔧 Backend API: http://localhost:5000/api")
    print(f"   ├─ Health:      http://localhost:5000/api/health")
    print(f"   ├─ Register:    POST /api/auth/register")
    print(f"   └─ Login:       POST /api/auth/login")
    print(f"")
    print(f"🗄️  Database: movie_ticket (MySQL)")
    print("=" * 70)
    print("✨ Chỉ cần chạy: python app.py")
    print("✨ Mở trình duyệt: http://localhost:5000")
    print("=" * 70)
    app.run(debug=True, host='0.0.0.0', port=5000)

