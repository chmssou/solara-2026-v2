/**
 * =====================================================
 * API CLIENT
 * =====================================================
 * Frontend JavaScript for API communication
 * 
 * Updated to use unified Auth module
 */

const API_BASE_URL = '/api';

// ============================================
// SUBMIT QUOTE
// ============================================
async function submitQuote(quoteData) {
    const submitBtn = document.getElementById('submitQuoteBtn');
    const originalText = submitBtn ? submitBtn.innerHTML : 'إرسال';
    
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
        }

        const response = await fetch(`${API_BASE_URL}/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quoteData)
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ ' + data.message);
            return { success: true, data };
        } else {
            alert('❌ ' + (data.message || 'حدث خطأ'));
            return { success: false, data };
        }

    } catch (error) {
        console.error('Quote submission error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
        return { success: false, error: error.message };
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// ============================================
// LOGIN USER
// ============================================
/**
 * Role-based redirect after login - FIX for Portal Hijack
 * @param {Object} user - The user object from the response
 */
function handleLoginRedirect(user) {
    // Role-based redirect: admin goes to /admin, clients go to /portal
    if (user.role === 'admin') {
        window.location.href = '/admin';
    } else {
        // Clients go to portal
        window.location.href = '/portal';
    }
}

async function loginUser(email, password) {
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('loginError');
    const originalText = loginBtn ? loginBtn.innerHTML : 'تسجيل الدخول';
    
    try {
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
        }
        
        if (errorMsg) errorMsg.style.display = 'none';

        // Use Auth module for login
        if (typeof Auth !== 'undefined') {
            const result = await Auth.login(email, password);
            
            if (result.success) {
                alert('✅ ' + (result.message || 'تم تسجيل الدخول بنجاح'));
                // Use role-based redirect to prevent Portal Hijack
                handleLoginRedirect(result.user);
                return { success: true, user: result.user };
            } else {
                if (errorMsg) {
                    errorMsg.textContent = result.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                    errorMsg.style.display = 'block';
                }
                return { success: false, data: result };
            }
        } else {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('solara_user', JSON.stringify(data.user));
                localStorage.setItem('solara_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('✅ ' + (data.message || 'تم تسجيل الدخول بنجاح'));
                // Use role-based redirect to prevent Portal Hijack
                handleLoginRedirect(data.user);
                return { success: true, user: data.user };
            } else {
                if (errorMsg) {
                    errorMsg.textContent = data.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                    errorMsg.style.display = 'block';
                }
                return { success: false, data };
            }
        }

    } catch (error) {
        console.error('Login error:', error);
        if (errorMsg) {
            errorMsg.textContent = 'حدث خطأ في الاتصال بالخادم';
            errorMsg.style.display = 'block';
        } else {
            alert('❌ حدث خطأ في الاتصال بالخادم');
        }
        return { success: false, error: error.message };
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
        }
    }
}

// ============================================
// SIGNUP USER
// ============================================
async function signupUser(userData) {
    const signupBtn = document.getElementById('signupBtn');
    const successMsg = document.getElementById('signupSuccess');
    const errorMsg = document.getElementById('signupError');
    const originalText = signupBtn ? signupBtn.innerHTML : 'إنشاء حساب';
    
    try {
        if (signupBtn) {
            signupBtn.disabled = true;
            signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';
        }
        
        if (successMsg) successMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';

        // Use Auth module for signup
        if (typeof Auth !== 'undefined') {
            const result = await Auth.signup(userData.full_name, userData.email, userData.password);
            
            if (result.success) {
                if (successMsg) {
                    successMsg.textContent = result.message || 'تم إنشاء حسابك بنجاح!';
                    successMsg.style.display = 'block';
                } else {
                    alert('✅ ' + (result.message || 'تم إنشاء حسابك بنجاح!'));
                }
                // Use role-based redirect after signup to prevent Portal Hijack
                setTimeout(() => {
                    handleLoginRedirect(result.user || { role: 'client' });
                }, 1000);
                return { success: true, data: result };
            } else {
                if (errorMsg) {
                    errorMsg.textContent = result.message || 'حدث خطأ';
                    errorMsg.style.display = 'block';
                } else {
                    alert('❌ ' + (result.message || 'حدث خطأ'));
                }
                return { success: false, data: result };
            }
        } else {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('solara_user', JSON.stringify(data.user));
                localStorage.setItem('solara_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                if (successMsg) {
                    successMsg.textContent = data.message || 'تم إنشاء حسابك بنجاح!';
                    successMsg.style.display = 'block';
                } else {
                    alert('✅ ' + (data.message || 'تم إنشاء حسابك بنجاح!'));
                }
                // Use role-based redirect after signup to prevent Portal Hijack
                setTimeout(() => {
                    handleLoginRedirect(data.user || { role: 'client' });
                }, 1000);
                return { success: true, data };
            } else {
                if (errorMsg) {
                    errorMsg.textContent = data.message || 'حدث خطأ';
                    errorMsg.style.display = 'block';
                } else {
                    alert('❌ ' + (data.message || 'حدث خطأ'));
                }
                return { success: false, data };
            }
        }

    } catch (error) {
        console.error('Signup error:', error);
        if (errorMsg) {
            errorMsg.textContent = 'حدث خطأ في الاتصال بالخادم';
            errorMsg.style.display = 'block';
        } else {
            alert('❌ حدث خطأ في الاتصال بالخادم');
        }
        return { success: false, error: error.message };
    } finally {
        if (signupBtn) {
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalText;
        }
    }
}

// ============================================
// GET ALL QUOTES (Admin)
// ============================================
async function getAllQuotes() {
    try {
        const token = localStorage.getItem('solara_token');
        const response = await fetch(`${API_BASE_URL}/quotes`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        
        if (data.success) {
            return { success: true, quotes: data.quotes };
        } else {
            alert('❌ ' + (data.message || 'حدث خطأ'));
            return { success: false, data };
        }
    } catch (error) {
        console.error('Get quotes error:', error);
        alert('❌ حدث خطأ في جلب البيانات');
        return { success: false, error: error.message };
    }
}

// ============================================
// EXPORT FOR COMMONJS
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        submitQuote,
        loginUser,
        signupUser,
        getAllQuotes
    };
}
</parameter>
</create_file>
