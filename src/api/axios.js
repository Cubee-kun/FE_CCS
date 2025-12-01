import axios from 'axios';

// Gunakan environment variable dari Vite
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000, // ✅ INCREASED: 30 second timeout (from 10s default)
});

// Interceptor untuk menambahkan token JWT sebelum request dikirim
api.interceptors.request.use(
  (config) => {
    const token = localStorage?.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor untuk menangani error response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data, config, statusText } = error.response;
      
      // ✅ Suppress 404 errors completely (expected fallback behavior)
      if (status === 404) {
        return Promise.reject(error);
      }

      // ✅ Only log actual errors (non-404)
      console.error(`[API Error ${status}] ${config.method?.toUpperCase()} ${config.url}`, {
        status,
        statusText,
        message: data?.error || data?.message || statusText,
      });

      // Handle 401 Unauthorized
      if (status === 401) {
        const isLoginPage = window.location.pathname === '/login' || 
                           window.location.pathname === '/register' ||
                           window.location.pathname === '/';
        
        if (!isLoginPage && localStorage.getItem('token')) {
          console.warn('[API] Token invalid (401) - clearing auth');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.replace('/login');
        }
      }
    } else if (error.request) {
      console.error('[API Error] No response:', {
        message: error.message,
        url: error.config?.url,
      });
    } else {
      console.error('[API Error]', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ✅ Add response interceptor for timeout handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('[Axios] Request timeout detected');
      // Optionally add global retry logic here
    }
    return Promise.reject(error);
  }
);

export default api;
