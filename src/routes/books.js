const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { ApiError } = require('../middleware/errorHandler');
const {
    createBookValidation,
    updateBookValidation,
    idParamValidation,
    listBooksValidation,
    searchValidation
} = require('../middleware/validation');

/**
 * @route   GET /api/books
 * @desc    Получить все книги с пагинацией и фильтрацией
 * @access  Public
 */
router.get('/', listBooksValidation, async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, genre, author, inStock } = req.query;
        
        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            sortBy: sortBy || 'created_at',
            sortOrder: sortOrder || 'DESC',
            genre,
            author,
            inStock: inStock !== undefined ? inStock === 'true' : undefined
        };

        const result = await Book.findAll(options);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/books/search
 * @desc    Поиск книг по названию, автору или описанию
 * @access  Public
 */
router.get('/search', searchValidation, async (req, res, next) => {
    try {
        const { q } = req.query;
        const books = await Book.search(q);
        
        res.json({
            success: true,
            count: books.length,
            data: books
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/books/:id
 * @desc    Получить книгу по ID
 * @access  Public
 */
router.get('/:id', idParamValidation, async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        
        if (!book) {
            throw ApiError.notFound(`Книга с ID ${req.params.id} не найдена`);
        }
        
        res.json({
            success: true,
            data: book
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/books
 * @desc    Создать новую книгу
 * @access  Public
 */
router.post('/', createBookValidation, async (req, res, next) => {
    try {
        const {
            title,
            author,
            isbn,
            publication_year,
            genre,
            pages,
            description,
            price,
            in_stock
        } = req.body;

        // Проверка уникальности ISBN
        if (isbn) {
            const existingBook = await Book.findByIsbn(isbn);
            if (existingBook) {
                throw ApiError.conflict('Книга с таким ISBN уже существует', { isbn });
            }
        }

        const newBook = await Book.create({
            title,
            author,
            isbn,
            publication_year,
            genre,
            pages,
            description,
            price,
            in_stock
        });

        res.status(201).json({
            success: true,
            message: 'Книга успешно создана',
            data: newBook
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   PUT /api/books/:id
 * @desc    Обновить книгу полностью
 * @access  Public
 */
router.put('/:id', updateBookValidation, async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        
        if (!book) {
            throw ApiError.notFound(`Книга с ID ${req.params.id} не найдена`);
        }

        // Проверка уникальности ISBN при обновлении
        if (req.body.isbn && req.body.isbn !== book.isbn) {
            const existingBook = await Book.findByIsbn(req.body.isbn);
            if (existingBook) {
                throw ApiError.conflict('Книга с таким ISBN уже существует', { isbn: req.body.isbn });
            }
        }

        const updatedBook = await Book.update(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Книга успешно обновлена',
            data: updatedBook
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   PATCH /api/books/:id
 * @desc    Частично обновить книгу
 * @access  Public
 */
router.patch('/:id', updateBookValidation, async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        
        if (!book) {
            throw ApiError.notFound(`Книга с ID ${req.params.id} не найдена`);
        }

        // Проверка уникальности ISBN при обновлении
        if (req.body.isbn && req.body.isbn !== book.isbn) {
            const existingBook = await Book.findByIsbn(req.body.isbn);
            if (existingBook) {
                throw ApiError.conflict('Книга с таким ISBN уже существует', { isbn: req.body.isbn });
            }
        }

        const updatedBook = await Book.update(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Книга успешно обновлена',
            data: updatedBook
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   DELETE /api/books/:id
 * @desc    Удалить книгу
 * @access  Public
 */
router.delete('/:id', idParamValidation, async (req, res, next) => {
    try {
        const deleted = await Book.delete(req.params.id);
        
        if (!deleted) {
            throw ApiError.notFound(`Книга с ID ${req.params.id} не найдена`);
        }

        res.json({
            success: true,
            message: `Книга с ID ${req.params.id} успешно удалена`
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

