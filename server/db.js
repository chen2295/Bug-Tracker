const mysql = require('mysql2');
require('dotenv').config();

// We use createPool instead of createConnection
// It is 100% compatible with her code but handles multiple users better.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;