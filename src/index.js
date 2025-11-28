const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const booksRouter = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========

// CORS - разрешаем запросы с других доменов
app.use(cors());

// Парсинг JSON в теле запроса
app.use(express.json());

// Парсинг URL-encoded данных
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📨 [${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ========== ROUTES ==========

// Главная страница API
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '📚 Books API - REST API для управления книгами',
        version: '1.0.0',
        endpoints: {
            'GET /api/books': 'Получить все книги (поддержка пагинации и фильтрации)',
            'GET /api/books/search?q=query': 'Поиск книг',
            'GET /api/books/:id': 'Получить книгу по ID',
            'POST /api/books': 'Создать новую книгу',
            'PUT /api/books/:id': 'Обновить книгу полностью',
            'PATCH /api/books/:id': 'Частично обновить книгу',
            'DELETE /api/books/:id': 'Удалить книгу'
        },
        queryParams: {
            'page': 'Номер страницы (по умолчанию: 1)',
            'limit': 'Количество записей на странице (по умолчанию: 10, макс: 100)',
            'sortBy': 'Поле для сортировки (id, title, author, publication_year, price, created_at)',
            'sortOrder': 'Порядок сортировки (ASC, DESC)',
            'genre': 'Фильтр по жанру',
            'author': 'Фильтр по автору',
            'inStock': 'Фильтр по наличию (true/false)'
        },
        documentation: 'https://github.com/your-repo/books-api'
    });
});

// Проверка здоровья API
app.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        success: true,
        status: 'OK',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Маршруты для книг
app.use('/api/books', booksRouter);

// ========== ERROR HANDLING ==========

// Обработка несуществующих маршрутов
app.use(notFoundHandler);

// Глобальный обработчик ошибок
app.use(errorHandler);

// ========== START SERVER ==========

const startServer = async () => {
    try {
        // Проверяем подключение к базе данных
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('⚠️  Не удалось подключиться к базе данных. Сервер будет запущен, но операции с БД будут недоступны.');
        }

        app.listen(PORT, () => {
            console.log('═'.repeat(50));
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`📚 API: http://localhost:${PORT}/api/books`);
            console.log(`💚 Health: http://localhost:${PORT}/health`);
            console.log('═'.repeat(50));
        });
    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error);
        process.exit(1);
    }
};

startServer();

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
    console.error('❌ Необработанное исключение:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Необработанный промис:', reason);
});

