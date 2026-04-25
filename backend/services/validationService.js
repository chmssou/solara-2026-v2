/**
 * =====================================================
 * VALIDATION SERVICE - Input Sanitisation & Checks
 * =====================================================
 */

const { isValidStatus, isValidType } = require('./workflowService');

/**
 * Sanitise a string: trim and truncate.
 */
function sanitizeString(value, maxLen = 500) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLen);
}

/**
 * Validate a phone number (loose – digits, spaces, +, -, parentheses).
 */
function isValidPhone(phone) {
    if (!phone) return true; // optional field
    return /^[\d\s\+\-\(\)]{6,20}$/.test(phone.trim());
}

/**
 * Validate an email address.
 */
function isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate a new service request body.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
function validateServiceRequest(body) {
    const errors = [];

    if (!body.name || !sanitizeString(body.name)) {
        errors.push('Name is required');
    }

    if (!body.phone && !body.email) {
        errors.push('At least one of phone or email is required');
    }

    if (body.email && !isValidEmail(body.email)) {
        errors.push('Invalid email address');
    }

    if (body.phone && !isValidPhone(body.phone)) {
        errors.push('Invalid phone number');
    }

    if (body.request_type && !isValidType(body.request_type)) {
        errors.push(`Invalid request_type. Must be "installation" or "maintenance"`);
    }

    return errors.length > 0
        ? { valid: false, errors }
        : { valid: true };
}

/**
 * Validate a status-update body.
 */
function validateStatusUpdate(body) {
    const errors = [];

    if (!body.status) {
        errors.push('status is required');
    } else if (!isValidStatus(body.status)) {
        errors.push(`Invalid status value: "${body.status}"`);
    }

    return errors.length > 0
        ? { valid: false, errors }
        : { valid: true };
}

/**
 * Validate registration body.
 */
function validateRegistration(body) {
    const errors = [];

    if (!body.name || !sanitizeString(body.name)) {
        errors.push('Name is required');
    }

    if (!body.email || !isValidEmail(body.email)) {
        errors.push('A valid email is required');
    }

    if (!body.password || body.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    return errors.length > 0
        ? { valid: false, errors }
        : { valid: true };
}

module.exports = {
    sanitizeString,
    isValidPhone,
    isValidEmail,
    validateServiceRequest,
    validateStatusUpdate,
    validateRegistration
};
