"""
Promotions service for admin operations
Handles business logic for promotion management
"""
from database.db import db
from models.booking import Promotion
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, date


class PromotionsService:
    """Service class for managing promotions"""
    
    @staticmethod
    def get_all_promotions(is_active=None):
        """Get all promotions with optional filters"""
        try:
            query = Promotion.query
            
            # Filter by active status if provided
            if is_active is not None:
                query = query.filter(Promotion.is_active == is_active)
            
            # Order by created_at descending (newest first)
            promotions = query.order_by(Promotion.created_at.desc()).all()
            
            return [promotion.to_dict() for promotion in promotions]
        except SQLAlchemyError as e:
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def get_promotion_by_id(promotion_id):
        """Get promotion details by ID"""
        try:
            promotion = Promotion.query.get(promotion_id)
            
            if not promotion:
                return None
            
            return promotion.to_dict()
        except SQLAlchemyError as e:
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def create_promotion(data):
        """Create a new promotion"""
        try:
            # Validate required fields
            required_fields = ['code', 'name', 'valid_from', 'valid_to']
            for field in required_fields:
                if field not in data or not data[field]:
                    raise ValueError(f"Missing required field: {field}")
            
            # Check if code already exists
            existing = Promotion.query.filter_by(code=data['code']).first()
            if existing:
                raise ValueError(f"Promotion code '{data['code']}' already exists")
            
            # Validate dates
            valid_from = datetime.strptime(data['valid_from'], '%Y-%m-%d').date() if isinstance(data['valid_from'], str) else data['valid_from']
            valid_to = datetime.strptime(data['valid_to'], '%Y-%m-%d').date() if isinstance(data['valid_to'], str) else data['valid_to']
            
            if valid_to < valid_from:
                raise ValueError("End date must be after start date")
            
            # Validate discount (must have either percentage or amount)
            discount_percentage = data.get('discount_percentage')
            discount_amount = data.get('discount_amount')
            
            if not discount_percentage and not discount_amount:
                raise ValueError("Must provide either discount_percentage or discount_amount")
            
            # Create promotion
            promotion = Promotion(
                code=data['code'].upper(),
                name=data['name'],
                description=data.get('description'),
                discount_percentage=discount_percentage,
                discount_amount=discount_amount,
                valid_from=valid_from,
                valid_to=valid_to,
                usage_limit=data.get('usage_limit'),
                used_count=0,
                is_active=data.get('is_active', True)
            )
            
            db.session.add(promotion)
            db.session.commit()
            
            return promotion.to_dict()
        except ValueError as e:
            db.session.rollback()
            raise e
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def update_promotion(promotion_id, data):
        """Update promotion information"""
        try:
            promotion = Promotion.query.get(promotion_id)
            
            if not promotion:
                return None
            
            # Check if code is being changed and if new code exists
            if 'code' in data and data['code'] != promotion.code:
                existing = Promotion.query.filter_by(code=data['code']).first()
                if existing:
                    raise ValueError(f"Promotion code '{data['code']}' already exists")
                promotion.code = data['code'].upper()
            
            # Update fields
            if 'name' in data:
                promotion.name = data['name']
            if 'description' in data:
                promotion.description = data['description']
            if 'discount_percentage' in data:
                promotion.discount_percentage = data['discount_percentage']
            if 'discount_amount' in data:
                promotion.discount_amount = data['discount_amount']
            
            # Validate and update dates
            if 'valid_from' in data:
                valid_from = datetime.strptime(data['valid_from'], '%Y-%m-%d').date() if isinstance(data['valid_from'], str) else data['valid_from']
                promotion.valid_from = valid_from
            
            if 'valid_to' in data:
                valid_to = datetime.strptime(data['valid_to'], '%Y-%m-%d').date() if isinstance(data['valid_to'], str) else data['valid_to']
                promotion.valid_to = valid_to
            
            # Validate dates
            if promotion.valid_to < promotion.valid_from:
                raise ValueError("End date must be after start date")
            
            if 'usage_limit' in data:
                promotion.usage_limit = data['usage_limit']
            if 'is_active' in data:
                promotion.is_active = data['is_active']
            
            db.session.commit()
            
            return promotion.to_dict()
        except ValueError as e:
            db.session.rollback()
            raise e
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception(f"Database error: {str(e)}")
    
    @staticmethod
    def delete_promotion(promotion_id):
        """Delete a promotion"""
        try:
            promotion = Promotion.query.get(promotion_id)
            
            if not promotion:
                return False
            
            # Check if promotion has been used
            if promotion.used_count > 0:
                raise ValueError("Cannot delete promotion that has been used. Consider deactivating it instead.")
            
            db.session.delete(promotion)
            db.session.commit()
            
            return True
        except ValueError as e:
            db.session.rollback()
            raise e
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception(f"Database error: {str(e)}")
