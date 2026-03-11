/**
 * =====================================================
 * ADMIN ROUTES - Statistics and Admin Endpoints
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// GET /api/admin/stats - Get admin statistics
router.get('/stats', (req, res) => {
    const stats = {
        totalLeads: 0,
        newMessages: 0,
        totalInquiries: 0,
        resolvedMessages: 0,
        newLeads: 0,
        contactedLeads: 0,
        qualifiedLeads: 0,
        wonLeads: 0,
        statusBreakdown: { new: 0, contacted: 0, qualified: 0, won: 0 },
        monthlyLeads: []
    };

    // Get total leads (clients)
    db.get("SELECT COUNT(*) as count FROM leads", [], (err, row) => {
        if (!err && row) stats.totalLeads = row.count;
        
        // Get total inquiries (same as leads for now)
        stats.totalInquiries = stats.totalLeads;
        
        // Get new messages (leads with status 'new')
        db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'new'", [], (err, row) => {
            if (!err && row) {
                stats.newMessages = row.count;
                stats.statusBreakdown.new = row.count;
            }
            
            // Get contacted leads
            db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'contacted'", [], (err, row) => {
                if (!err && row) {
                    stats.contactedLeads = row.count;
                    stats.statusBreakdown.contacted = row.count;
                }
                
                // Get qualified leads
                db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'qualified'", [], (err, row) => {
                    if (!err && row) {
                        stats.qualifiedLeads = row.count;
                        stats.statusBreakdown.qualified = row.count;
                    }
                    
                    // Get won leads
                    db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'won'", [], (err, row) => {
                        if (!err && row) {
                            stats.wonLeads = row.count;
                            stats.statusBreakdown.won = row.count;
                        }
                        
                        // Calculate resolved messages (contacted + qualified + won)
                        stats.resolvedMessages = stats.contactedLeads + stats.qualifiedLeads + stats.wonLeads;
                        
                        // Get monthly leads for chart
                        db.all("SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM leads GROUP BY month ORDER BY month DESC LIMIT 6", [], (err, rows) => {
                            if (!err && rows) {
                                stats.monthlyLeads = rows.reverse();
                            }
                            
                            res.json({
                                success: true,
                                stats: stats
                            });
                        });
                    });
                });
            });
        });
    });
});

// GET /api/admin/quotes - Get all quotes (admin view)
router.get('/quotes', (req, res) => {
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
            quotes: rows
        });
    });
});

// GET /api/stats - Get general statistics (alternative endpoint)
router.get('/stats', (req, res) => {
    const stats = {
        totalLeads: 0,
        totalQuotes: 0,
        newLeads: 0,
        contactedLeads: 0,
        qualifiedLeads: 0,
        wonLeads: 0,
        pendingQuotes: 0,
        approvedQuotes: 0
    };

    // Get total leads
    db.get("SELECT COUNT(*) as count FROM leads", [], (err, row) => {
        if (!err && row) stats.totalLeads = row.count;
        
        // Get new leads count
        db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'new'", [], (err, row) => {
            if (!err && row) stats.newLeads = row.count;
            
            // Get contacted leads
            db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'contacted'", [], (err, row) => {
                if (!err && row) stats.contactedLeads = row.count;
                
                // Get qualified leads
                db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'qualified'", [], (err, row) => {
                    if (!err && row) stats.qualifiedLeads = row.count;
                    
                    // Get won leads
                    db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'won'", [], (err, row) => {
                        if (!err && row) stats.wonLeads = row.count;
                        
                        // Get total quotes
                        db.get("SELECT COUNT(*) as count FROM quotes", [], (err, row) => {
                            if (!err && row) stats.totalQuotes = row.count;
                            
                            // Get pending quotes
                            db.get("SELECT COUNT(*) as count FROM quotes WHERE status = 'pending'", [], (err, row) => {
                                if (!err && row) stats.pendingQuotes = row.count;
                                
                                // Get approved quotes
                                db.get("SELECT COUNT(*) as count FROM quotes WHERE status = 'approved'", [], (err, row) => {
                                    if (!err && row) stats.approvedQuotes = row.count;
                                    
                                    res.json({
                                        success: true,
                                        stats: stats
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;

