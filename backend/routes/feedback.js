/**
 * =====================================================
 * FEEDBACK ROUTES - Feedback and Contact Form Endpoints
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// POST /api/feedback - Submit feedback/contact form
router.post('/', (req, res) => {
    const { name, projectType, phone, comment } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Name is required'
        });
    }

    const sql = "INSERT INTO feedback (name, projectType, phone, comment) VALUES (?, ?, ?, ?)";
    db.run(sql, [name, projectType || 'residential', phone || '', comment || ''], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to submit feedback'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for your feedback! We will contact you soon.'
        });
    });
});

// POST /api/contact - Alternative contact endpoint
router.post('/contact', (req, res) => {
    const { name, projectType, phone, comment } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Name is required'
        });
    }

    const sql = "INSERT INTO feedback (name, projectType, phone, comment) VALUES (?, ?, ?, ?)";
    db.run(sql, [name, projectType || 'residential', phone || '', comment || ''], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to submit contact request'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.'
        });
    });
});

// GET /api/feedback - Get all feedback (admin)
router.get('/', (req, res) => {
    const sql = "SELECT * FROM feedback ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

module.exports = router;

