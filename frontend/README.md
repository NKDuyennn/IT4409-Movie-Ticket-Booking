# MyShowz Frontend

Frontend cho hệ thống đặt vé xem phim MyShowz, sử dụng HTML/CSS/JavaScript thuần.

## 🎯 Tính năng

- ✅ Static HTML/CSS/JS (không cần build tool)
- ✅ Dark & Light mode
- ✅ Responsive design
- ✅ Kết nối với Backend API qua HTTP
- ✅ JWT Authentication
- ✅ User session management

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Python 3.x (đã có sẵn trên hầu hết hệ thống)
- Backend API đang chạy trên http://localhost:5000

### Chạy Frontend Server

```bash
cd frontend
python server.py
```

✅ Frontend chạy tại: **http://localhost:3000**

```
🌐 Frontend: http://localhost:3000
   ├─ Home:        http://localhost:3000/
   ├─ Sign In:     http://localhost:3000/sign_in.html
   ├─ Movies:      http://localhost:3000/movies.html
   ├─ About:       http://localhost:3000/about.html
   ├─ Contact:     http://localhost:3000/Contact_Us.html
   └─ Booking:     http://localhost:3000/ticket-booking.html
```

## ⚙️ Cấu hình

### API Configuration

File `assets/js/config.js` chứa cấu hình kết nối Backend:

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000',
    API_URL: 'http://localhost:5000/api',
    FRONTEND_URL: 'http://localhost:3000'
};
```

**Để deploy production**, cập nhật `API_BASE_URL` và `API_URL` với URL backend thật:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://api.myshowz.com',
    API_URL: 'https://api.myshowz.com/api',
    FRONTEND_URL: 'https://myshowz.com'
};
```

## 📁 Cấu trúc

```
frontend/
├── server.py              # Development server
├── index.html             # Trang chủ
├── sign_in.html           # Đăng nhập/Đăng ký
├── movies.html            # Danh sách phim
├── ticket-booking.html    # Đặt vé
├── e-ticket.html          # Vé điện tử
├── about.html             # Giới thiệu
├── Contact_Us.html        # Liên hệ
└── assets/
    ├── css/               # Stylesheets
    ├── js/
    │   ├── config.js      # ⚙️ API Configuration
    │   ├── auth-handler.js # Xử lý authentication
    │   ├── sign-in.js     # Login/Register logic
    │   └── ...            # Other scripts
    └── images/            # Images & icons
```

## 🚢 Deployment

### Option 1: Nginx (Production)

```nginx
server {
    listen 80;
    server_name myshowz.com;
    
    root /var/www/myshowz/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option 2: Vercel/Netlify

1. Push code lên GitHub
2. Connect với Vercel/Netlify
3. Configure:
   - Build command: (không cần)
   - Output directory: `frontend`
4. Cập nhật `config.js` với production API URL

### Option 3: GitHub Pages

```bash
# Build không cần thiết, chỉ cần push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

Settings → Pages → Source: main branch / frontend folder

## 🎨 Theme

Website hỗ trợ Dark & Light mode tự động theo system preference hoặc toggle thủ công.

### Demo : http://myshowz.infinityfreeapp.com/

# Glimpse of the web-site
## Home page in the dark mode
![Home page in the dark mode](./screenshots/MyShowz_home_page_dark.PNG)


## Home page in the light mode
![Home page in the light mode](./screenshots/MyShowz_home_page_light.PNG)


## Seat selection page in the dark mode
![Seat selection page in the dark mode](./screenshots/MyShowz_seat_sel_page_dark.PNG)


## SignIn-SignUp page in the dark mode
![SignIn-SignUp page in the dark mode](./screenshots/MyShowz_sign-in_page_dark.PNG)

## Credits

### Bootstrap Layout: https://w3layouts.com/tag/bootstrap-templates/
