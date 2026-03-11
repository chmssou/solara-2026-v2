/**
 * =====================================================
 * QUOTES ROUTES - Complete Quote Management Endpoints
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// GET /api/quotes - Get all quotes
router.get('/', (req, res) => {
    const sql = "SELECT * FROM quotes ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            quotes: rows,
            data: rows
        });
    });
});

// POST /api/quotes - Create new quote
router.post('/', (req, res) => {
    const { clientName, projectName, systemSize, totalPrice, status, user_id } = req.body;

    if (!clientName || !projectName || !systemSize || !totalPrice) {
        return res.status(400).json({
            success: false,
            message: 'Client name, project name, system size and total price are required'
        });
    }

    const sql = "INSERT INTO quotes (clientName, projectName, systemSize, totalPrice, status, user_id) VALUES (?, ?, ?, ?, ?, ?)";
    db.run(sql, [clientName, projectName, systemSize, totalPrice, status || 'pending', user_id || null], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create quote'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Quote created successfully',
            data: {
                id: this.lastID,
                clientName,
                projectName,
                systemSize,
                totalPrice,
                status: status || 'pending'
            }
        });
    });
});

// POST /api/quote - Alternative endpoint for quote submission (used by homepage)
router.post('/quote', (req, res) => {
    const { name, clientName, projectType, projectName, systemSize, totalPrice, phone, comment, status } = req.body;

    const finalClientName = clientName || name;
    const finalProjectName = projectName || projectType || 'residential';

    if (!finalClientName) {
        return res.status(400).json({
            success: false,
            message: 'Name is required'
        });
    }

    // Also save to feedback table
    const feedbackSql = "INSERT INTO feedback (name, projectType, phone, comment) VALUES (?, ?, ?, ?)";
    db.run(feedbackSql, [finalClientName, projectType || 'residential', phone || '', comment || ''], function(err) {
        if (err) console.error("Feedback insert error:", err.message);
    });

    const sql = "INSERT INTO quotes (clientName, projectName, systemSize, totalPrice, status) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [finalClientName, finalProjectName, systemSize || 0, totalPrice || 0, status || 'pending'], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create quote'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Quote request submitted successfully! We will contact you soon.',
            data: {
                id: this.lastID,
                clientName: finalClientName,
                projectName: finalProjectName
            }
        });
    });
});

// POST /api/quote - Also handle direct /api/quote route
router.post('/', (req, res) => {
    const { name, clientName, projectType, projectName, systemSize, totalPrice, phone, comment, status } = req.body;

    const finalClientName = clientName || name;
    const finalProjectName = projectName || projectType;

    if (!finalClientName || !finalProjectName) {
        return res.status(400).json({
            success: false,
            message: 'Name and project type are required'
        });
    }

    // Also save to feedback table
    const feedbackSql = "INSERT INTO feedback (name, projectType, phone, comment) VALUES (?, ?, ?, ?)";
    db.run(feedbackSql, [finalClientName, projectType || 'residential', phone || '', comment || ''], function(err) {
        if (err) console.error("Feedback insert error:", err.message);
    });

    const sql = "INSERT INTO quotes (clientName, projectName, systemSize, totalPrice, status) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [finalClientName, finalProjectName, systemSize || 0, totalPrice || 0, status || 'pending'], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create quote'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Quote request submitted successfully! We will contact you soon.',
            data: {
                id: this.lastID,
                clientName: finalClientName,
                projectName: finalProjectName
            }
        });
    });
});

// GET /api/quotes/:id - Get single quote
router.get('/:id', (req, res) => {
    const id = req.params.id;

    const sql = "SELECT * FROM quotes WHERE id = ?";
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
                message: 'Quote not found'
            });
        }

        res.json({
            success: true,
            data: row
        });
    });
});

// DELETE /api/quotes/:id - Delete quote
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const checkSql = "SELECT * FROM quotes WHERE id = ?";
    db.get(checkSql, [id], (err, existingQuote) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!existingQuote) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found'
            });
        }

        const deleteSql = "DELETE FROM quotes WHERE id = ?";
        db.run(deleteSql, [id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete quote'
                });
            }

            res.json({
                success: true,
                message: 'Quote deleted successfully'
            });
        });
    });
});

module.exports = router;

