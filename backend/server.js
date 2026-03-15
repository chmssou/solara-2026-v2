/**
 * =====================================================
 * SOLARA 2026 CRM SERVER - Complete Backend
 * =====================================================
 * Node.js + Express + SQLite
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database (this will auto-create tables)
const db = require('../database/db');

// Import routes
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const quotesRoutes = require('./routes/quotes');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');
const usersRoutes = require('./routes/users');
const clientRoutes = require('./routes/client');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================
// ROOT ROUTE - Serve index_final_v2.html
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index_final_v2.html'));
});

// ============================================
// API ROUTES
// ============================================

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/register', authRoutes); // Also handle /api/register

// Leads routes
app.use('/api/leads', leadsRoutes);

// Quotes routes
app.use('/api/quotes', quotesRoutes);

// Handle /api/quote POST separately (homepage form submission)
// Now saves to leads table instead of quotes
app.post('/api/quote', (req, res) => {
    const { name, clientName, projectType, projectName, systemSize, totalPrice, phone, comment, status } = req.body;
    const db = require('../database/db');
    
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

    // Save to leads table instead of quotes
    const sql = "INSERT INTO leads (name, phone, service_type, status) VALUES (?, ?, ?, ?)";
    db.run(sql, [finalClientName, phone || '', finalProjectName, 'new'], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create lead'
            });
        }

        res.status(201).json({
            success: true,
            message: 'تم استلام طلبك بنجاح! سنتواصل معك قريباً.',
            data: {
                id: this.lastID,
                name: finalClientName,
                service_type: finalProjectName
            }
        });
    });
});

// Admin routes
app.use('/api/admin', adminRoutes);

// Handle /api/stats directly
app.get('/api/stats', (req, res) => {
    const db = require('../database/db');
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
        if (!err && row) {
            stats.totalLeads = row.count;
            stats.totalInquiries = row.count;
        }
        
        // Get new messages (leads with status 'new')
        db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'new'", [], (err, row) => {
            if (!err && row) {
                stats.newMessages = row.count;
                stats.newLeads = row.count;
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
                        
                        // Calculate resolved messages
                        stats.resolvedMessages = stats.contactedLeads + stats.qualifiedLeads + stats.wonLeads;
                        
                        // Get monthly leads (last 6 months)
                        const monthlySql = `
                            SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count 
                            FROM leads 
                            WHERE created_at >= date('now', '-6 months')
                            GROUP BY strftime('%Y-%m', created_at)
                            ORDER BY month ASC
                        `;
                        db.all(monthlySql, [], (err, rows) => {
                            if (!err && rows) {
                                stats.monthlyLeads = rows;
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

// Feedback routes
app.use('/api/feedback', feedbackRoutes);

// User management routes (admin only)
app.use('/api/users', usersRoutes);

// Client routes (authenticated users)
app.use('/api/client', clientRoutes);

// ============================================
// CATCH-ALL FOR FRONTEND ROUTES
// ============================================
// Serve any other HTML files directly
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const htmlPages = ['login', 'register', 'admin', 'portal', 'dashboard', 'crm', 'leads', 'kanban', 'analytics', 'quote', 'profile', 'settings', 'lead-details', 'index', 'my-leads', 'my-quotes'];
    
    if (htmlPages.includes(page)) {
        const filePath = path.join(__dirname, '..', 'public', page + '.html');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    
    // Check for admin subdirectory
    if (page.startsWith('admin/')) {
        const filePath = path.join(__dirname, '..', 'public', page + '.html');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    
    // Legacy support
    if (page.startsWith('admin') || page.startsWith('portal')) {
        const filePath = path.join(__dirname, '..', 'public', page + '.html');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    
    // Fallback to index
    res.sendFile(path.join(__dirname, '..', 'public', 'index_final_v2.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('===============================================');
    console.log('SERVER STARTED');
    console.log('http://localhost:' + PORT);
    console.log('===============================================');
    console.log('');
    console.log('Registered routes:');
    console.log('  POST   /api/auth/login');
    console.log('  POST   /api/auth/register');
    console.log('  POST   /api/auth/signup');
    console.log('  POST   /api/auth/logout');
    console.log('  GET    /api/auth/user');
    console.log('  GET    /api/auth/me');
    console.log('  GET    /api/leads');
    console.log('  POST   /api/leads');
    console.log('  PUT    /api/leads/:id');
    console.log('  PUT    /api/leads/:id/status');
    console.log('  PUT    /api/leads/:id/notes');
    console.log('  PUT    /api/leads/:id/assign');
    console.log('  DELETE /api/leads/:id');
    console.log('  GET    /api/leads/export');
    console.log('  GET    /api/leads/count');
    console.log('  GET    /api/leads/:id');
    console.log('  GET    /api/leads/:id/activity');
    console.log('  GET    /api/quotes');
    console.log('  POST   /api/quotes');
    console.log('  GET    /api/quotes/:id');
    console.log('  DELETE /api/quotes/:id');
    console.log('  POST   /api/quote');
    console.log('  GET    /api/admin/stats');
    console.log('  GET    /api/admin/quotes');
    console.log('  GET    /api/stats');
    console.log('  POST   /api/feedback');
    console.log('===============================================');
    console.log('');
    console.log('Frontend: http://localhost:' + PORT);
    console.log('');
});

module.exports = app;

