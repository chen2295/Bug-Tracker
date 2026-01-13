const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');
const bugRoutes = require('./routes/bugRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/bugs', bugRoutes);

// 1. Register User
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "User already exists" });
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "User registered!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// 2. Login User
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    
    db.query(sql, [email], async (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (data.length === 0) return res.status(404).json({ error: "User not found" });

        const user = data[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });

        res.json({ 
            message: "Login successful", 
            token: token, 
            // removed the 'joinCode' error from here
            user: { id: user.id, username: user.username, email: user.email, team_id: user.team_id }
        });
    });
});

// 3. Create Team
function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.post('/teams/create', (req, res) => {
    const { team_name, created_by } = req.body;
    if (!team_name || !created_by) return res.status(400).send("Missing data");

    const joinCode = generateJoinCode(); 

    // INSERT into 'join_code' column
    const sqlInsertTeam = "INSERT INTO teams (name, join_code) VALUES (?, ?)";
    
    db.query(sqlInsertTeam, [team_name, joinCode], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error creating team");
        }

        const newTeamId = result.insertId;

        // Update User
        const sqlUpdateUser = "UPDATE users SET team_id = ? WHERE id = ?";
        db.query(sqlUpdateUser, [newTeamId, created_by], (err, result) => {
            if (err) return res.status(500).send("Error updating user");

            // joinCode exists here, so this is correct!
            res.json({ 
                message: "Team created", 
                team_id: newTeamId, 
                join_code: joinCode 
            });
        });
    });
});

// 4. Join Team
app.post('/teams/join', (req, res) => {
    const { join_code, user_id } = req.body;

    const sqlFindTeam = "SELECT * FROM teams WHERE join_code = ?";
    
    db.query(sqlFindTeam, [join_code], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Invalid Join Code" });
        }

        const teamId = results[0].id;

        const sqlUpdate = "UPDATE users SET team_id = ? WHERE id = ?";
        db.query(sqlUpdate, [teamId, user_id], (err, result) => {
            if (err) return res.status(500).send("Error joining team");
            
            res.json({ message: "Joined team successfully", team_id: teamId });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});