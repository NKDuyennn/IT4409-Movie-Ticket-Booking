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
    genre VARCHAR(100),
    language VARCHAR(50),
    rating DECIMAL(3,1) DEFAULT 0.0,
    age_rating VARCHAR(10) DEFAULT 'P',
    is_showing BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_showing (is_showing),
    INDEX idx_release_date (release_date),
    INDEX idx_age_rating (age_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng ACTORS (thông tin diễn viên)
CREATE TABLE actors (
    actor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    photo_url VARCHAR(500),
    date_of_birth DATE,
    nationality VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng MOVIE_ACTORS (quan hệ nhiều-nhiều giữa phim và diễn viên)
CREATE TABLE movie_actors (
    movie_actor_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    actor_id INT NOT NULL,
    role_name VARCHAR(255),
    character_name VARCHAR(255),
    display_order INT DEFAULT 0,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actors(actor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_movie_actor (movie_id, actor_id),
    INDEX idx_movie_id (movie_id),
    INDEX idx_actor_id (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng MOVIE_IMAGES (ảnh của phim)
CREATE TABLE movie_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) DEFAULT 'POSTER',
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    INDEX idx_movie_id (movie_id),
    INDEX idx_image_type (image_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng MOVIE_VIDEOS (video/trailer của phim)
CREATE TABLE movie_videos (
    video_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    video_url VARCHAR(500) NOT NULL,
    video_type VARCHAR(50) DEFAULT 'TRAILER',
    title VARCHAR(255),
    duration_seconds INT,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    INDEX idx_movie_id (movie_id),
    INDEX idx_video_type (video_type)
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

-- Insert Movies
INSERT INTO movies (title, description, duration_minutes, release_date, director, genre, language, rating, age_rating, is_showing) VALUES
('Avengers: Endgame', 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos actions and restore balance to the universe.', 181, '2019-04-26', 'Anthony Russo, Joe Russo', 'Action, Adventure, Sci-Fi', 'English', 8.4, 'T13', TRUE),
('The Shawshank Redemption', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 142, '1994-09-23', 'Frank Darabont', 'Drama', 'English', 9.3, 'T16', TRUE),
('The Dark Knight', 'When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham. The Dark Knight must accept one of the greatest psychological and physical tests.', 152, '2008-07-18', 'Christopher Nolan', 'Action, Crime, Drama', 'English', 9.0, 'T13', TRUE),
('Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 148, '2010-07-16', 'Christopher Nolan', 'Action, Sci-Fi, Thriller', 'English', 8.8, 'T13', TRUE),
('Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanitys survival.', 169, '2014-11-07', 'Christopher Nolan', 'Adventure, Drama, Sci-Fi', 'English', 8.6, 'T13', TRUE),
('Parasite', 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', 132, '2019-05-30', 'Bong Joon Ho', 'Comedy, Drama, Thriller', 'Korean', 8.5, 'T16', TRUE),
('The Godfather', 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', 175, '1972-03-24', 'Francis Ford Coppola', 'Crime, Drama', 'English', 9.2, 'T18', TRUE),
('Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.', 154, '1994-10-14', 'Quentin Tarantino', 'Crime, Drama', 'English', 8.9, 'T18', TRUE),
('Forrest Gump', 'The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man with an IQ of 75.', 142, '1994-07-06', 'Robert Zemeckis', 'Drama, Romance', 'English', 8.8, 'T13', TRUE),
('The Matrix', 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', 136, '1999-03-31', 'Lana Wachowski, Lilly Wachowski', 'Action, Sci-Fi', 'English', 8.7, 'T16', TRUE),
('Spirited Away', 'During her familys move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.', 125, '2001-07-20', 'Hayao Miyazaki', 'Animation, Adventure, Family', 'Japanese', 8.6, 'P', TRUE),
('Coco', 'Aspiring musician Miguel, confronted with his familys ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather, a legendary singer.', 105, '2017-11-22', 'Lee Unkrich', 'Animation, Adventure, Family', 'English', 8.4, 'P', TRUE);

-- Insert Actors
INSERT INTO actors (name, bio, photo_url, date_of_birth, nationality) VALUES
('Robert Downey Jr.', 'Robert John Downey Jr. is an American actor and producer. His career has been characterized by critical and popular success in his youth, followed by a period of substance abuse and legal troubles.', 'https://image.tmdb.org/t/p/w500/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg', '1965-04-04', 'American'),
('Chris Evans', 'Christopher Robert Evans is an American actor, best known for his role as Captain America in the Marvel Cinematic Universe series of films.', 'https://image.tmdb.org/t/p/w500/3bOGNsHlrswhyW79uvIHH1V43JI.jpg', '1981-06-13', 'American'),
('Scarlett Johansson', 'Scarlett Ingrid Johansson is an American actress and singer. The world\'s highest-paid actress since 2018, she has made multiple appearances in the Forbes Celebrity 100.', 'https://image.tmdb.org/t/p/w500/6NsMbJXRlDZuDzatN2akFdGuTvx.jpg', '1984-11-22', 'American'),
('Tim Robbins', 'Timothy Francis Robbins is an American actor, screenwriter, director, producer, and musician. He is known for his portrayal of Andy Dufresne in the prison drama film The Shawshank Redemption.', 'https://image.tmdb.org/t/p/w500/hsCb2e39XLyBjk2K7I0ixJ04p2a.jpg', '1958-10-16', 'American'),
('Morgan Freeman', 'Morgan Freeman is an American actor, film director, and film narrator. Freeman won an Academy Award in 2005 for Best Supporting Actor with Million Dollar Baby.', 'https://image.tmdb.org/t/p/w500/jPsLqiYGSofU4s6BjrxnefMfabb.jpg', '1937-06-01', 'American'),
('Christian Bale', 'Christian Charles Philip Bale is an English actor. Known for his versatility and intensive method acting, he is the recipient of many awards, including an Academy Award.', 'https://image.tmdb.org/t/p/w500/3qx2QFUbG6t6IlzR0F9k3Z6Yhf7.jpg', '1974-01-30', 'British'),
('Heath Ledger', 'Heath Andrew Ledger was an Australian actor, photographer, and music video director. After playing roles in Australian television, he moved to the United States to develop his film career.', 'https://image.tmdb.org/t/p/w500/5Y9HnYYa9jF4NunY9lSgJGjSe8E.jpg', '1979-04-04', 'Australian'),
('Leonardo DiCaprio', 'Leonardo Wilhelm DiCaprio is an American actor, film producer, and environmentalist. He has often played unconventional parts, particularly in biopics and period films.', 'https://image.tmdb.org/t/p/w500/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg', '1974-11-11', 'American'),
('Matthew McConaughey', 'Matthew David McConaughey is an American actor and producer. He first gained notice for his supporting performance in the coming-of-age comedy Dazed and Confused.', 'https://image.tmdb.org/t/p/w500/sY2mwpafcwqyYS1sOySu1MENDse.jpg', '1969-11-04', 'American'),
('Anne Hathaway', 'Anne Jacqueline Hathaway is an American actress. The recipient of various accolades, including an Academy Award, a Golden Globe Award, and a Primetime Emmy Award.', 'https://image.tmdb.org/t/p/w500/sYZAUIlFqCSR6fNP32U6ukN45dO.jpg', '1982-11-12', 'American'),
('Song Kang-ho', 'Song Kang-ho is a South Korean actor. Considered one of the best actors of the 21st century, he is most known for his collaborations with director Bong Joon-ho.', 'https://image.tmdb.org/t/p/w500/rQGAHIlwwIYDoNX7Xs1r4jJXHlj.jpg', '1967-01-17', 'South Korean'),
('Marlon Brando', 'Marlon Brando Jr. was an American actor and film director. He is credited with bringing realism to film acting, and is considered one of the greatest actors of all time.', 'https://image.tmdb.org/t/p/w500/fuTEPMsBtV1zE98ujPONbKiYDc2.jpg', '1924-04-03', 'American'),
('Al Pacino', 'Alfredo James Pacino is an American actor and filmmaker. He has received many awards and honors including an Academy Award, two Primetime Emmy Awards, and two Tony Awards.', 'https://image.tmdb.org/t/p/w500/2dGBb1fOcNdZjtQToVPFxXjm4ke.jpg', '1940-04-25', 'American'),
('John Travolta', 'John Joseph Travolta is an American actor and singer. He rose to fame during the 1970s, appearing on the television sitcom Welcome Back, Kotter.', 'https://image.tmdb.org/t/p/w500/9GVufE87MMIrSn0CbJFLudkALdL.jpg', '1954-02-18', 'American'),
('Samuel L. Jackson', 'Samuel Leroy Jackson is an American actor and producer. Widely regarded as one of the most popular actors of his generation, the films in which he has appeared have collectively grossed over $27 billion worldwide.', 'https://image.tmdb.org/t/p/w500/AiAYAqwpM5xmiFrAIeQvUXDCVvo.jpg', '1948-12-21', 'American'),
('Tom Hanks', 'Thomas Jeffrey Hanks is an American actor and filmmaker. Known for both his comedic and dramatic roles, he is one of the most popular and recognizable film stars worldwide.', 'https://image.tmdb.org/t/p/w500/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg', '1956-07-09', 'American'),
('Keanu Reeves', 'Keanu Charles Reeves is a Canadian actor. He is the recipient of numerous accolades in a career on screen spanning four decades.', 'https://image.tmdb.org/t/p/w500/4D0PpNI0kmP58hgrwGC3wCjxhnm.jpg', '1964-09-02', 'Canadian'),
('Carrie-Anne Moss', 'Carrie-Anne Moss is a Canadian actress. Following early roles on television, she rose to international prominence for her role of Trinity in The Matrix series.', 'https://image.tmdb.org/t/p/w500/xD4jTA3KmVp5Rq3aHcymL9DUGjD.jpg', '1967-08-21', 'Canadian');

-- Insert Movie-Actor relationships
INSERT INTO movie_actors (movie_id, actor_id, role_name, character_name, display_order) VALUES
-- Avengers: Endgame
(1, 1, 'Lead', 'Tony Stark / Iron Man', 1),
(1, 2, 'Lead', 'Steve Rogers / Captain America', 2),
(1, 3, 'Lead', 'Natasha Romanoff / Black Widow', 3),
-- The Shawshank Redemption
(2, 4, 'Lead', 'Andy Dufresne', 1),
(2, 5, 'Lead', 'Ellis Boyd Red Redding', 2),
-- The Dark Knight
(3, 6, 'Lead', 'Bruce Wayne / Batman', 1),
(3, 7, 'Lead', 'Joker', 2),
-- Inception
(4, 8, 'Lead', 'Dom Cobb', 1),
-- Interstellar
(5, 9, 'Lead', 'Joseph Cooper', 1),
(5, 10, 'Supporting', 'Brand', 2),
-- Parasite
(6, 11, 'Lead', 'Kim Ki-taek', 1),
-- The Godfather
(7, 12, 'Lead', 'Don Vito Corleone', 1),
(7, 13, 'Lead', 'Michael Corleone', 2),
-- Pulp Fiction
(8, 14, 'Lead', 'Vincent Vega', 1),
(8, 15, 'Lead', 'Jules Winnfield', 2),
-- Forrest Gump
(9, 16, 'Lead', 'Forrest Gump', 1),
-- The Matrix
(10, 17, 'Lead', 'Neo', 1),
(10, 18, 'Lead', 'Trinity', 2);

-- Insert Movie Images
INSERT INTO movie_images (movie_id, image_url, image_type, caption, display_order) VALUES
-- Avengers: Endgame
(1, 'https://image.tmdb.org/t/p/original/or06FN3Dka5tukK1e9sl16pB3iy.jpg', 'POSTER', 'Official Poster', 1),
(1, 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg', 'BACKDROP', 'Backdrop Image', 2),
(1, 'https://image.tmdb.org/t/p/original/9xeEGUZjgiKlI69jwIOi0hjKUIk.jpg', 'STILL', 'Movie Still 1', 3),
(1, 'https://image.tmdb.org/t/p/original/5myQbDzw3l8K9yofUXRJ4UTVgam.jpg', 'STILL', 'Movie Still 2', 4),
-- The Shawshank Redemption
(2, 'https://image.tmdb.org/t/p/original/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'POSTER', 'Official Poster', 1),
(2, 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg', 'BACKDROP', 'Backdrop Image', 2),
(2, 'https://image.tmdb.org/t/p/original/1174xAG9FkOHmwODNdZwvRBD7N3.jpg', 'STILL', 'Movie Still', 3),
-- The Dark Knight
(3, 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'POSTER', 'Official Poster', 1),
(3, 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg', 'BACKDROP', 'Backdrop Image', 2),
(3, 'https://image.tmdb.org/t/p/original/aQGBpJJWfK3VJzMcPh5P0qUzN35.jpg', 'STILL', 'Joker Scene', 3),
-- Inception
(4, 'https://image.tmdb.org/t/p/original/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'POSTER', 'Official Poster', 1),
(4, 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg', 'BACKDROP', 'Backdrop Image', 2),
(4, 'https://image.tmdb.org/t/p/original/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', 'STILL', 'Dream Scene', 3),
-- Interstellar
(5, 'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 'POSTER', 'Official Poster', 1),
(5, 'https://image.tmdb.org/t/p/original/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg', 'BACKDROP', 'Backdrop Image', 2),
(5, 'https://image.tmdb.org/t/p/original/4TnEkAu6tzJwEcza2pUTZkhfLDg.jpg', 'STILL', 'Space Scene', 3),
-- Parasite
(6, 'https://image.tmdb.org/t/p/original/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 'POSTER', 'Official Poster', 1),
(6, 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', 'BACKDROP', 'Backdrop Image', 2),
(6, 'https://image.tmdb.org/t/p/original/5WxGeayqFDjpDQvPmjWuXVS6cB9.jpg', 'STILL', 'Family Scene', 3),
-- The Godfather
(7, 'https://image.tmdb.org/t/p/original/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 'POSTER', 'Official Poster', 1),
(7, 'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg', 'BACKDROP', 'Backdrop Image', 2),
(7, 'https://image.tmdb.org/t/p/original/oJagOzBu9Rdd9BrciseCm3U3MCU.jpg', 'STILL', 'Iconic Scene', 3),
-- Pulp Fiction
(8, 'https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 'POSTER', 'Official Poster', 1),
(8, 'https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', 'BACKDROP', 'Backdrop Image', 2),
(8, 'https://image.tmdb.org/t/p/original/1HTqejyqgSMMMp6p5m2p0hQdPHP.jpg', 'STILL', 'Diner Scene', 3),
-- Forrest Gump
(9, 'https://image.tmdb.org/t/p/original/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 'POSTER', 'Official Poster', 1),
(9, 'https://image.tmdb.org/t/p/original/7c9UVPPiTPltouxRVY6N9uATkHM.jpg', 'BACKDROP', 'Backdrop Image', 2),
(9, 'https://image.tmdb.org/t/p/original/mMrrfx5wPwVJwJlCKBzH2aNSCPm.jpg', 'STILL', 'Bench Scene', 3),
-- The Matrix
(10, 'https://image.tmdb.org/t/p/original/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'POSTER', 'Official Poster', 1),
(10, 'https://image.tmdb.org/t/p/original/icmmSD4vTTDKOq2vvdulafOGw93.jpg', 'BACKDROP', 'Backdrop Image', 2),
(10, 'https://image.tmdb.org/t/p/original/nlKxyTA6bS9hxgjvXSq0tEDEgY5.jpg', 'STILL', 'Bullet Time Scene', 3),
-- Spirited Away
(11, 'https://image.tmdb.org/t/p/original/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', 'POSTER', 'Official Poster', 1),
(11, 'https://image.tmdb.org/t/p/original/6a5qcyCKkTc5u6Jkr9eIvdgI54P.jpg', 'BACKDROP', 'Backdrop Image', 2),
(11, 'https://image.tmdb.org/t/p/original/7M4DSU2rFMk0dXRAFlDhXOr7pjS.jpg', 'STILL', 'Bathhouse Scene', 3),
-- Coco
(12, 'https://image.tmdb.org/t/p/original/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', 'POSTER', 'Official Poster', 1),
(12, 'https://image.tmdb.org/t/p/original/askg3SMvhqEl4OL52YuvdtY40Yb.jpg', 'BACKDROP', 'Backdrop Image', 2),
(12, 'https://image.tmdb.org/t/p/original/zV9KzR5VnVPRUyxYb1HCHRxG4sn.jpg', 'STILL', 'Land of the Dead', 3);

-- Insert Movie Videos (Trailers)
INSERT INTO movie_videos (movie_id, video_url, video_type, title, duration_seconds, display_order) VALUES
-- Avengers: Endgame
(1, 'https://www.youtube.com/watch?v=TcMBFSGVi1c', 'TRAILER', 'Official Trailer', 150, 1),
(1, 'https://www.youtube.com/watch?v=0jNvJU52LvU', 'TRAILER', 'Special Look', 90, 2),
-- The Shawshank Redemption
(2, 'https://www.youtube.com/watch?v=6hB3S9bIaco', 'TRAILER', 'Official Trailer', 142, 1),
-- The Dark Knight
(3, 'https://www.youtube.com/watch?v=EXeTwQWrcwY', 'TRAILER', 'Official Trailer', 151, 1),
(3, 'https://www.youtube.com/watch?v=UMgb3hQCb08', 'TRAILER', 'Teaser Trailer', 75, 2),
-- Inception
(4, 'https://www.youtube.com/watch?v=YoHD9XEInc0', 'TRAILER', 'Official Trailer', 148, 1),
(4, 'https://www.youtube.com/watch?v=66TuSJo4dZM', 'TRAILER', 'Teaser Trailer', 90, 2),
-- Interstellar
(5, 'https://www.youtube.com/watch?v=zSWdZVtXT7E', 'TRAILER', 'Official Trailer', 165, 1),
(5, 'https://www.youtube.com/watch?v=Rt2LHkSwdPQ', 'TRAILER', 'Teaser Trailer', 80, 2),
-- Parasite
(6, 'https://www.youtube.com/watch?v=5xH0HfJHsaY', 'TRAILER', 'Official Trailer', 129, 1),
-- The Godfather
(7, 'https://www.youtube.com/watch?v=sY1S34973zA', 'TRAILER', 'Official Trailer', 170, 1),
-- Pulp Fiction
(8, 'https://www.youtube.com/watch?v=s7EdQ4FqbhY', 'TRAILER', 'Official Trailer', 150, 1),
-- Forrest Gump
(9, 'https://www.youtube.com/watch?v=bLvqoHBptjg', 'TRAILER', 'Official Trailer', 140, 1),
-- The Matrix
(10, 'https://www.youtube.com/watch?v=vKQi3bBA1y8', 'TRAILER', 'Official Trailer', 135, 1),
(10, 'https://www.youtube.com/watch?v=m8e-FF8MsqU', 'TRAILER', 'Teaser Trailer', 60, 2),
-- Spirited Away
(11, 'https://www.youtube.com/watch?v=ByXuk9QqQkk', 'TRAILER', 'Official Trailer', 122, 1),
-- Coco
(12, 'https://www.youtube.com/watch?v=Ga6RYejo6Hk', 'TRAILER', 'Official Trailer', 120, 1),
(12, 'https://www.youtube.com/watch?v=xlnPHQ3TLX8', 'TRAILER', 'Teaser Trailer', 90, 2);

-- Insert Promotions
INSERT INTO promotions (code, name, description, discount_percentage, discount_amount, valid_from, valid_to, usage_limit, used_count, is_active) VALUES
('SUMMER2024', 'Summer Sale 2024', 'Get 20% off on all movie tickets this summer!', 20.00, NULL, '2024-06-01', '2024-08-31', 1000, 245, TRUE),
('WELCOME10', 'Welcome New User', 'Special 10% discount for new users on their first booking', 10.00, NULL, '2024-01-01', '2024-12-31', NULL, 523, TRUE),
('WEEKEND50K', 'Weekend Special', 'Flat 50,000 VND off on weekend bookings', NULL, 50000.00, '2024-11-01', '2024-12-31', 500, 187, TRUE),
('STUDENT15', 'Student Discount', 'Students get 15% off with valid student ID', 15.00, NULL, '2024-09-01', '2025-06-30', 2000, 892, TRUE),
('NEWYEAR2024', 'New Year Special', 'Celebrate New Year with 25% discount on all shows', 25.00, NULL, '2024-12-25', '2025-01-05', 800, 654, FALSE),
('FAMILY30', 'Family Package', 'Book 4 or more tickets and get 30% off', 30.00, NULL, '2024-01-01', '2024-12-31', 1500, 423, TRUE),
('EARLYBIRD', 'Early Bird Discount', 'Book before 12 PM and save 100,000 VND', NULL, 100000.00, '2024-10-01', '2025-03-31', 300, 89, TRUE),
('VIPGOLD', 'VIP Gold Member', 'Exclusive 35% discount for VIP Gold members', 35.00, NULL, '2024-01-01', '2024-12-31', NULL, 1245, TRUE),
('BIRTHDAY20', 'Birthday Special', 'Get 20% off on your birthday month', 20.00, NULL, '2024-01-01', '2024-12-31', NULL, 678, TRUE),
('MIDWEEK40K', 'Midweek Madness', 'Save 40,000 VND on Tuesday and Wednesday shows', NULL, 40000.00, '2024-11-01', '2025-02-28', 600, 234, TRUE),
('COUPLE2FOR1', 'Couple Special', 'Buy one get one free for couple seats', 50.00, NULL, '2024-02-01', '2024-02-29', 400, 400, FALSE),
('FLASH30', 'Flash Sale', 'Limited time 30% off - Hurry!', 30.00, NULL, '2024-11-15', '2024-11-20', 200, 156, FALSE),
('LOYALTY25', 'Loyalty Reward', 'Thank you for being loyal - 25% discount', 25.00, NULL, '2024-01-01', '2024-12-31', NULL, 2134, TRUE),
('MATINEE20K', 'Matinee Show', 'Save 20,000 VND on shows before 5 PM', NULL, 20000.00, '2024-01-01', '2024-12-31', NULL, 567, TRUE),
('BLOCKBUSTER10', 'Blockbuster Deal', '10% off on all blockbuster movies', 10.00, NULL, '2024-11-01', '2024-12-31', 1000, 445, TRUE);

SELECT 'Database created successfully!' as message;
SELECT '✅ 2 sample users created:' as info;
SELECT '   Admin: admin@gmail.com / 123456' as admin_account;
SELECT '   User:  user@gmail.com / 123456' as user_account;
SELECT '✅ 15 sample promotions created' as promotions_info;
