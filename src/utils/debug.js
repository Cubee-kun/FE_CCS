// ✅ Utility untuk clear auth state (panggil di console browser)
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('✅ Auth cleared. Reload page to see Navbar.');
  window.location.reload();
};

// ✅ Utility untuk cek auth state
export const checkAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('=== AUTH STATE ===');
  console.log('Token:', token ? '✅ exists' : '❌ null');
  console.log('User:', user ? JSON.parse(user) : '❌ null');
  
  if (token) {
    try {
      // Dynamic import jwt-decode
      import('jwt-decode').then(({ jwtDecode }) => {
        const decoded = jwtDecode(token);
        console.log('Decoded:', decoded);
        console.log('Expired?', Date.now() >= decoded.exp * 1000 ? '❌ YES' : '✅ NO');
        console.log('Expires at:', new Date(decoded.exp * 1000).toLocaleString());
      });
    } catch (e) {
      console.log('Error decoding:', e.message);
    }
  }
  
  return { token, user: user ? JSON.parse(user) : null };
};

// ✅ Force logout
export const forceLogout = () => {
  clearAuth();
};

// ✅ Expose ke window untuk testing di console
if (typeof window !== 'undefined') {
  window.clearAuth = clearAuth;
  window.checkAuth = checkAuth;
  window.forceLogout = forceLogout;
  console.log('🔧 Debug utils loaded. Available commands:');
  console.log('  - window.checkAuth() - Check current auth state');
  console.log('  - window.clearAuth() - Clear auth and reload');
  console.log('  - window.forceLogout() - Force logout');
}
