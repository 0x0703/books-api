-- Создание базы данных (выполнить от имени postgres)
-- CREATE DATABASE books_db;

-- Подключиться к базе данных books_db и выполнить:

-- Таблица книг
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    publication_year INTEGER,
    genre VARCHAR(100),
    pages INTEGER,
    description TEXT,
    price DECIMAL(10, 2),
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Индексы для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);

-- Примеры данных для тестирования
INSERT INTO books (title, author, isbn, publication_year, genre, pages, description, price, in_stock)
VALUES 
    ('Война и мир', 'Лев Толстой', '978-5-17-090000-1', 1869, 'Роман', 1225, 'Роман-эпопея, описывающий русское общество в эпоху войн против Наполеона', 799.00, true),
    ('Преступление и наказание', 'Фёдор Достоевский', '978-5-17-090000-2', 1866, 'Роман', 608, 'Психологический роман о студенте Раскольникове', 499.00, true),
    ('Мастер и Маргарита', 'Михаил Булгаков', '978-5-17-090000-3', 1967, 'Роман', 480, 'Мистический роман о визите дьявола в Москву', 599.00, true),
    ('1984', 'Джордж Оруэлл', '978-5-17-090000-4', 1949, 'Антиутопия', 320, 'Роман-антиутопия о тоталитарном обществе', 399.00, false),
    ('Гарри Поттер и философский камень', 'Дж. К. Роулинг', '978-5-17-090000-5', 1997, 'Фэнтези', 309, 'Первая книга о юном волшебнике Гарри Поттере', 549.00, true)
ON CONFLICT (isbn) DO NOTHING;

