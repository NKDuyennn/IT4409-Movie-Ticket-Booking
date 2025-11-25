# MyShowz - Movie Ticket Booking System

## Quick Start

### 1. Tạo Database
- Mở MySQL Workbench
- Chạy file: `backend/database/create_database.sql`

### 2. Chạy Backend
Lưu ý dùng python 3.10
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Tài khoản mẫu
- **Admin**: admin@gmail.com / 123456
- **User**: user@gmail.com / 123456

## API Endpoints
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập  
- `GET /api/auth/me` - Thông tin user (cần token)

## Database: movie_ticket
- MySQL: root/123456 @ localhost:3306
- App: http://localhost:5000

