/**
 * =====================================================
 * CLIENT ROUTES - Client-specific API Endpoints
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { verifyToken, requireClientOrAdmin } = require('../middleware/authMiddleware');

// Apply requireClientOrAdmin to all routes
router.use(verifyToken, requireClientOrAdmin);

// GET /api/client/leads - Get leads for current client
router.get('/leads', (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql;
    let params = [];

    if (userRole === 'admin') {
        // Admin can see all leads
        sql = "SELECT * FROM leads ORDER BY id DESC";
    } else {
        // Client can only see their own leads
        sql = "SELECT * FROM leads WHERE assigned_to = ? OR assigned_to IS NULL ORDER BY id DESC";
        params = [userId];
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            leads: rows
        });
    });
});

// GET /api/client/quotes - Get quotes for current client
router.get('/quotes', (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql;
    let params = [];

    if (userRole === 'admin') {
        // Admin can see all quotes
        sql = "SELECT * FROM quotes ORDER BY id DESC";
    } else {
        // Client can only see their own quotes (or quotes created without user_id - from website)
        sql = "SELECT * FROM quotes WHERE user_id = ? OR user_id IS NULL ORDER BY id DESC";
        params = [userId];
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            quotes: rows
        });
    });
});

// POST /api/client/leads - Client creates a lead
router.post('/leads', (req, res) => {
    const userId = req.user.id;
    const { name, email, phone, notes } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: 'Name and email are required'
        });
    }

    const sql = "INSERT INTO leads (name, email, phone, notes, assigned_to, status) VALUES (?, ?, ?, ?, ?, 'new')";
    db.run(sql, [name, email, phone || '', notes || '', userId], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create lead'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: {
                id: this.lastID,
                name,
                email,
                phone: phone || '',
                status: 'new'
            }
        });
    });
});

// POST /api/client/quotes - Client creates a quote request
router.post('/quotes', (req, res) => {
    const userId = req.user.id;
    const { clientName, projectName, systemSize, totalPrice } = req.body;

    if (!clientName || !projectName) {
        return res.status(400).json({
            success: false,
            message: 'Client name and project name are required'
        });
    }

    const sql = "INSERT INTO quotes (clientName, projectName, systemSize, totalPrice, status, user_id) VALUES (?, ?, ?, ?, 'pending', ?)";
    db.run(sql, [clientName, projectName, systemSize || 0, totalPrice || 0, userId], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create quote'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Quote request submitted successfully',
            data: {
                id: this.lastID,
                clientName,
                projectName,
                status: 'pending'
            }
        });
    });
});

// GET /api/client/profile - Get current user profile
router.get('/profile', (req, res) => {
    const userId = req.user.id;

    const sql = "SELECT id, name, email, role, created_at FROM users WHERE id = ?";
    db.get(sql, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user
        });
    });
});

// PUT /api/client/profile - Update current user profile
router.put('/profile', (req, res) => {
    const userId = req.user.id;
    const { name, email, password } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
        const emailCheckSql = "SELECT * FROM users WHERE email = ? AND id != ?";
        db.get(emailCheckSql, [email, userId], (err, userWithEmail) => {
            if (userWithEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
            updateProfile();
        });
    } else {
        updateProfile();
    }

    function updateProfile() {
        let updateSql;
        let params;

        if (password) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = bcrypt.hashSync(password, 10);
            updateSql = "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), password = ? WHERE id = ?";
            params = [name, email, hashedPassword, userId];
        } else {
            updateSql = "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?";
            params = [name, email, userId];
        }

        db.run(updateSql, params, function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update profile'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        });
    }
});

// GET /api/client/stats - Get client-specific stats
router.get('/stats', (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    const stats = {
        totalLeads: 0,
        totalQuotes: 0,
        wonLeads: 0,
        pendingQuotes: 0
    };

    if (userRole === 'admin') {
        // Admin sees all stats
        db.get("SELECT COUNT(*) as count FROM leads", [], (err, row) => {
            if (!err && row) stats.totalLeads = row.count;

            db.get("SELECT COUNT(*) as count FROM quotes", [], (err, row) => {
                if (!err && row) stats.totalQuotes = row.count;

                db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'won'", [], (err, row) => {
                    if (!err && row) stats.wonLeads = row.count;

                    db.get("SELECT COUNT(*) as count FROM quotes WHERE status = 'pending'", [], (err, row) => {
                        if (!err && row) stats.pendingQuotes = row.count;

                        res.json({
                            success: true,
                            stats: stats
                        });
                    });
                });
            });
        });
    } else {
        // Client sees their own stats
        db.get("SELECT COUNT(*) as count FROM leads WHERE assigned_to = ?", [userId], (err, row) => {
            if (!err && row) stats.totalLeads = row.count;

            db.get("SELECT COUNT(*) as count FROM quotes WHERE user_id = ? OR user_id IS NULL", [userId], (err, row) => {
                if (!err && row) stats.totalQuotes = row.count;

                db.get("SELECT COUNT(*) as count FROM leads WHERE assigned_to = ? AND status = 'won'", [userId], (err, row) => {
                    if (!err && row) stats.wonLeads = row.count;

                    db.get("SELECT COUNT(*) as count FROM quotes WHERE (user_id = ? OR user_id IS NULL) AND status = 'pending'", [userId], (err, row) => {
                        if (!err && row) stats.pendingQuotes = row.count;

                        res.json({
                            success: true,
                            stats: stats
                        });
                    });
                });
            });
        });
    }
});

module.exports = router;

