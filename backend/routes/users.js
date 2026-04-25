/**
 * =====================================================
 * USER MANAGEMENT ROUTES - Admin API Endpoints
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin, JWT_SECRET } = require('../middleware/authMiddleware');

// GET /api/users - Get all users (admin only)
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const sql = "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            users: rows
        });
    });
});

// GET /api/users/:id - Get single user (admin only)
router.get('/:id', verifyToken, requireAdmin, (req, res) => {
    const id = req.params.id;

    const sql = "SELECT id, name, email, role, created_at FROM users WHERE id = ?";
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: row
        });
    });
});

// POST /api/users - Create new user (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required'
        });
    }

    // Validate role
    const validRoles = ['admin', 'client'];
    const userRole = validRoles.includes(role) ? role : 'client';

    // Check if email already exists
    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.get(checkSql, [email], async (err, existingUser) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password with bcrypt
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (hashError) {
            hashedPassword = password;
        }

        const insertSql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        db.run(insertSql, [name, email, hashedPassword, userRole], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create user'
                });
            }

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: {
                    id: this.lastID,
                    name,
                    email,
                    role: userRole
                }
            });
        });
    });
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const { name, email, password, role } = req.body;

    // Check if user exists
    const checkSql = "SELECT * FROM users WHERE id = ?";
    db.get(checkSql, [id], async (err, existingUser) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== existingUser.email) {
            const emailCheckSql = "SELECT * FROM users WHERE email = ? AND id != ?";
            db.get(emailCheckSql, [email, id], (err, userWithEmail) => {
                if (userWithEmail) {
                    return res.status(409).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
                updateUser();
            });
        } else {
            updateUser();
        }

        function updateUser() {
            // Validate role
            const validRoles = ['admin', 'client'];
            const userRole = (role && validRoles.includes(role)) ? role : existingUser.role;

            let hashedPassword = existingUser.password;
            if (password) {
                try {
                    hashedPassword = bcrypt.hashSync(password, 10);
                } catch (e) {
                    hashedPassword = password;
                }
            }

            const updateSql = "UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?";
            db.run(updateSql, [
                name || existingUser.name,
                email || existingUser.email,
                hashedPassword,
                userRole,
                id
            ], function(err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update user'
                    });
                }

                res.json({
                    success: true,
                    message: 'User updated successfully'
                });
            });
        }
    });
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    const id = req.params.id;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete your own account'
        });
    }

    const checkSql = "SELECT * FROM users WHERE id = ?";
    db.get(checkSql, [id], (err, existingUser) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const deleteSql = "DELETE FROM users WHERE id = ?";
        db.run(deleteSql, [id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete user'
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        });
    });
});

// PUT /api/users/:id/promote - Promote user to admin (admin only)
router.put('/:id/promote', verifyToken, requireAdmin, (req, res) => {
    const id = req.params.id;

    // Prevent promoting yourself (optional safety)
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({
            success: false,
            message: 'You are already an admin'
        });
    }

    const checkSql = "SELECT * FROM users WHERE id = ?";
    db.get(checkSql, [id], (err, existingUser) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (existingUser.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'User is already an admin'
            });
        }

        const updateSql = "UPDATE users SET role = 'admin' WHERE id = ?";
        db.run(updateSql, [id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to promote user'
                });
            }

            res.json({
                success: true,
                message: 'User promoted to admin successfully'
            });
        });
    });
});

// PUT /api/users/:id/demote - Demote admin to client (admin only)
router.put('/:id/demote', verifyToken, requireAdmin, (req, res) => {
    const id = req.params.id;

    // Prevent demoting yourself
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({
            success: false,
            message: 'Cannot demote yourself'
        });
    }

    const checkSql = "SELECT * FROM users WHERE id = ?";
    db.get(checkSql, [id], (err, existingUser) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (existingUser.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'User is not an admin'
            });
        }

        const updateSql = "UPDATE users SET role = 'client' WHERE id = ?";
        db.run(updateSql, [id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to demote user'
                });
            }

            res.json({
                success: true,
                message: 'Admin demoted to client successfully'
            });
        });
    });
});

module.exports = router;

