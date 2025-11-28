"""
Admin routes package
Initializes and registers all admin sub-blueprints
"""
from flask import Blueprint
from .accounts import accounts_bp
from .cinemas import cinemas_bp
from .movies import movies_bp
from .showtimes import showtimes_bp
from .promotions import promotions_bp
from .dashboard import dashboard_bp

# Main admin blueprint
admin_bp = Blueprint('admin', __name__)

# Register sub-blueprints
admin_bp.register_blueprint(dashboard_bp, url_prefix='')
admin_bp.register_blueprint(accounts_bp, url_prefix='/accounts')
admin_bp.register_blueprint(cinemas_bp, url_prefix='/cinemas')
admin_bp.register_blueprint(movies_bp, url_prefix='/movies')
admin_bp.register_blueprint(showtimes_bp, url_prefix='/showtimes')
admin_bp.register_blueprint(promotions_bp, url_prefix='/promotions')
