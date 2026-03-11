# CRM Backend Fix Plan

## Issues Identified

1. **Duplicate /register route** in `backend/routes/auth.js` - defined twice
2. **Admin password plain text** - needs bcrypt hashing
3. **Confusing in-memory db** at `backend/database/db.js`
4. **Duplicate/misleading files** that should be cleaned up

## Fix Steps

### Step 1: Fix admin password (hash it)
- Update database to hash admin password
- Ensure bcrypt compatibility

### Step 2: Remove duplicate /register route
- Clean up auth.js - remove duplicate route definition
- Keep only one clean implementation

### Step 3: Clean up duplicate/confusing files
- Remove or mark `backend/database/db.js` as unused
- Remove other duplicate route files if exist

### Step 4: Test the complete flow
- Start server
- Register new user
- Login with new user
- Verify JWT token works

## Status: [IN PROGRESS]

