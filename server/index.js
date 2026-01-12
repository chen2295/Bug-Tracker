const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// 1. Database Connection Setup
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',             // This is the default MySQL user
    password: 'SelinaChen.060908', // <--- PUT YOUR MYSQL PASSWORD HERE
    database: 'bugtracker'    // The database name we created earlier
});

// 2. Test Connection Function (Optional, just to see in terminal)
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Successfully connected to the MySQL database!');
        connection.release();
    }
});

// 3. A New Route to Get Users from Database
app.get('/users', (req, res) => {
    const sql = "SELECT * FROM users";
    
    db.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        return res.json(data);
    });
});

app.get('/', (req, res) => {
    res.send("Hello! The server is working.");
});


// 3. Register Route (Add this!)
app.post('/register', (req, res) => {
    const { username, email, password, team_id } = req.body;

    // 1. Check if user exists
    const checkUserSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkUserSql, [email], (err, data) => {
        if (err) return res.status(500).json("Database error");
        if (data.length > 0) {
            return res.status(409).json("User already exists!");
        }

        // 2. Create the user
        const insertSql = "INSERT INTO users (username, email, password_hash, team_id) VALUES (?, ?, ?, ?)";
        const values = [username, email, password, team_id];

        db.query(insertSql, values, (err) => {
            if (err) return res.status(500).json("Error registering user");
            return res.status(200).json("User registered successfully");
        });
    });
});
// --- NEW: Team Management Routes ---

// 5. Create a New Team
app.post('/teams/create', (req, res) => {
    const { name, join_code, user_id } = req.body;

    // A. Create the team first
    const createTeamSql = "INSERT INTO teams (name, join_code) VALUES (?, ?)";
    db.query(createTeamSql, [name, join_code], (err, result) => {
        if (err) return res.status(500).json(err);
        
        const newTeamId = result.insertId; // Get the ID of the team we just made

        // B. Immediately add the user to this new team
        const updateUserSql = "UPDATE users SET team_id = ? WHERE id = ?";
        db.query(updateUserSql, [newTeamId, user_id], (err) => {
            if (err) return res.status(500).json("Failed to join team");
            res.json({ message: "Team created successfully", teamId: newTeamId });
        });
    });
});

// 6. Join an Existing Team
app.post('/teams/join', (req, res) => {
    const { join_code, user_id } = req.body;

    // A. Find the team with this code
    const findTeamSql = "SELECT * FROM teams WHERE join_code = ?";
    db.query(findTeamSql, [join_code], (err, data) => {
        if (err) return res.status(500).json(err);
        
        if (data.length === 0) {
            return res.status(404).json("Invalid Join Code");
        }

        const teamId = data[0].id;

        // B. Update the user's team_id
        const updateUserSql = "UPDATE users SET team_id = ? WHERE id = ?";
        db.query(updateUserSql, [teamId, user_id], (err) => {
            if (err) return res.status(500).json("Failed to join team");
            res.json({ message: "Joined team successfully", teamId: teamId });
        });
    });
});

// 4. Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Use a parameterized query to prevent SQL Injection
    const sql = "SELECT * FROM users WHERE email = ? AND password_hash = ?";

    db.query(sql, [email, password], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        
        // If we found a user, data array will have length > 0
        if (data.length > 0) {
            return res.json({ message: "Login Successful", user: data[0] });
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }
    });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});