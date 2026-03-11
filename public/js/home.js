/**
 * =====================================================
 * HOME.JS - Homepage Button Navigation
 * =====================================================
 * Controls navigation buttons on the homepage
 * No authentication logic - pure navigation only
 */

// Customer Portal button - goes to login page
document.getElementById("portalBtn").onclick = function() {
    window.location.href = "/login.html";
};

// Admin Panel button - goes to admin page
document.getElementById("adminBtn").onclick = function() {
    window.location.href = "/admin.html";
};

// Update navigation based on user role when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Update navigation to hide admin items for non-admins
    if (typeof Auth !== 'undefined' && Auth.updateNavigationForRole) {
        Auth.updateNavigationForRole();
    }
});
