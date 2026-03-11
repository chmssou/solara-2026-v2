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
        // Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'client',
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

        // Lead Activity table (for lead history)
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id)
            )
        `, (err) => {
            if (err) console.error("Error creating lead_activity table:", err.message);
            else console.log("✅ Lead Activity table ready");
        });

        // Insert default admin user if not exists
        db.get("SELECT * FROM users WHERE email = ?", ['admin@solara2026.dz'], (err, row) => {
            if (!row) {
                db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", 
                    ['Admin User', 'admin@solara2026.dz', 'admin123', 'admin'], 
                    (err) => {
                        if (err) console.error("Error creating admin user:", err.message);
                        else console.log("✅ Default admin user created");
                    }
                );
            }
        });

        // Insert sample leads if empty
        db.get("SELECT COUNT(*) as count FROM leads", (err, row) => {
            if (row && row.count === 0) {
                const sampleLeads = [
                    ['أحمد محمد', 'ahmed@example.com', '0555123456', 'new', ''],
                    ['سارة علي', 'sara@example.com', '0555987654', 'contacted', ''],
                    ['محمد كريم', 'mohamed@example.com', '0555123457', 'qualified', '']
                ];
                const stmt = db.prepare("INSERT INTO leads (name, email, phone, status, notes) VALUES (?, ?, ?, ?, ?)");
                sampleLeads.forEach(lead => stmt.run(lead));
                stmt.finalize();
                console.log("✅ Sample leads created");
            }
        });

        // Insert sample quotes if empty
        db.get("SELECT COUNT(*) as count FROM quotes", (err, row) => {
            if (row && row.count === 0) {
                const sampleQuotes = [
                    ['أحمد محمد', 'منزل سكني', 6, 45000, 'pending'],
                    ['سارة علي', 'مزرعة', 20, 120000, 'approved'],
                    ['محمد كريم', 'متجر تجاري', 10, 75000, 'pending']
                ];
                const stmt = db.prepare("INSERT INTO quotes (clientName, projectName, systemSize, totalPrice, status) VALUES (?, ?, ?, ?, ?)");
                sampleQuotes.forEach(quote => stmt.run(quote));
                stmt.finalize();
                console.log("✅ Sample quotes created");
            }
        });
    });
}

module.exports = db;

