import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api', // Vite proxy handles routing this to localhost:8000
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Sanctum token if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Basic API methods for Products
export const fetchProducts = () => api.get('/products').then(res => res.data);
export const fetchProductBySlug = (slug: string) => api.get(`/products/${slug}`).then(res => res.data);

// Basic Auth
export const getCsrfCookie = () => api.get('/sanctum/csrf-cookie');

export const authApi = {
  sendOtp: (data: { email: string }) => api.post('/auth/send-otp', data),
  verifyOtp: (data: { email: string, otp: string }) => api.post('/auth/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export default api;
