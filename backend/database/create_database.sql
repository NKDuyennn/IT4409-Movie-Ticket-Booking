-- Tạo database cho MyShowz Movie Ticket Booking System
-- Chạy script này trong MySQL Workbench

-- Tạo database
DROP DATABASE IF EXISTS movie_ticket;
CREATE DATABASE movie_ticket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE movie_ticket;

-- Bảng USERS (với phân quyền role)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng MOVIES (với age_rating và updated_at)
CREATE TABLE movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    release_date DATE,
    director VARCHAR(255),
    cast TEXT,
    genre VARCHAR(100),
    language VARCHAR(50),
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    rating DECIMAL(3,1) DEFAULT 0.0,
    age_rating VARCHAR(10) DEFAULT 'P',
    is_showing BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_showing (is_showing),
    INDEX idx_release_date (release_date),
    INDEX idx_age_rating (age_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng CINEMAS (với updated_at)
CREATE TABLE cinemas (
    cinema_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng SCREENS
CREATE TABLE screens (
    screen_id INT AUTO_INCREMENT PRIMARY KEY,
    cinema_id INT NOT NULL,
    screen_name VARCHAR(100) NOT NULL,
    total_seats INT NOT NULL,
    screen_type VARCHAR(50),
    FOREIGN KEY (cinema_id) REFERENCES cinemas(cinema_id) ON DELETE CASCADE,
    INDEX idx_cinema_id (cinema_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng SEATS
CREATE TABLE seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    screen_id INT NOT NULL,
    seat_row VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    seat_type VARCHAR(50) DEFAULT 'REGULAR',
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (screen_id) REFERENCES screens(screen_id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat (screen_id, seat_row, seat_number),
    INDEX idx_screen_id (screen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng SHOWTIMES
CREATE TABLE showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    screen_id INT NOT NULL,
    show_datetime DATETIME NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    available_seats INT NOT NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES screens(screen_id) ON DELETE CASCADE,
    INDEX idx_show_datetime (show_datetime),
    INDEX idx_movie_id (movie_id),
    INDEX idx_screen_id (screen_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng BOOKINGS
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    booking_code VARCHAR(50) NOT NULL UNIQUE,
    booking_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_showtime_id (showtime_id),
    INDEX idx_booking_code (booking_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng BOOKING_SEATS
CREATE TABLE booking_seats (
    booking_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking_seat (booking_id, seat_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_seat_id (seat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng PAYMENTS
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_datetime DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng REVIEWS
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_movie_review (user_id, movie_id),
    INDEX idx_user_id (user_id),
    INDEX idx_movie_id (movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng PROMOTIONS (với name và created_at)
CREATE TABLE promotions (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    usage_limit INT,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active),
    INDEX idx_valid_dates (valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng BOOKING_PROMOTIONS
CREATE TABLE booking_promotions (
    booking_promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    promotion_id INT NOT NULL,
    discount_applied DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_promotion_id (promotion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data

-- Admin user (password: 123456)
INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active) 
VALUES ('admin@gmail.com', '$2b$12$1SZad7YqfIyu28jFJMSGO.X2r0ynuWGqP0IujurTZnS0rqtZMsfrm', 'Admin MyShowz', '0909123456', 'admin', TRUE);

-- Regular user (password: 123456)
INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active) 
VALUES ('user@gmail.com', '$2b$12$1SZad7YqfIyu28jFJMSGO.X2r0ynuWGqP0IujurTZnS0rqtZMsfrm', 'User Demo', '0909654321', 'user', TRUE);

SELECT 'Database created successfully!' as message;
SELECT '✅ 2 sample users created:' as info;
SELECT '   Admin: admin@gmail.com / 123456' as admin_account;
SELECT '   User:  user@gmail.com / 123456' as user_account;
