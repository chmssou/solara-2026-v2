/**
 * =====================================================
 * QUOTES CONTROLLER
 * =====================================================
 */

const db = require('../db');

// GET /api/quotes
const getQuotes = (req, res) => {
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
            data: rows
        });
    });
};

// POST /api/quotes
const createQuote = (req, res) => {
    const { clientName, projectName, systemSize, totalPrice, status } = req.body;

    if (!clientName || !projectName || !systemSize || !totalPrice) {
        return res.status(400).json({
            success: false,
            message: 'Client name, project name, system size and total price are required'
        });
    }

    const sql = "INSERT INTO quotes (clientName, projectName, systemSize, totalPrice, status) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [clientName, projectName, systemSize, totalPrice, status || 'pending'], function(err) {
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
};

module.exports = {
    getQuotes,
    createQuote
};

