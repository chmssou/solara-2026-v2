// Test script to verify database and server
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database", "solar.db");

console.log("Testing database connection...");
console.log("Database path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
        process.exit(1);
    }
    console.log("✅ Database connected successfully!");
    
    // Test query
    db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
        if (err) {
            console.error("Query error:", err.message);
            process.exit(1);
        }
        console.log("✅ Query successful! User count:", row.count);
        
        // Test leads table
        db.get("SELECT COUNT(*) as count FROM leads", [], (err, row) => {
            if (err) {
                console.error("Query error:", err.message);
                process.exit(1);
            }
            console.log("✅ Leads query successful! Lead count:", row.count);
            
            // Test quotes table
            db.get("SELECT COUNT(*) as count FROM quotes", [], (err, row) => {
                if (err) {
                    console.error("Query error:", err.message);
                    process.exit(1);
                }
                console.log("✅ Quotes query successful! Quote count:", row.count);
                
                db.close((err) => {
                    if (err) {
                        console.error("Close error:", err.message);
                    }
                    console.log("✅ All tests passed!");
                    process.exit(0);
                });
            });
        });
    });
});

