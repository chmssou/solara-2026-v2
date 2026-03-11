// Test script to verify auth works
const db = require('./database/db');

console.log("Testing database connection...");

setTimeout(() => {
    db.all('SELECT id, name, email, role FROM users', [], (err, rows) => {
        if (err) {
            console.error("Error:", err.message);
        } else {
            console.log("Users in database:", JSON.stringify(rows, null, 2));
        }
        
        // Test bcrypt
        const bcrypt = require('bcrypt');
        const testPassword = 'test123';
        
        bcrypt.hash(testPassword, 10, (err, hash) => {
            if (err) {
                console.error("Bcrypt hash error:", err.message);
            } else {
                console.log("Password hashed successfully:", hash.substring(0, 20) + "...");
                
                bcrypt.compare(testPassword, hash, (err, result) => {
                    if (err) {
                        console.error("Bcrypt compare error:", err.message);
                    } else {
                        console.log("Bcrypt compare result:", result);
                    }
                    process.exit();
                });
            }
        });
    });
}, 1000);


