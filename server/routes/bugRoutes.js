const express = require('express');
const router = express.Router();
const db = require('../db');

// --- 1. GET TEAM MEMBERS (Workaround) ---
router.get('/team-members', (req, res) => {
    const team_id = req.query.team_id;
    if (!team_id) return res.json([]); 

    const sql = "SELECT id, username, email FROM users WHERE team_id = ?";
    db.query(sql, [team_id], (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(data);
    });
});

// --- 2. GET BUGS (With Filters, Assignee Names, and LIMIT) ---
router.get('/', (req, res) => {
    const { team_id, assignee_id, limit } = req.query;

    let sql = `
        SELECT b.*, u.username as assignee_name 
        FROM bugs b 
        LEFT JOIN users u ON b.assignee_id = u.id 
    `;
    let params = [];
    let conditions = [];

    // Filter Logic
    if (assignee_id) {
        conditions.push('b.assignee_id = ?');
        params.push(assignee_id);
    } else if (team_id) {
        conditions.push('b.team_id = ?');
        params.push(team_id);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY b.created_at DESC';

    // LIMIT LOGIC (For "Recent 10" Dashboard)
    if (limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(limit));
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// --- 3. CREATE BUG ---
router.post('/', (req, res) => {
    const { title, description, priority, status, team_id = 1, assignee_id = null } = req.body;

    if (!title || !priority || !status) {
        return res.status(400).json({ error: "Title, Priority, and Status are required" });
    }

    const sql = "INSERT INTO bugs (team_id, assignee_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?, ?)";
    
    const finalAssignee = assignee_id === "" ? null : assignee_id;

    db.query(sql, [team_id, finalAssignee, title, description, priority, status], (err, result) => {
        if (err) {
            console.error("Error saving bug:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Bug created successfully!", id: result.insertId });
    });
});

// --- 4. UPDATE BUG ---
router.put('/:id', (req, res) => {
    const { assignee_id, status, priority } = req.body;
    const bugId = req.params.id;

    let fields = [];
    let values = [];

    if (assignee_id !== undefined) {
        fields.push('assignee_id = ?');
        values.push(assignee_id === "" || assignee_id === "null" ? null : assignee_id);
    }
    if (status !== undefined) {
        fields.push('status = ?');
        values.push(status);
    }
    if (priority !== undefined) {
        fields.push('priority = ?');
        values.push(priority);
    }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(bugId); 

    const sql = `UPDATE bugs SET ${fields.join(', ')} WHERE id = ?`;

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to update bug" });
        }
        res.json({ message: "Bug updated successfully" });
    });
});

module.exports = router;