/**
 * =====================================================
 * AUTH MIDDLEWARE - Professional CRM Middleware
 * =====================================================
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'solara2026_secret_key';

/**
 * Verify JWT token - for protected API routes
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        // Invalid token, but continue anyway
    }

    next();
};

/**
 * requireAuth - Middleware to check if user is authenticated
 * Returns 401 JSON for API requests
 * Redirects to /login for page requests
 */
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Check if it's an API request or page request
        const acceptHeader = req.headers.accept || '';
        
        if (acceptHeader.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        // For page requests, redirect to login
        return res.redirect('/login');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        const acceptHeader = req.headers.accept || '';
        
        if (acceptHeader.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        return res.redirect('/login');
    }
};

/**
 * requireAdmin - Middleware to check if user is admin
 * Returns 403 Forbidden for API requests without admin role
 * Redirects to /dashboard for page requests
 */
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const acceptHeader = req.headers.accept || '';
        
        if (acceptHeader.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        return res.redirect('/login');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            const acceptHeader = req.headers.accept || '';
            
            if (acceptHeader.includes('application/json')) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }
            
            // Redirect non-admin users to their dashboard
            return res.redirect('/dashboard');
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        const acceptHeader = req.headers.accept || '';
        
        if (acceptHeader.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        return res.redirect('/login');
    }
};

/**
 * requireClientOrAdmin - Middleware to allow both client and admin
 */
const requireClientOrAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const acceptHeader = req.headers.accept || '';
        
        if (acceptHeader.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        return res.redirect('/login');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Allow both admin and client roles
        if (decoded.role !== 'admin' && decoded.role !== 'client') {
            const acceptHeader = req.headers.accept || '';
            
            if (acceptHeader.includes('application/json')) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid user role'
                });
            }
            
            return res.redirect('/login');
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        const acceptHeader = req.headers.accept || '';
        
        if (acceptHeader.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        return res.redirect('/login');
    }
};

module.exports = {
    verifyToken,
    optionalAuth,
    requireAuth,
    requireAdmin,
    requireClientOrAdmin,
    JWT_SECRET
};

