"""
Flask Application Main File
MyShowz - Movie Ticket Booking System - Backend API Only
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from database.db import init_db
import os

# Khởi tạo Flask app - Backend API Only
app = Flask(__name__)
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
from routes.admin import admin_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')


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


# API Root endpoint
@app.route('/')
def index():
    return jsonify({
        'success': True,
        'message': 'Welcome to MyShowz API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'health': '/api/health',
            'info': '/api'
        }
    }), 200


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
    print("🎬 MyShowz Backend API Starting...")
    print("=" * 70)
    print(f"🔧 Backend API: http://localhost:5000")
    print(f"   ├─ Root:        http://localhost:5000/")
    print(f"   ├─ API Info:    http://localhost:5000/api")
    print(f"   ├─ Health:      http://localhost:5000/api/health")
    print(f"   ├─ Register:    POST /api/auth/register")
    print(f"   └─ Login:       POST /api/auth/login")
    print(f"")
    print(f"🗄️  Database: movie_ticket (MySQL)")
    print("=" * 70)
    print("💡 Chạy backend: cd backend && python app.py")
    print("💡 Chạy frontend: cd frontend && python server.py")
    print("=" * 70)
    app.run(debug=True, host='0.0.0.0', port=5000)

