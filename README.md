# MyShowz - Movie Ticket Booking System

Hệ thống đặt vé xem phim với Backend API (Flask) và Frontend (Static HTML/JS) chạy riêng biệt.

## 📋 Yêu cầu
- Python 3.10+
- MySQL 8.0+
- Trình duyệt web hiện đại

## 🚀 Quick Start

### 1. Tạo Database
- Mở MySQL Workbench
- Chạy file: `backend/database/create_database.sql`

### 2. Chạy Backend API (Port 5000)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
✅ Backend API: http://localhost:5000/api

### 3. Chạy Frontend (Port 3000)
Mở terminal mới:
```bash
cd frontend
python server.py
```
✅ Frontend: http://localhost:3000

## 🏗️ Kiến trúc

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │ ──────▶ │   Backend API   │
│   Port 3000     │  HTTP   │   Port 5000     │
│   Static Files  │ ◀────── │   Flask + JWT   │
└─────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   MySQL DB      │
                            │   Port 3306     │
                            └─────────────────┘
```

### Backend (Port 5000)
- RESTful API thuần túy
- Flask + SQLAlchemy + JWT
- CORS enabled cho frontend
- Xem chi tiết: [backend/README.md](backend/README.md)

### Frontend (Port 3000)
- Static HTML/CSS/JS
- Simple HTTP Server
- Gọi API qua http://localhost:5000
- Xem chi tiết: [frontend/README.md](frontend/README.md)

## 🔑 Tài khoản mẫu
- **Admin**: admin@gmail.com / 123456
- **User**: user@gmail.com / 123456

## 📡 API Endpoints
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập  
- `GET /api/auth/me` - Thông tin user (cần token)
- `GET /api/health` - Health check

## ⚙️ Cấu hình

### Backend Config (backend/config.py)
- Database: `root/123456@localhost:3306/movie_ticket`
- CORS: `http://localhost:3000` (mặc định)
- JWT Token: 24h access, 30 ngày refresh

### Frontend Config (frontend/assets/js/config.js)
- API URL: `http://localhost:5000/api`
- Frontend URL: `http://localhost:3000`

## 🚢 Deployment

### Backend
- Deploy lên các platform: Heroku, Railway, Render, AWS
- Cập nhật biến môi trường trong `.env`
- Cập nhật CORS_ORIGINS cho production domain

### Frontend
- Deploy lên: Vercel, Netlify, GitHub Pages, Nginx
- Cập nhật `API_BASE_URL` trong `config.js` với URL backend production

### Nginx Example
```nginx
# Frontend
server {
    listen 80;
    server_name myshowz.com;
    root /var/www/frontend;
    index index.html;
}

# Backend API
server {
    listen 80;
    server_name api.myshowz.com;
    location / {
        proxy_pass http://localhost:5000;
    }
}
```

## 🛠️ Tech Stack
- **Backend**: Flask 3.0, SQLAlchemy 2.0, MySQL, JWT
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Bootstrap
- **Server**: Python http.server (dev), Nginx (production)

## 📝 License
MIT License