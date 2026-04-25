/**
 * =====================================================
 * SOLARA 2026 CRM SERVER - Complete Backend
 * =====================================================
 * Node.js + Express + SQLite
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs   = require('fs');

// Initialize database (auto-creates & migrates tables)
const db = require('../database/db');

// Import routes
const authRoutes      = require('./routes/auth');
const leadsRoutes     = require('./routes/leads');
const quotesRoutes    = require('./routes/quotes');
const adminRoutes     = require('./routes/admin');
const feedbackRoutes  = require('./routes/feedback');
const usersRoutes     = require('./routes/users');
const clientRoutes    = require('./routes/client');
const requestsRoutes  = require('./routes/requests');     // Service workflow


const app = express();
const PORT = 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Avoid noisy browser console errors for missing favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ============================================
// ROOT ROUTE - Serve index_final_v2.html
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index_final_v2.html'));
});

// ============================================
// API ROUTES
// ============================================

// Auth routes (email/password + social OAuth merged into auth.js)
app.use('/api/auth', authRoutes);
app.use('/api/register', authRoutes);     // Legacy alias

// Service workflow routes (NEW)
app.use('/api/requests', requestsRoutes);

// Leads routes (existing – unchanged)
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

// Public Config route for safe frontend variables
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        data: {
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || null
        }
    });
});

// ============================================
// CANONICAL HTML ROUTES (.html ONLY)
// ============================================
// Frontend must use .html everywhere. These redirects prevent mixed routing.
app.get('/login', (req, res) => res.redirect(302, '/login.html'));
app.get('/register', (req, res) => res.redirect(302, '/register.html'));
app.get('/portal', (req, res) => res.redirect(302, '/portal.html'));
app.get('/client-profile', (req, res) => res.redirect(302, '/client-profile.html'));
app.get('/settings', (req, res) => res.redirect(302, '/settings.html'));
app.get('/admin', (req, res) => res.redirect(302, '/admin.html'));

/*
// ============================================
// CATCH-ALL FOR FRONTEND ROUTES (DISABLED)
// ============================================
app.get('/:page', (req, res) => {
    const page = req.params.page;

    // Never catch API paths
    if (page.startsWith('api')) {
        return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Single source of truth — only serve pages that actually exist
    const htmlPages = [
        'login', 'register', 'portal',
        'client-profile', 'settings', 'index'
    ];

    if (htmlPages.includes(page)) {
        const filePath = path.join(__dirname, '..', 'public', page + '.html');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }

    // Serve admin sub-pages (e.g. /admin/admin-dashboard.html)
    if (page.startsWith('admin/')) {
        const filePath = path.join(__dirname, '..', 'public', page + '.html');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }

    // Unknown routes → 404, do NOT silently redirect to homepage
    res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index_final_v2.html'));
});
*/

// ============================================
// 404 (NO HOMEPAGE FALLBACK)
// ============================================
app.use((req, res) => {
    // Never mask unknown API routes
    if ((req.originalUrl || req.url).startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'Not found' });
    }
    return res.status(404).send('Not found');
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
    console.log('Core auth routes:');
    console.log('  POST   /api/auth/login');
    console.log('  POST   /api/auth/register');
    console.log('  POST   /api/auth/google        (Social OAuth)');
    console.log('  POST   /api/auth/facebook      (Social OAuth)');
    console.log('  GET    /api/auth/me');
    console.log('');
    console.log('Service Workflow routes (NEW):');
    console.log('  GET    /api/requests           (list, filter by type/status)');
    console.log('  POST   /api/requests           (create request)');
    console.log('  GET    /api/requests/stats     (dashboard counts)');
    console.log('  GET    /api/requests/:id       (single request + timeline)');
    console.log('  PUT    /api/requests/:id/status  (admin: advance lifecycle)');
    console.log('  PUT    /api/requests/:id/assign  (admin: assign technician)');
    console.log('  PUT    /api/requests/:id/notes   (admin: internal notes)');
    console.log('  DELETE /api/requests/:id       (admin: delete)');
    console.log('');
    console.log('Legacy leads/quotes routes (unchanged):');
    console.log('  GET/POST/PUT/DELETE /api/leads');
    console.log('  GET/POST/PUT/DELETE /api/quotes');
    console.log('  GET    /api/stats');
    console.log('===============================================');
    console.log('');
    console.log('Frontend: http://localhost:' + PORT);
    console.log('');
});

module.exports = app;

