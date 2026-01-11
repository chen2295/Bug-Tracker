const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// 1. Database Connection
// We use process.env to grab secrets from your .env file
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// --- ROUTES ---

// 2. Register User (Sign Up)
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Hash the password so we don't store it as plain text
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
                // Check if error is "Duplicate entry" (email already exists)
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: "Email or Username already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "User registered successfully!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during registration" });
    }
});

// 3. Login User (Sign In)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    
    db.query(sql, [email], async (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        // If no user found with that email
        if (data.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = data[0];

        // Compare the password they sent with the hash in the DB
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // Generate the JWT Token (The "ID Card")
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );

        // Send back the token and user info
        res.json({ 
            message: "Login successful", 
            token: token, 
            user: { id: user.id, username: user.username, email: user.email } 
        });
    });
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});