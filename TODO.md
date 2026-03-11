# Backend Rebuild TODO

## Step 1: Delete Old Backend Files
- [ ] Delete root server.js
- [ ] Delete root routes/ folder
- [ ] Delete root controllers/ folder
- [ ] Delete root middleware/ folder (if exists)
- [ ] Delete database/ folder contents (solar.db reference)

## Step 2: Create Database Module
- [ ] Create database/ folder
- [ ] Create database/db.js with SQLite connection and auto-table creation
- [ ] Tables: users, leads, quotes, feedback, lead_activity

## Step 3: Create Routes
- [ ] backend/routes/auth.js - All auth endpoints
- [ ] backend/routes/leads.js - All leads endpoints
- [ ] backend/routes/quotes.js - All quotes endpoints  
- [ ] backend/routes/admin.js - Admin stats endpoints
- [ ] backend/routes/feedback.js - Feedback endpoint

## Step 4: Create Controllers
- [ ] backend/controllers/authController.js
- [ ] backend/controllers/leadsController.js
- [ ] backend/controllers/quotesController.js
- [ ] backend/controllers/adminController.js
- [ ] backend/controllers/feedbackController.js

## Step 5: Update Server
- [ ] Update backend/server.js with all routes
- [ ] Add console.log for registered routes

## Step 6: Test
- [ ] Test server starts without errors
- [ ] Test login endpoint
- [ ] Test register endpoint
- [ ] Test quote submission
- [ ] Test leads creation

## Completion
- [ ] All frontend APIs work without modification

