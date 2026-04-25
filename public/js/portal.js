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
                hash = 'dashboard';
            }
        }

        // Update nav buttons
        updateNavButtons(hash);

        // Fetch data if needed
        if (hash === 'dashboard' || hash === 'requests') {
            fetchRequests();
        }
    }

    /**
     * Fetch service requests from API
     */
    async function fetchRequests() {
        const quotesContainer = document.getElementById('quotesContainer');
        if (!quotesContainer) return;

        // Show loading state if empty
        if (quotesContainer.innerHTML.trim() === '' || quotesContainer.querySelector('.loading')) {
            quotesContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> جاري تحميل طلباتك...</div>';
        }

        try {
            const authHeader = Auth.getAuthHeader();
            const response = await fetch('/api/requests', {
                headers: { 'Authorization': authHeader }
            });
            const data = await response.json();

            if (data.success && data.requests) {
                renderRequests(data.requests);
            } else {
                quotesContainer.innerHTML = '<div class="no-data">لا توجد طلبات حالياً</div>';
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            quotesContainer.innerHTML = '<div class="error">حدث خطأ في تحميل البيانات</div>';
        }
    }

    /**
     * Render requests list/table
     */
    function renderRequests(requests) {
        const quotesContainer = document.getElementById('quotesContainer');
        if (!quotesContainer) return;

        if (requests.length === 0) {
            quotesContainer.innerHTML = '<div class="no-data">لا توجد طلبات حالياً</div>';
            return;
        }

        let html = '<div class="table-responsive"><table><thead><tr><th>رقم الطلب</th><th>نوع الخدمة</th><th>الحالة</th><th>التاريخ</th><th>آخر تحديث</th></tr></thead><tbody>';
        
        requests.forEach(req => {
            const date = new Date(req.created_at).toLocaleDateString('ar-SA');
            const updateDate = new Date(req.updated_at || req.created_at).toLocaleDateString('ar-SA');
            const typeLabel = req.request_type === 'maintenance' ? 'صيانة' : 'تركيب';
            const statusClass = getStatusClass(req.status);
            const statusLabel = req.status_label || req.status;
            
            html += `
                <tr>
                    <td>#${req.id}</td>
                    <td>${typeLabel}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>${date}</td>
                    <td>${updateDate}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        quotesContainer.innerHTML = html;
    }

    /**
     * Helper to get CSS class for status
     */
    function getStatusClass(status) {
        if (status === 'completed' || status === 'closed' || status === 'resolved' || status === 'approved') return 'status-completed';
        if (status === 'new_request' || status === 'new') return 'status-pending';
        return 'status-pending'; // Default to pending for others
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

    // Export to global scope so HTML can call it
    window.loadSection = loadSection;

    // Listen for hash changes
    window.addEventListener('hashchange', loadSection);

    // Initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSection);
    } else {
        loadSection();
    }

})();

