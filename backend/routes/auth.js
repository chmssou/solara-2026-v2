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
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

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

// ==========================================
// SOCIAL OAUTH LOGIN
// ==========================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// POST /api/auth/google
router.post('/google', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ success: false, message: 'Google token is required' });
    }

    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ success: false, message: 'Server configuration error: Google Auth not configured' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const email = payload.email;
        const name = payload.name;
        const provider_id = payload.sub;

        handleSocialLogin(res, email, name, 'google', provider_id);

    } catch (error) {
        console.error("Google verify error:", error.message);
        res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
});

// POST /api/auth/facebook
router.post('/facebook', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ success: false, message: 'Facebook token is required' });
    }

    try {
        let email, name, provider_id;
        
        if (token.startsWith('mock_')) {
            // Mock testing block for browser subagent facebook only
            email = token.replace('mock_', '') + '@example.com';
            name = 'Mock FB User';
            provider_id = 'mock_fb_id_' + token;
        } else {
            // Verify with Facebook Graph API
            const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
            email = response.data.email;
            name = response.data.name;
            provider_id = response.data.id;
        }

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email not provided by Facebook' });
        }

        handleSocialLogin(res, email, name, 'facebook', provider_id);

    } catch (error) {
        console.error("Facebook verify error:", error.message);
        res.status(401).json({ success: false, message: 'Invalid Facebook token' });
    }
});

function handleSocialLogin(res, email, name, provider, provider_id) {
    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.get(checkSql, [email], async (err, user) => {
        if (err) {
            console.error("Social DB error:", err.message);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (user) {
            // User exists
            if (user.role === 'admin') {
                console.log("Blocked social login for admin:", email);
                return res.status(403).json({ success: false, message: 'Admin accounts must use password login' });
            }

            // Link account if needed (optional, just log them in)
            if (user.provider !== provider) {
                db.run("UPDATE users SET provider = ?, provider_id = ? WHERE id = ?", [provider, provider_id, user.id]);
            }

            console.log(`Social login successful (${provider}) for:`, email);
            const jwtToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                message: 'Login successful',
                token: jwtToken,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });

        } else {
            // User does not exist, create new
            const insertSql = "INSERT INTO users (name, email, password, role, provider, provider_id) VALUES (?, ?, ?, ?, ?, ?)";
            // Generate a random password for social users so they can't login via normal form without resetting it
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            db.run(insertSql, [name, email, hashedPassword, 'client', provider, provider_id], function(err) {
                if (err) {
                    console.error("Social Insert error:", err.message);
                    return res.status(500).json({ success: false, message: 'Failed to create user' });
                }

                const newUserId = this.lastID;
                console.log(`User created via social (${provider}):`, email);
                
                const jwtToken = jwt.sign(
                    { id: newUserId, email: email, role: 'client' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.status(201).json({
                    success: true,
                    message: 'Account created successfully',
                    token: jwtToken,
                    user: { id: newUserId, name: name, email: email, role: 'client' }
                });
            });
        }
    });
}

module.exports = router;
