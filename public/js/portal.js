/**
 * =====================================================
 * PORTAL MODULE - Clean Hash Router
 * =====================================================
 */

(function() {
    'use strict';

    // Only run if portal container exists
    if (!document.getElementById('portal')) {
        return;
    }

    /**
     * Load section based on URL hash
     */
    function loadSection() {
        var hash = window.location.hash.replace('#', '') || 'dashboard';
        
        // Hide all sections
        var sections = document.querySelectorAll('.section');
        for (var i = 0; i < sections.length; i++) {
            if (sections[i]) {
                sections[i].style.display = 'none';
            }
        }

        // Show active section
        var activeSection = document.getElementById(hash);
        if (activeSection) {
            activeSection.style.display = 'block';
        } else {
            // Default to dashboard
            var defaultSection = document.getElementById('dashboard');
            if (defaultSection) {
                defaultSection.style.display = 'block';
            }
        }

        // Update nav buttons
        updateNavButtons(hash);
    }

    /**
     * Update active state on nav buttons
     */
    function updateNavButtons(currentHash) {
        var navBtns = document.querySelectorAll('.nav-btn');
        for (var i = 0; i < navBtns.length; i++) {
            navBtns[i].classList.remove('active');
        }
        
        var activeBtn = document.querySelector('.nav-btn[href="#' + currentHash + '"]');
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', loadSection);

    // Initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSection);
    } else {
        loadSection();
    }

})();

