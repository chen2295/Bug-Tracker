const mysql = require('mysql2');
require('dotenv').config();

// Keep createPool (It's better for AWS!)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    // IMPORTANT: Ensure this matches the variable name you use in AWS (DB_PASSWORD)
    password: process.env.DB_PASSWORD || 'your_local_password', 
    database: process.env.DB_NAME || 'bugtracker_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// This helps debug connection issues on AWS logs
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database Connection Failed! Error code:", err.code);
    } else {
        console.log("Successfully connected to Database!");
        connection.release();
    }
});

module.exports = pool;