"""
Flask Application Main File
MyShowz - Movie Ticket Booking System - Backend API Only
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from database.db import init_db
import os
import re

# Khởi tạo Flask app - Backend API Only
app = Flask(__name__)
app.config.from_object(Config)

# Create uploads directory if not exists
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'images'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'videos'), exist_ok=True)

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


# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve uploaded files with proper MIME types"""
    import mimetypes
    from flask import Response
    import os
    
    file_path = os.path.join('uploads', filename)
    
    if not os.path.exists(file_path):
        return jsonify({
            'success': False,
            'message': 'File not found'
        }), 404
    
    # Get MIME type
    mime_type, _ = mimetypes.guess_type(filename)
    if mime_type is None:
        mime_type = 'application/octet-stream'
    
    # For video files, support range requests for seeking
    if mime_type.startswith('video/'):
        from flask import request
        
        file_size = os.path.getsize(file_path)
        range_header = request.headers.get('Range', None)
        
        if range_header:
            # Parse range header
            byte_start = 0
            byte_end = file_size - 1
            
            match = re.search(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                byte_start = int(match.group(1))
                if match.group(2):
                    byte_end = int(match.group(2))
            
            length = byte_end - byte_start + 1
            
            # Read the requested range
            with open(file_path, 'rb') as f:
                f.seek(byte_start)
                data = f.read(length)
            
            response = Response(
                data,
                206,  # Partial Content
                mimetype=mime_type,
                direct_passthrough=True
            )
            response.headers.add('Content-Range', f'bytes {byte_start}-{byte_end}/{file_size}')
            response.headers.add('Accept-Ranges', 'bytes')
            response.headers.add('Content-Length', str(length))
            return response
    
    # Normal file serving
    return send_from_directory('uploads', filename, mimetype=mime_type)


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

