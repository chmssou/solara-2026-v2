/**
 * =====================================================
 * LEADS CONTROLLER
 * =====================================================
 */

const db = require('../db');

// GET /api/leads
const getLeads = (req, res) => {
    const sql = "SELECT * FROM lead_activity ORDER BY id DESC";
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

// POST /api/leads
const createLead = (req, res) => {
    const { name, email, phone, status, notes } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: 'Name and email are required'
        });
    }

    const sql = "INSERT INTO lead_activity (name, email, phone, status, notes) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [name, email, phone || '', status || 'new', notes || ''], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create lead'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: {
                id: this.lastID,
                name,
                email,
                phone: phone || '',
                status: status || 'new',
                notes: notes || ''
            }
        });
    });
};

// PUT /api/leads/:id
const updateLead = (req, res) => {
    const id = req.params.id;
    const { name, email, phone, status, notes } = req.body;

    const checkSql = "SELECT * FROM lead_activity WHERE id = ?";
    db.get(checkSql, [id], (err, existingLead) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!existingLead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        const updateSql = "UPDATE lead_activity SET name = ?, email = ?, phone = ?, status = ?, notes = ? WHERE id = ?";
        db.run(updateSql, [
            name || existingLead.name,
            email || existingLead.email,
            phone !== undefined ? phone : existingLead.phone,
            status || existingLead.status,
            notes !== undefined ? notes : existingLead.notes,
            id
        ], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update lead'
                });
            }

            res.json({
                success: true,
                message: 'Lead updated successfully'
            });
        });
    });
};

module.exports = {
    getLeads,
    createLead,
    updateLead
};

