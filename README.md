# MyShowz - Movie Ticket Booking System

## Quick Start

### 1. Tạo Database
- Mở MySQL Workbench
- Chạy file: `backend/database/create_database.sql`

### 2. Chạy Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 3. Mở Frontend
- Mở `frontend/sign_in.html` bằng Live Server (port 5500)

## Tài khoản mẫu
- **Admin**: admin@myshowz.com / admin123
- **User**: user@myshowz.com / user123

## API Endpoints
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Thông tin user (cần token)

## Database: movie_ticket
- MySQL: root/123456 @ localhost:3306
- Backend: http://localhost:5000
- Frontend: http://localhost:5500

