import axios from 'axios';

// Gunakan environment variable dari Vite
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Interceptor untuk menambahkan token JWT sebelum request dikirim
api.interceptors.request.use(
  (config) => {
    const token = localStorage?.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log request untuk debugging
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor untuk menangani error response
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data, config } = error.response;
      console.error(`[API Error ${status}] ${config.method?.toUpperCase()} ${config.url}`, data);
      
      // ✅ Handle device conflict (409)
      if (status === 409 && data?.code === 'DEVICE_CONFLICT') {
        console.warn('[API] Device conflict detected - account already logged in elsewhere');
        // Don't auto-redirect, let the login page handle it
        return Promise.reject(error);
      }
      
      if (status === 405) {
        console.error('Method Not Allowed. Check if backend endpoint supports this HTTP method.');
      }
      
      if (status === 401) {
        // ✅ Only clear auth if not device conflict
        if (data?.code !== 'DEVICE_CONFLICT') {
          console.warn('[API] Unauthorized (401) - clearing token and user data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // ✅ Prevent redirect loop - only redirect if not already on login page
          const isLoginPage = window.location.pathname === '/login' || 
                             window.location.pathname === '/register' ||
                             window.location.pathname === '/';
          
          if (!isLoginPage) {
            console.log('[API] Redirecting to login page...');
            // Use replace to prevent back button issues
            window.location.replace('/login');
          }
        }
      }
    } else if (error.request) {
      console.error('[API Error] No response received', error.request);
    } else {
      console.error('[API Error]', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
