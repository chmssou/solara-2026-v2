/**
 * =====================================================
 * DATABASE MODULE - SQLite with Auto Table Creation
 * =====================================================
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "..", "database");
const dbPath = path.join(dbDir, "solar.db");

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("✅ Connected to SQLite database:", dbPath);
        initTables();
    }
});

// Initialize all tables
function initTables() {
    db.serialize(() => {

        // ── Core existing tables ────────────────────────────────────────────

        // Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL DEFAULT '',
                role TEXT DEFAULT 'client',
                provider TEXT DEFAULT 'local',
                provider_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Error creating users table:", err.message);
            else console.log("✅ Users table ready");
        });

        // Leads table
        db.run(`
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                status TEXT DEFAULT 'new',
                notes TEXT,
                assigned_to INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error("Error creating leads table:", err.message);
            else console.log("✅ Leads table ready");
        });

        // Quotes table
        db.run(`
            CREATE TABLE IF NOT EXISTS quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clientName TEXT NOT NULL,
                projectName TEXT NOT NULL,
                systemSize REAL NOT NULL,
                totalPrice REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error("Error creating quotes table:", err.message);
            else console.log("✅ Quotes table ready");
        });

        // Feedback table
        db.run(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                projectType TEXT,
                phone TEXT,
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Error creating feedback table:", err.message);
            else console.log("✅ Feedback table ready");
        });

        // Lead Activity table (legacy history)
        db.run(`
            CREATE TABLE IF NOT EXISTS lead_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                status TEXT DEFAULT 'new',
                notes TEXT,
                activity_type TEXT DEFAULT 'created',
                changed_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id),
                FOREIGN KEY (changed_by) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error("Error creating lead_activity table:", err.message);
            else console.log("✅ Lead Activity table ready");
        });

        // ── New workflow tables ─────────────────────────────────────────────

        // Service Requests – unified installation & maintenance intake
        db.run(`
            CREATE TABLE IF NOT EXISTS service_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_type TEXT NOT NULL DEFAULT 'installation',
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                address TEXT,
                description TEXT,
                status TEXT NOT NULL DEFAULT 'new_request',
                internal_notes TEXT,
                assigned_to INTEGER,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES users(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error("Error creating service_requests table:", err.message);
            else console.log("✅ Service Requests table ready");
        });

        // Status History – immutable audit trail per request
        db.run(`
            CREATE TABLE IF NOT EXISTS status_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER NOT NULL,
                from_status TEXT,
                to_status TEXT NOT NULL,
                changed_by INTEGER,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES service_requests(id),
                FOREIGN KEY (changed_by) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error("Error creating status_history table:", err.message);
            else console.log("✅ Status History table ready");
        });

        // ── Schema migrations (safe ALTER TABLE – ignored if column exists) ─
        const alterStatements = [
            // Add workflow columns to existing leads table
            "ALTER TABLE leads ADD COLUMN request_type TEXT DEFAULT 'installation'",
            "ALTER TABLE leads ADD COLUMN internal_notes TEXT DEFAULT ''",
            "ALTER TABLE leads ADD COLUMN service_type TEXT DEFAULT ''",
            // Add social-login columns to users table
            "ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local'",
            "ALTER TABLE users ADD COLUMN provider_id TEXT",
            // Add changed_by to lead_activity
            "ALTER TABLE lead_activity ADD COLUMN changed_by INTEGER"
        ];
        alterStatements.forEach(sql => {
            db.run(sql, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    // Only log genuinely unexpected errors
                    if (!err.message.includes('already exists')) {
                        console.warn("Migration note:", err.message);
                    }
                }
            });
        });

        // ── Seed data ───────────────────────────────────────────────────────

        // Default admin user
        db.get("SELECT * FROM users WHERE email = ?", ['admin@solara2026.dz'], async (err, row) => {
            if (!row) {
                const bcrypt = require('bcrypt');
                let hashedPassword = 'admin123';
                try {
                    hashedPassword = await bcrypt.hash('admin123', 10);
                } catch (e) {
                    console.error("Error hashing admin password:", e.message);
                }
                db.run(
                    "INSERT INTO users (name, email, password, role, provider) VALUES (?, ?, ?, ?, ?)",
                    ['Admin User', 'admin@solara2026.dz', hashedPassword, 'admin', 'local'],
                    (err) => {
                        if (err) console.error("Error creating admin user:", err.message);
                        else console.log("✅ Default admin user created");
                    }
                );
            }
        });

        // Sample leads
        db.get("SELECT COUNT(*) as count FROM leads", (err, row) => {
            if (row && row.count === 0) {
                const sampleLeads = [
                    ['أحمد محمد', 'ahmed@example.com', '0555123456', 'new_request', '', 'installation'],
                    ['سارة علي',  'sara@example.com',  '0555987654', 'under_review', '', 'installation'],
                    ['محمد كريم', 'mohamed@example.com','0555123457', 'new_request', '', 'maintenance']
                ];
                const stmt = db.prepare(
                    "INSERT INTO leads (name, email, phone, status, notes, request_type) VALUES (?, ?, ?, ?, ?, ?)"
                );
                sampleLeads.forEach(l => stmt.run(l));
                stmt.finalize();
                console.log("✅ Sample leads created");
            }
        });

        // Sample quotes
        db.get("SELECT COUNT(*) as count FROM quotes", (err, row) => {
            if (row && row.count === 0) {
                const sampleQuotes = [
                    ['أحمد محمد', 'منزل سكني', 6, 45000, 'pending'],
                    ['سارة علي',  'مزرعة',     20, 120000, 'approved'],
                    ['محمد كريم', 'متجر تجاري',10, 75000, 'pending']
                ];
                const stmt = db.prepare(
                    "INSERT INTO quotes (clientName, projectName, systemSize, totalPrice, status) VALUES (?, ?, ?, ?, ?)"
                );
                sampleQuotes.forEach(q => stmt.run(q));
                stmt.finalize();
                console.log("✅ Sample quotes created");
            }
        });
    });
}

module.exports = db;

