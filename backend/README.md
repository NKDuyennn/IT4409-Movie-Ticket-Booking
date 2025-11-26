# MyShowz Backend API

Backend API thuần túy cho hệ thống đặt vé xem phim MyShowz, xây dựng bằng Flask.

## 🎯 Tính năng

- ✅ RESTful API thuần túy (không serve frontend)
- ✅ JWT Authentication (Access + Refresh Token)
- ✅ Role-based Authorization (User/Admin)
- ✅ CORS enabled cho frontend riêng biệt
- ✅ MySQL Database với SQLAlchemy ORM
- ✅ Password hashing với Bcrypt
- ✅ Input validation

## 📦 Cài đặt

### 1. Tạo Database MySQL

Mở MySQL Workbench và chạy file SQL:
```bash
# Chạy file: database/create_database.sql
```

Database sẽ được tạo với tên: **movie_ticket**

### 2. Cài đặt Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Cấu hình Environment (Tùy chọn)

Tạo file `.env` trong thư mục backend:
```env
# Database
DB_USER=root
DB_PASSWORD=123456
DB_HOST=localhost
DB_PORT=3306
DB_NAME=movie_ticket

# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# CORS - Allow frontend domain
CORS_ORIGINS=http://localhost:3000
```

### 4. Chạy Server

```bash
python app.py
```

✅ Server chạy tại: **http://localhost:5000**
✅ API Endpoints: **http://localhost:5000/api**

```
🔧 Backend API: http://localhost:5000
   ├─ Root:        http://localhost:5000/
   ├─ API Info:    http://localhost:5000/api
   ├─ Health:      http://localhost:5000/api/health
   ├─ Register:    POST /api/auth/register
   └─ Login:       POST /api/auth/login
```

## Cấu hình

File `config.py` chứa các cấu hình:

- **Database**: MySQL (root/123456@localhost:3306/movie_ticket)
- **JWT Token**: Access token 24h, Refresh token 30 ngày
- **CORS**: Cho phép frontend chạy tại `http://localhost:3000` (mặc định)

Có thể thay đổi bằng biến môi trường (.env file).

## API Endpoints

### Authentication

#### Đăng ký
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyen Van A",
  "phone_number": "0123456789"
}
```

#### Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "access_token": "eyJ0eXAi...",
  "refresh_token": "eyJ0eXAi...",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "Nguyen Van A",
    "role": "user"
  }
}
```

#### Lấy thông tin user hiện tại
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

## Phân quyền

Hệ thống có 2 loại user:
- **user**: Người dùng thông thường
- **admin**: Quản trị viên

### Sử dụng middleware admin

```python
from flask_jwt_extended import jwt_required
from middleware.auth_middleware import admin_required

@app.route('/admin/users')
@jwt_required()
@admin_required()
def get_all_users():
    # Chỉ admin mới truy cập được
    pass
```

## Tài khoản mẫu

- **Admin**: admin@myshowz.com / admin123
- **User**: user@myshowz.com / user123

## Database Schema

### Bảng chính

- **users** - Người dùng (có role: user/admin)
- **movies** - Phim (có age_rating: P, C13, C16, C18)
- **cinemas** - Rạp chiếu
- **screens** - Phòng chiếu
- **seats** - Ghế ngồi
- **showtimes** - Lịch chiếu
- **bookings** - Đặt vé
- **booking_seats** - Chi tiết ghế đã đặt
- **payments** - Thanh toán
- **reviews** - Đánh giá phim
- **promotions** - Mã khuyến mãi
- **booking_promotions** - Khuyến mãi áp dụng

## Cấu trúc Project

```
backend/
├── app.py                 # Flask app chính
├── config.py              # Cấu hình
├── requirements.txt       # Dependencies
├── database/
│   ├── db.py             # Database initialization
│   └── create_database.sql # SQL script
├── models/
│   ├── __init__.py
│   ├── user.py           # User model
│   ├── movie.py          # Movie, Cinema, Screen, Review
│   ├── seat.py           # Seat model
│   ├── showtime.py       # Showtime model
│   ├── booking.py        # Booking, Promotion models
│   └── payment.py        # Payment model
├── routes/
│   ├── __init__.py
│   └── auth.py           # Authentication routes
├── services/
│   ├── __init__.py
│   └── auth_service.py   # Auth business logic
└── middleware/
    ├── __init__.py
    └── auth_middleware.py # Admin authorization
```

## Tech Stack

- **Flask 3.0** - Web framework
- **SQLAlchemy 2.0** - ORM
- **MySQL + PyMySQL** - Database
- **Flask-JWT-Extended** - JWT authentication
- **Bcrypt** - Password hashing
- **Flask-CORS** - CORS handling

## Status

✅ Authentication (Signin/Signup) - Hoàn thành
🔜 Movies Management - Sắp triển khai
🔜 Booking System - Sắp triển khai
🔜 Payment Integration - Sắp triển khai

