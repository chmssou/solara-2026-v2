# Admin Dashboard Access Control Fix Plan

## Task Summary
- Hide admin dashboard button from normal users
- Remove admin links from user dropdown for non-admins
- Redirect non-admins to home instead of showing "Access Denied" popup

## Current Issues Found

### 1. Admin Pages Show Error Popup Instead of Redirect
- `public/admin/admin-dashboard.html` - Shows SweetAlert and redirects to same page (wrong!)
- `public/admin/admin-users.html` - Shows SweetAlert and redirects to admin-dashboard
- `public/admin/admin-leads.html` - Shows SweetAlert and redirects to admin-dashboard

### 2. Navigation Shows Admin Links for All Users
- `public/crm.html` - Shows sidebar with admin links
- `public/kanban.html` - Shows sidebar with admin link
- `public/analytics.html` - Shows sidebar with admin link
- `public/settings.html` - Shows sidebar with admin link
- `public/client-*.html` - Incorrectly links to admin dashboard
- `public/index_final_v2.html` - User dropdown shows admin links

## Implementation Plan

### Step 1: Update Auth Module (public/js/auth.js)
- Fix `redirectNonAdmins()` to silently redirect to "/"
- Improve `updateNavigationForRole()` to properly hide admin elements

### Step 2: Fix Admin HTML Pages
- Fix `public/admin/admin-dashboard.html` - Use redirect instead of popup
- Fix `public/admin/admin-users.html` - Use redirect instead of popup  
- Fix `public/admin/admin-leads.html` - Use redirect instead of popup

### Step 3: Fix Navigation in CRM/Admin Pages
- Fix `public/crm.html` - Add role check to hide admin nav
- Fix `public/kanban.html` - Add role check to hide admin nav
- Fix `public/analytics.html` - Add role check to hide admin nav
- Fix `public/settings.html` - Add role check to hide admin nav

### Step 4: Fix Client Pages
- Fix `public/client-dashboard.html`
- Fix `public/client-leads.html`
- Fix `public/client-quotes.html`
- Fix `public/client-profile.html`
- Fix `public/client-settings.html`

### Step 5: Fix Landing Page Dropdown
- Fix `public/index_final_v2.html` - Hide admin links from user dropdown for non-admins

