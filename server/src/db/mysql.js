const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,        // 最大连接数
    queueLimit: 0,
    charset: 'utf8mb4',
});

async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ MySQL 连接成功');
        conn.release();
    } catch (err) {
        console.error('❌ MySQL 连接失败:', err.message);
        process.exit(1);
    }
}

module.exports = { pool, testConnection };