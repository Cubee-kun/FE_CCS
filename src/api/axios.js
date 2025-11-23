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
    
    // ✅ Enhanced logging untuk debug login
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      url: `${config.baseURL}${config.url}`,
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data ? JSON.parse(JSON.stringify(config.data)) : null,
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor untuk menangani error response
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data, config, statusText } = error.response;
      
      // ✅ Enhanced 401 debugging
      console.error(`[API Error ${status}] ${config.method?.toUpperCase()} ${config.url}`, {
        status,
        statusText,
        response: data,
        requestData: config.data ? JSON.parse(config.data) : null,
        errorMessage: data?.error || data?.message || statusText,
      });

      // Handle 401 Unauthorized
      if (status === 401) {
        const isLoginPage = window.location.pathname === '/login' || 
                           window.location.pathname === '/register' ||
                           window.location.pathname === '/';
        
        // ✅ Hanya logout jika bukan login page dan ada token
        if (!isLoginPage && localStorage.getItem('token')) {
          console.warn('[API] Token invalid (401) - clearing auth');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.replace('/login');
        }
      }
      
      if (status === 405) {
        console.error('[API] Method Not Allowed (405) - endpoint may not exist');
      }
    } else if (error.request) {
      console.error('[API Error] No response:', {
        request: error.request,
        message: error.message,
        url: error.config?.url,
      });
    } else {
      console.error('[API Error]', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
