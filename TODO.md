# Render Deployment Fix TODO

## Steps to Complete:

- [x] 1. Update package.json: Add "engines" field, verify "start" script
- [x] 2. Update backend/routes/auth.js: Use process.env.JWT_SECRET 
- [x] 3. Create .gitignore (ignore node_modules, track database/)
- [ ] 4. Commit solar.db to git (despite ephemeral, for initial data)
- [ ] 5. Set JWT_SECRET in Render Environment Variables
- [ ] 6. Redeploy on Render and check logs
- [ ] 7. Test endpoints

Progress will be updated after each step.

