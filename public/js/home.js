/**
 * =====================================================
 * HOME.JS - Homepage Button Navigation
 * =====================================================
 * Controls navigation buttons on the homepage
 * No authentication logic - pure navigation only
 */

document.addEventListener('DOMContentLoaded', function() {
    // Customer Portal button - goes to login page (if present on the page)
    var portalBtn = document.getElementById('portalBtn');
    if (portalBtn) {
        portalBtn.onclick = function() {
            window.location.href = '/login.html';
        };
    }

    // Admin Panel button - goes to admin redirect page (if present on the page)
    var adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.onclick = function() {
            window.location.href = '/admin.html';
        };
    }

    // Update navigation based on user role when page loads (if Auth is loaded)
    if (typeof Auth !== 'undefined' && Auth.updateNavigationForRole) {
        Auth.updateNavigationForRole();
    }
});
