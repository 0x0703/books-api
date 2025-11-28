/**
 * Класс для создания HTTP ошибок с кодом статуса
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }

    static badRequest(message, details = null) {
        return new ApiError(400, message, details);
    }

    static notFound(message = 'Ресурс не найден') {
        return new ApiError(404, message);
    }

    static conflict(message, details = null) {
        return new ApiError(409, message, details);
    }

    static internal(message = 'Внутренняя ошибка сервера') {
        return new ApiError(500, message);
    }
}

/**
 * Middleware для обработки ошибок
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Ошибка:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    // Обработка ошибок PostgreSQL
    if (err.code) {
        switch (err.code) {
            case '23505': // unique_violation
                return res.status(409).json({
                    success: false,
                    error: 'Запись с такими данными уже существует',
                    details: err.detail,
                    timestamp: new Date().toISOString()
                });
            case '23503': // foreign_key_violation
                return res.status(400).json({
                    success: false,
                    error: 'Нарушение связи с другой таблицей',
                    details: err.detail,
                    timestamp: new Date().toISOString()
                });
            case '22P02': // invalid_text_representation
                return res.status(400).json({
                    success: false,
                    error: 'Неверный формат данных',
                    timestamp: new Date().toISOString()
                });
            case 'ECONNREFUSED':
                return res.status(503).json({
                    success: false,
                    error: 'База данных недоступна',
                    timestamp: new Date().toISOString()
                });
        }
    }

    // Обработка ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            details: err.details,
            timestamp: err.timestamp
        });
    }

    // Обработка ошибок валидации express-validator
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            success: false,
            error: 'Ошибка валидации',
            details: err.array(),
            timestamp: new Date().toISOString()
        });
    }

    // Общая обработка непредвиденных ошибок
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Внутренняя ошибка сервера' 
            : err.message,
        timestamp: new Date().toISOString()
    });
};

/**
 * Middleware для обработки несуществующих маршрутов
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Маршрут не найден',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler
};

