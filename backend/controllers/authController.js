
/**
 * =====================================================
 * AUTH CONTROLLER - Fixed with bcrypt + backward compatibility
 * =====================================================
 */

const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = 'solara2026_secret_key';

console.log("Auth controller loaded - bcrypt enabled with callbacks");

// POST /api/auth/login
const login = (req, res) => {
    console.log("Login request:", req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, user) => {
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

        // Compare password - check if bcrypt hash or plain text
        let validPassword = false;
        
        // Check if password is bcrypt hash (starts with $2)
        if (user.password && user.password.startsWith('$2')) {
            // Use bcrypt comparison for hashed passwords
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    console.error("Bcrypt compare error:", err.message);
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                    });
                }
                
                if (!result) {
                    console.log("Invalid password for user:", email);
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                    });
                }
                
                // Login successful with bcrypt password
                console.log("Login successful (bcrypt) for:", email);
                createTokenAndRespond(user, res);
            });
        } else {
            // Plain text password - use direct comparison
            console.log("Plain text password detected for:", email);
            if (user.password !== password) {
                console.log("Invalid password for user:", email);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            
            console.log("Login successful (plain text) for:", email);
            createTokenAndRespond(user, res);
        }
    });
};

// Helper function to create token and respond
function createTokenAndRespond(user, res, req) {
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Set session if available
    if (req && req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
    }

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
}

// POST /api/auth/register
const registerUser = (req, res) => {
    console.log("Register request:", req.body.email);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required'
        });
    }

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.get(checkSql, [email], (err, existingUser) => {
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
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Password hash error:", err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to hash password'
                });
            }

            console.log("Password hashed successfully for:", email);

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
};

// POST /api/auth/logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ success: true, message: 'Logged out' });
        }
        res.json({ success: true, message: 'Logged out' });
    });
};

// GET /api/auth/user - Get current user
const getUser = (req, res) => {
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
};

// GET /api/auth/me - Session check
const me = (req, res) => {
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
};

module.exports = {
    login,
    registerUser,
    logout,
    getUser,
    me
};


