/**
 * =====================================================
 * AUTH ROUTES - Complete Authentication Endpoints
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = 'solara2026_secret_key';

// Debug logging
console.log("Auth routes loaded - bcrypt enabled");

// POST /api/auth/login
router.post('/login', async (req, res) => {
    console.log("Login request:", req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], async (err, user) => {
        if (err) {
            console.error("Login DB error:", err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!user) {
            console.log("User not found:", email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare password with bcrypt
        let validPassword = false;
        
        // Check if password is bcrypt hash (starts with $2)
        if (user.password && user.password.startsWith('$2')) {
            // Use bcrypt comparison for hashed passwords
            try {
                validPassword = await bcrypt.compare(password, user.password);
            } catch (e) {
                console.log("Bcrypt compare error:", e.message);
                validPassword = false;
            }
        } else {
            // Plain text password - use direct comparison
            console.log("Plain text password detected for:", email);
            validPassword = (user.password === password);
        }

        if (!validPassword) {
            console.log("Invalid password for user:", email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log("Login successful for:", email);

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    console.log("Register request:", req.body.email);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required'
        });
    }

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.get(checkSql, [email], async (err, existingUser) => {
        if (err) {
            console.error("Register DB error:", err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (existingUser) {
            console.log("Email already registered:", email);
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password with bcrypt
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
            console.log("Password hashed successfully for:", email);
        } catch (hashError) {
            console.error("Password hash error:", hashError.message);
            hashedPassword = password; // Fallback to plain text if hashing fails
        }

        const insertSql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        db.run(insertSql, [name, email, hashedPassword, 'client'], function(err) {
            if (err) {
                console.error("Insert error:", err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to register user'
                });
            }

            console.log("User registered successfully:", email);
            res.status(201).json({
                success: true,
                message: 'Account created successfully'
            });
        });
    });
});

// POST /api/auth/signup (alias for register)
router.post('/signup', async (req, res) => {
    console.log("Signup request:", req.body.email);
    const { full_name, name, email, password } = req.body;
    const userName = full_name || name;

    if (!userName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required'
        });
    }

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.get(checkSql, [email], async (err, existingUser) => {
        if (err) {
            console.error("Signup DB error:", err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (existingUser) {
            console.log("Email already registered:", email);
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password with bcrypt
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
            console.log("Password hashed successfully for:", email);
        } catch (hashError) {
            console.error("Password hash error:", hashError.message);
            hashedPassword = password;
        }

        const insertSql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        db.run(insertSql, [userName, email, hashedPassword, 'client'], function(err) {
            if (err) {
                console.error("Signup insert error:", err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to register user'
                });
            }

            console.log("User signed up successfully:", email);
            res.status(201).json({
                success: true,
                message: 'Account created successfully'
            });
        });
    });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/user
router.get('/user', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ success: false, user: null });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const sql = "SELECT id, name, email, role FROM users WHERE id = ?";
        db.get(sql, [decoded.id], (err, user) => {
            if (err || !user) {
                return res.json({ success: false, user: null });
            }

            res.json({
                success: true,
                user: user
            });
        });
    } catch (error) {
        res.json({ success: false, user: null });
    }
});

// GET /api/auth/me (session check)
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ success: false, user: null });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const sql = "SELECT id, name, email, role FROM users WHERE id = ?";
        db.get(sql, [decoded.id], (err, user) => {
            if (err || !user) {
                return res.json({ success: false, user: null });
            }

            res.json({
                success: true,
                user: user
            });
        });
    } catch (error) {
        res.json({ success: false, user: null });
    }
});

module.exports = router;

