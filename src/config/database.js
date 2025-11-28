const { Pool } = require('pg');
require('dotenv').config();

// Создание пула подключений к PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'books_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    // Настройки пула
    max: 20,                    // Максимальное количество клиентов в пуле
    idleTimeoutMillis: 30000,   // Время ожидания перед закрытием неактивного клиента
    connectionTimeoutMillis: 2000, // Время ожидания подключения
});

// Проверка подключения при старте
pool.on('connect', () => {
    console.log('✅ Подключено к базе данных PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Ошибка подключения к базе данных:', err);
    process.exit(-1);
});

// Функция для выполнения запросов
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Выполнен запрос', { text: text.substring(0, 50), duration: `${duration}ms`, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        throw error;
    }
};

// Функция для тестирования подключения
const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Тест подключения успешен:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Тест подключения неудачен:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    query,
    testConnection
};

