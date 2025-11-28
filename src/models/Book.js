const { query } = require('../config/database');

/**
 * Модель Book для работы с таблицей books в PostgreSQL
 * Реализует CRUD-операции: Create, Read, Update, Delete
 */
class Book {
    /**
     * Получить все книги с опциональной фильтрацией и пагинацией
     * @param {Object} options - Параметры запроса
     * @returns {Promise<Array>} Массив книг
     */
    static async findAll(options = {}) {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'created_at', 
            sortOrder = 'DESC',
            genre,
            author,
            inStock 
        } = options;

        const offset = (page - 1) * limit;
        const params = [];
        let whereConditions = [];
        let paramIndex = 1;

        // Фильтр по жанру
        if (genre) {
            whereConditions.push(`genre ILIKE $${paramIndex}`);
            params.push(`%${genre}%`);
            paramIndex++;
        }

        // Фильтр по автору
        if (author) {
            whereConditions.push(`author ILIKE $${paramIndex}`);
            params.push(`%${author}%`);
            paramIndex++;
        }

        // Фильтр по наличию
        if (inStock !== undefined) {
            whereConditions.push(`in_stock = $${paramIndex}`);
            params.push(inStock);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        // Безопасные значения для сортировки
        const allowedSortFields = ['id', 'title', 'author', 'publication_year', 'price', 'created_at'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const sql = `
            SELECT * FROM books 
            ${whereClause}
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);

        const result = await query(sql, params);

        // Получаем общее количество записей для пагинации
        const countSql = `SELECT COUNT(*) as total FROM books ${whereClause}`;
        const countParams = params.slice(0, -2); // Убираем LIMIT и OFFSET
        const countResult = await query(countSql, countParams);

        return {
            data: result.rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(countResult.rows[0].total / limit),
                totalItems: parseInt(countResult.rows[0].total),
                itemsPerPage: limit
            }
        };
    }

    /**
     * Найти книгу по ID
     * @param {number} id - ID книги
     * @returns {Promise<Object|null>} Книга или null
     */
    static async findById(id) {
        const sql = 'SELECT * FROM books WHERE id = $1';
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Найти книгу по ISBN
     * @param {string} isbn - ISBN книги
     * @returns {Promise<Object|null>} Книга или null
     */
    static async findByIsbn(isbn) {
        const sql = 'SELECT * FROM books WHERE isbn = $1';
        const result = await query(sql, [isbn]);
        return result.rows[0] || null;
    }

    /**
     * Создать новую книгу
     * @param {Object} bookData - Данные книги
     * @returns {Promise<Object>} Созданная книга
     */
    static async create(bookData) {
        const {
            title,
            author,
            isbn,
            publication_year,
            genre,
            pages,
            description,
            price,
            in_stock = true
        } = bookData;

        const sql = `
            INSERT INTO books (title, author, isbn, publication_year, genre, pages, description, price, in_stock)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const params = [title, author, isbn, publication_year, genre, pages, description, price, in_stock];
        const result = await query(sql, params);
        return result.rows[0];
    }

    /**
     * Обновить книгу
     * @param {number} id - ID книги
     * @param {Object} bookData - Новые данные книги
     * @returns {Promise<Object|null>} Обновленная книга или null
     */
    static async update(id, bookData) {
        // Получаем текущую книгу
        const existingBook = await this.findById(id);
        if (!existingBook) {
            return null;
        }

        // Формируем список полей для обновления
        const fields = ['title', 'author', 'isbn', 'publication_year', 'genre', 'pages', 'description', 'price', 'in_stock'];
        const updates = [];
        const params = [];
        let paramIndex = 1;

        for (const field of fields) {
            if (bookData[field] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);
                params.push(bookData[field]);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return existingBook; // Нет полей для обновления
        }

        params.push(id);
        const sql = `
            UPDATE books 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await query(sql, params);
        return result.rows[0];
    }

    /**
     * Удалить книгу
     * @param {number} id - ID книги
     * @returns {Promise<boolean>} true если удалено, false если не найдено
     */
    static async delete(id) {
        const sql = 'DELETE FROM books WHERE id = $1 RETURNING id';
        const result = await query(sql, [id]);
        return result.rowCount > 0;
    }

    /**
     * Поиск книг по названию или автору
     * @param {string} searchTerm - Поисковый запрос
     * @returns {Promise<Array>} Массив найденных книг
     */
    static async search(searchTerm) {
        const sql = `
            SELECT * FROM books 
            WHERE title ILIKE $1 OR author ILIKE $1 OR description ILIKE $1
            ORDER BY title
        `;
        const result = await query(sql, [`%${searchTerm}%`]);
        return result.rows;
    }
}

module.exports = Book;

