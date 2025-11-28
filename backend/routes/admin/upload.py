"""
Upload Routes - Handle file uploads for images and videos
"""
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from middleware.auth_middleware import admin_required
import os
import uuid
from datetime import datetime

upload_bp = Blueprint('upload', __name__)

# Allowed extensions
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'avi', 'mov', 'mkv'}

def allowed_file(filename, file_type='images'):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    if file_type == 'images':
        return ext in ALLOWED_IMAGE_EXTENSIONS
    elif file_type == 'videos':
        return ext in ALLOWED_VIDEO_EXTENSIONS
    return False

@upload_bp.route('/upload', methods=['POST'])
@admin_required()
def upload_file():
    """
    Upload file (image or video)
    """
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file part in request'
            }), 400
        
        file = request.files['file']
        file_type = request.form.get('type', 'images')  # 'images' or 'videos'
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Check file type
        if not allowed_file(file.filename, file_type):
            return jsonify({
                'success': False,
                'message': f'Invalid file type. Allowed: {ALLOWED_IMAGE_EXTENSIONS if file_type == "images" else ALLOWED_VIDEO_EXTENSIONS}'
            }), 400
        
        # Create upload directory if not exists
        upload_folder = os.path.join('uploads', file_type)
        os.makedirs(upload_folder, exist_ok=True)
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_ext = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_ext}"
        
        # Save file
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Return URL (relative path that backend will serve)
        file_url = f"/uploads/{file_type}/{unique_filename}"
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'data': {
                'url': file_url,
                'filename': unique_filename,
                'original_filename': original_filename,
                'type': file_type
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Upload failed: {str(e)}'
        }), 500
