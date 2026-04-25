/**
 * =====================================================
 * VALIDATION MIDDLEWARE
 * =====================================================
 * Express middleware layer that calls validationService
 * and short-circuits the request with 400 if invalid.
 */

const {
    validateServiceRequest,
    validateStatusUpdate,
    validateRegistration
} = require('../services/validationService');

const validateRequest = (req, res, next) => {
    const result = validateServiceRequest(req.body);
    if (!result.valid) {
        return res.status(400).json({ success: false, errors: result.errors });
    }
    next();
};

const validateStatus = (req, res, next) => {
    const result = validateStatusUpdate(req.body);
    if (!result.valid) {
        return res.status(400).json({ success: false, errors: result.errors });
    }
    next();
};

const validateRegister = (req, res, next) => {
    const result = validateRegistration(req.body);
    if (!result.valid) {
        return res.status(400).json({ success: false, errors: result.errors });
    }
    next();
};

module.exports = { validateRequest, validateStatus, validateRegister };
