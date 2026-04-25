/**
 * =====================================================
 * AUTH MODULE - Professional CRM Authentication
 * =====================================================
 * Features:
 * - JWT token management
 * - Role-based access control
 * - SweetAlert2 notifications
 * - Proper logout flow
 */

const Auth = (function() {
    'use strict';
    
    const TOKEN_KEY = 'solara_token';
    const USER_KEY = 'solara_user';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getUser() {
        var userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }

    function isLoggedIn() {
        return !!getToken() && !!getUser();
    }

    function getUserRole() {
        var user = getUser();
        return user ? user.role : null;
    }

    function isAdmin() {
        return getUserRole() === 'admin';
    }

    function isClient() {
        return getUserRole() === 'client';
    }

    function saveAuth(data) {
        if (data.token) {
            localStorage.setItem(TOKEN_KEY, data.token);
        }
        if (data.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        // Also store role for easy access
        if (data.user && data.user.role) {
            localStorage.setItem('role', data.user.role);
        }
    }

    function clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('role');
    }

    /**
     * Logout with SweetAlert2 success message
     * Shows success message first, then redirects to /login
     */
     function logout() {
         clearAuth();
        
        // Check if SweetAlert2 is available
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'تم تسجيل الخروج',
                text: 'تم تسجيل الخروج بنجاح',
                timer: 1500,
                showConfirmButton: false,
                 timerProgressBar: true,
                 didClose: function() {
                     window.location.href = '/login.html';
                 }
             });
         } else {
             // Fallback if SweetAlert2 not available
             window.location.href = '/login.html';
         }
     }

    /**
     * Show success message using SweetAlert2
     */
    function showSuccess(title, text) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: title,
                text: text,
                timer: 2000,
                showConfirmButton: false,
                timerProgressBar: true
            });
        } else {
            alert(title + '\n' + text);
        }
    }

    /**
     * Show error message using SweetAlert2
     */
    function showError(title, text) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: title,
                text: text
            });
        } else {
            alert(title + '\n' + text);
        }
    }

    /**
     * Show warning message using SweetAlert2
     */
    function showWarning(title, text) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: title,
                text: text
            });
        } else {
            alert(title + '\n' + text);
        }
    }

    /**
     * Check if user should be on this page
     * Returns false if not logged in
     */
    function requireAuth() {
        if (!isLoggedIn()) {
            return false;
        }
        return true;
    }

    /**
     * Check if user is admin
     * Returns false if not admin
     */
    function requireAdmin() {
        if (!requireAuth()) {
            return false;
        }
        if (!isAdmin()) {
            return false;
        }
        return true;
    }

    /**
     * Check if user is admin - returns boolean without redirect
     */
    function checkIsAdmin() {
        return isAdmin();
    }

    /**
     * Check if user is client
     */
    function checkIsClient() {
        return isClient();
    }

    /**
     * Update navigation based on user role
     * Hides admin-only items for non-admin users
     */
     function updateNavigationForRole() {
         var user = getUser();
         if (!user) return;
         
         // Hide admin dashboard link in sidebar for non-admins
         var adminLink = document.querySelector('.nav-link[href="/admin.html"]');
         if (adminLink && user.role !== 'admin') {
             adminLink.parentElement.style.display = 'none';
         }
        
        // Hide admin dashboard link in dropdown for non-admins
        var dropdownDashboardLink = document.querySelector('.user-dropdown a[href*="dashboard"]');
        if (dropdownDashboardLink && user.role !== 'admin') {
            dropdownDashboardLink.style.display = 'none';
        }
        
        // Hide divider before logout if dashboard was hidden
        var dropdownItems = document.querySelectorAll('.user-dropdown > *');
        if (user.role !== 'admin' && dropdownItems.length > 0) {
            for (var i = 0; i < dropdownItems.length; i++) {
                if (dropdownItems[i].classList.contains('divider') && 
                    (i === 0 || dropdownItems[i-1].style.display === 'none')) {
                    dropdownItems[i].style.display = 'none';
                }
            }
        }
    }

    /**
     * Redirect non-admin users away from admin pages
     * Call this on admin pages to redirect regular users
     * IMPORTANT: Use this BEFORE any page content loads to prevent showing admin UI briefly
     */
     function redirectNonAdmins() {
         if (!isLoggedIn()) {
             window.location.href = '/login.html';
             return true;
         }
         if (!isAdmin()) {
             // Redirect clients to their portal instead of showing admin UI
             // Use replace to prevent back button issues
             window.location.replace('/portal.html');
             return true;
         }
         return false;
     }

    /**
     * Check if user should access admin page and redirect if not
     * This method checks and redirects silently (no popup)
     */
     function checkAdminAccess() {
         if (!isLoggedIn()) {
             window.location.href = '/login.html';
             return false;
         }
         if (!isAdmin()) {
             window.location.replace('/portal.html');
             return false;
         }
         return true;
     }

    /**
     * Get Authorization header value
     */
    function getAuthHeader() {
        var token = getToken();
        return token ? 'Bearer ' + token : null;
    }

    return {
        getToken: getToken,
        getUser: getUser,
        isLoggedIn: isLoggedIn,
        getUserRole: getUserRole,
        isAdmin: isAdmin,
        isClient: isClient,
        saveAuth: saveAuth,
        clearAuth: clearAuth,
        logout: logout,
        requireAuth: requireAuth,
        requireAdmin: requireAdmin,
        checkIsAdmin: checkIsAdmin,
        checkIsClient: checkIsClient,
        updateNavigationForRole: updateNavigationForRole,
        redirectNonAdmins: redirectNonAdmins,
        checkAdminAccess: checkAdminAccess,
        getAuthHeader: getAuthHeader,
        showSuccess: showSuccess,
        showError: showError,
        showWarning: showWarning
    };
})();

// Show message function (legacy support)
function showMessage(text, type) {
    if (typeof Swal !== 'undefined') {
        if (type === 'success') {
            Swal.fire({
                icon: 'success',
                title: 'نجاح',
                text: text,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: text
            });
        }
    } else {
        // Fallback
        const box = document.getElementById("messageBox");
        if (!box) return;
        box.innerText = text;
        box.className = "message-box";
        
        if (type === "success") {
            box.classList.add("message-success");
        }
        
        if (type === "error") {
            box.classList.add("message-error");
        }
        
        box.style.display = "block";
        
        setTimeout(() => {
            box.style.display = "none";
        }, 3000);
    }
}

// Registration function
async function registerUser() {
    console.log("Registration function called");
    
    const nameEl = document.getElementById("name");
    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    
    console.log("Elements found:", !!nameEl, !!emailEl, !!passwordEl);
    
    if (!nameEl || !emailEl || !passwordEl) {
        console.error("Form elements not found");
        return;
    }
    
    const name = nameEl.value;
    const email = emailEl.value;
    const password = passwordEl.value;

    console.log("Registration attempt:", { name, email });

    if (!name || !email || !password) {
        console.error("Missing fields");
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'يرجى ملء جميع الحقول'
            });
        } else {
            showMessage("Please fill all fields", "error");
        }
        return;
    }

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();
        console.log("Registration response:", data);

        if (data.success) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'تم التسجيل',
                    text: 'تم إنشاء الحساب بنجاح! جاري التوجيه...',
                    timer: 2000,
                    showConfirmButton: false,
                    timerProgressBar: true,
                    didClose: function() {
                        window.location.href = "/";
                    }
                });
            } else {
                showMessage("Account created successfully", "success");
                 setTimeout(() => {
                     window.location.href = "/";
                 }, 1500);
             }
         } else {
             if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: data.message || 'فشل التسجيل'
                });
            } else {
                showMessage(data.message || "Registration failed", "error");
            }
        }
    } catch (error) {
        console.error("Registration error:", error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في الاتصال بالخادم'
            });
        } else {
            showMessage("Network error", "error");
        }
    }
}

