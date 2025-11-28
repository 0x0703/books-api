const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

/**
 * Middleware для проверки результатов валидации
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));
        
        return res.status(400).json({
            success: false,
            error: 'Ошибка валидации данных',
            details: errorMessages,
            timestamp: new Date().toISOString()
        });
    }
    next();
};

/**
 * Правила валидации для создания книги
 */
const createBookValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Название книги обязательно')
        .isLength({ min: 1, max: 255 }).withMessage('Название должно быть от 1 до 255 символов'),
    
    body('author')
        .trim()
        .notEmpty().withMessage('Автор обязателен')
        .isLength({ min: 1, max: 255 }).withMessage('Имя автора должно быть от 1 до 255 символов'),
    
    body('isbn')
        .optional({ nullable: true })
        .trim()
        .isLength({ min: 10, max: 20 }).withMessage('ISBN должен содержать от 10 до 20 символов')
        .matches(/^[\d\-X]+$/i).withMessage('ISBN может содержать только цифры, дефисы и X'),
    
    body('publication_year')
        .optional({ nullable: true })
        .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
        .withMessage(`Год публикации должен быть от 1000 до ${new Date().getFullYear() + 1}`),
    
    body('genre')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Жанр должен быть не более 100 символов'),
    
    body('pages')
        .optional({ nullable: true })
        .isInt({ min: 1, max: 50000 }).withMessage('Количество страниц должно быть от 1 до 50000'),
    
    body('description')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 5000 }).withMessage('Описание должно быть не более 5000 символов'),
    
    body('price')
        .optional({ nullable: true })
        .isFloat({ min: 0, max: 1000000 }).withMessage('Цена должна быть от 0 до 1000000'),
    
    body('in_stock')
        .optional()
        .isBoolean().withMessage('Поле in_stock должно быть булевым значением'),
    
    validate
];

/**
 * Правила валидации для обновления книги
 */
const updateBookValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID должен быть положительным целым числом'),
    
    body('title')
        .optional()
        .trim()
        .notEmpty().withMessage('Название не может быть пустым')
        .isLength({ min: 1, max: 255 }).withMessage('Название должно быть от 1 до 255 символов'),
    
    body('author')
        .optional()
        .trim()
        .notEmpty().withMessage('Автор не может быть пустым')
        .isLength({ min: 1, max: 255 }).withMessage('Имя автора должно быть от 1 до 255 символов'),
    
    body('isbn')
        .optional({ nullable: true })
        .trim()
        .isLength({ min: 10, max: 20 }).withMessage('ISBN должен содержать от 10 до 20 символов')
        .matches(/^[\d\-X]+$/i).withMessage('ISBN может содержать только цифры, дефисы и X'),
    
    body('publication_year')
        .optional({ nullable: true })
        .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
        .withMessage(`Год публикации должен быть от 1000 до ${new Date().getFullYear() + 1}`),
    
    body('genre')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Жанр должен быть не более 100 символов'),
    
    body('pages')
        .optional({ nullable: true })
        .isInt({ min: 1, max: 50000 }).withMessage('Количество страниц должно быть от 1 до 50000'),
    
    body('description')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 5000 }).withMessage('Описание должно быть не более 5000 символов'),
    
    body('price')
        .optional({ nullable: true })
        .isFloat({ min: 0, max: 1000000 }).withMessage('Цена должна быть от 0 до 1000000'),
    
    body('in_stock')
        .optional()
        .isBoolean().withMessage('Поле in_stock должно быть булевым значением'),
    
    validate
];

/**
 * Валидация параметра ID
 */
const idParamValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID должен быть положительным целым числом'),
    validate
];

/**
 * Валидация query-параметров для списка книг
 */
const listBooksValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Номер страницы должен быть положительным целым числом'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Лимит должен быть от 1 до 100'),
    
    query('sortBy')
        .optional()
        .isIn(['id', 'title', 'author', 'publication_year', 'price', 'created_at'])
        .withMessage('Сортировка возможна по: id, title, author, publication_year, price, created_at'),
    
    query('sortOrder')
        .optional()
        .isIn(['ASC', 'DESC', 'asc', 'desc'])
        .withMessage('Порядок сортировки: ASC или DESC'),
    
    query('inStock')
        .optional()
        .isBoolean().withMessage('inStock должен быть булевым значением'),
    
    validate
];

/**
 * Валидация поискового запроса
 */
const searchValidation = [
    query('q')
        .trim()
        .notEmpty().withMessage('Поисковый запрос обязателен')
        .isLength({ min: 2, max: 100 }).withMessage('Запрос должен быть от 2 до 100 символов'),
    validate
];

module.exports = {
    validate,
    createBookValidation,
    updateBookValidation,
    idParamValidation,
    listBooksValidation,
    searchValidation
};

