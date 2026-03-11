/**
 * =====================================================
 * LEADS ROUTES - Complete Lead Management Endpoints
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// GET /api/leads - Get all leads
router.get('/', (req, res) => {
    const sql = "SELECT * FROM leads ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }
        
        res.json({
            success: true,
            leads: rows
        });
    });
});

// POST /api/leads - Create new lead
router.post('/', (req, res) => {
    const { name, email, phone, status, notes, assigned_to } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: 'Name and email are required'
        });
    }

    const sql = "INSERT INTO leads (name, email, phone, status, notes, assigned_to) VALUES (?, ?, ?, ?, ?, ?)";
    db.run(sql, [name, email, phone || '', status || 'new', notes || '', assigned_to || null], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create lead'
            });
        }

        const leadId = this.lastID;

        // Also add to lead_activity
        const activitySql = "INSERT INTO lead_activity (lead_id, name, email, phone, status, notes, activity_type) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.run(activitySql, [leadId, name, email, phone || '', status || 'new', notes || '', 'created'], function(err) {
            if (err) console.error("Activity log error:", err.message);
        });

        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: {
                id: leadId,
                name,
                email,
                phone: phone || '',
                status: status || 'new',
                notes: notes || ''
            }
        });
    });
});

// PUT /api/leads/:id - Update lead
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { name, email, phone, status, notes, assigned_to } = req.body;

    const checkSql = "SELECT * FROM leads WHERE id = ?";
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

        const updateSql = "UPDATE leads SET name = ?, email = ?, phone = ?, status = ?, notes = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        db.run(updateSql, [
            name || existingLead.name,
            email || existingLead.email,
            phone !== undefined ? phone : existingLead.phone,
            status || existingLead.status,
            notes !== undefined ? notes : existingLead.notes,
            assigned_to !== undefined ? assigned_to : existingLead.assigned_to,
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
});

// PUT /api/leads/:id/status - Update lead status
router.put('/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({
            success: false,
            message: 'Status is required'
        });
    }

    const checkSql = "SELECT * FROM leads WHERE id = ?";
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

        const updateSql = "UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        db.run(updateSql, [status, id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update status'
                });
            }

            // Log activity
            const activitySql = "INSERT INTO lead_activity (lead_id, name, email, phone, status, activity_type) VALUES (?, ?, ?, ?, ?, ?)";
            db.run(activitySql, [id, existingLead.name, existingLead.email, existingLead.phone, status, 'status_change'], function(err) {
                if (err) console.error("Activity log error:", err.message);
            });

            res.json({
                success: true,
                message: 'Status updated successfully'
            });
        });
    });
});

// PUT /api/leads/:id/notes - Update lead notes
router.put('/:id/notes', (req, res) => {
    const id = req.params.id;
    const { notes } = req.body;

    const checkSql = "SELECT * FROM leads WHERE id = ?";
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

        const updateSql = "UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        db.run(updateSql, [notes || '', id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update notes'
                });
            }

            // Log activity
            const activitySql = "INSERT INTO lead_activity (lead_id, name, email, phone, status, notes, activity_type) VALUES (?, ?, ?, ?, ?, ?, ?)";
            db.run(activitySql, [id, existingLead.name, existingLead.email, existingLead.phone, existingLead.status, notes || '', 'note_added'], function(err) {
                if (err) console.error("Activity log error:", err.message);
            });

            res.json({
                success: true,
                message: 'Notes updated successfully'
            });
        });
    });
});

// PUT /api/leads/:id/assign - Assign lead to user
router.put('/:id/assign', (req, res) => {
    const id = req.params.id;
    const { assigned_to } = req.body;

    const checkSql = "SELECT * FROM leads WHERE id = ?";
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

        const updateSql = "UPDATE leads SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        db.run(updateSql, [assigned_to, id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to assign lead'
                });
            }

            res.json({
                success: true,
                message: 'Lead assigned successfully'
            });
        });
    });
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const checkSql = "SELECT * FROM leads WHERE id = ?";
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

        const deleteSql = "DELETE FROM leads WHERE id = ?";
        db.run(deleteSql, [id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete lead'
                });
            }

            // Also delete related activities
            const deleteActivitySql = "DELETE FROM lead_activity WHERE lead_id = ?";
            db.run(deleteActivitySql, [id], function(err) {
                if (err) console.error("Activity delete error:", err.message);
            });

            res.json({
                success: true,
                message: 'Lead deleted successfully'
            });
        });
    });
});

// GET /api/leads/export - Export leads
router.get('/export', (req, res) => {
    const { format, status, assigned_to } = req.query;
    
    let sql = "SELECT * FROM leads WHERE 1=1";
    const params = [];

    if (status && status !== 'all') {
        sql += " AND status = ?";
        params.push(status);
    }

    if (assigned_to) {
        sql += " AND assigned_to = ?";
        params.push(assigned_to);
    }

    sql += " ORDER BY id DESC";

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (format === 'csv') {
            const csv = convertToCSV(rows);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
            return res.send(csv);
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// GET /api/leads/count - Get lead count
router.get('/count', (req, res) => {
    const sql = "SELECT COUNT(*) as count FROM leads";
    db.get(sql, [], (err, row) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            count: row.count
        });
    });
});

// GET /api/leads/:id - Get single lead
router.get('/:id', (req, res) => {
    const id = req.params.id;

    const sql = "SELECT * FROM leads WHERE id = ?";
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
                message: 'Lead not found'
            });
        }

        res.json({
            success: true,
            data: row
        });
    });
});

// GET /api/leads/:id/activity - Get lead activity
router.get('/:id/activity', (req, res) => {
    const id = req.params.id;

    const sql = "SELECT * FROM lead_activity WHERE lead_id = ? ORDER BY created_at DESC";
    db.all(sql, [id], (err, rows) => {
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

// Helper function to convert to CSV
function convertToCSV(objArray) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    
    if (array.length > 0) {
        str += Object.keys(array[0]).join(',') + '\r\n';
        
        for (let i = 0; i < array.length; i++) {
            let line = '';
            for (let index in array[i]) {
                if (line != '') line += ','
                line += array[i][index];
            }
            str += line + '\r\n';
        }
    }
    
    return str;
}

module.exports = router;

