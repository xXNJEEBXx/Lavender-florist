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
export const getCsrfCookie = () => axios.get('/sanctum/csrf-cookie', { withCredentials: true });

export const authApi = {
  sendOtp: (data: { email: string }) => api.post('/auth/send-otp', data),
  verifyOtp: (data: { email: string, otp: string }) => api.post('/auth/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const adminProductsApi = {
  getAll: () => api.get('/admin/products').then(res => res.data),
  getById: (id: number) => api.get(`/admin/products/${id}`).then(res => res.data),
  create: (data: FormData) => api.post('/admin/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  update: (id: number, data: FormData) => {
    // Append _method=PUT to simulate a PUT request for FormData in Laravel
    data.append('_method', 'PUT');
    return api.post(`/admin/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  delete: (id: number) => api.delete(`/admin/products/${id}`).then(res => res.data),
};

export const adminComponentsApi = {
  getAll: () => api.get('/admin/components').then(res => res.data),
  create: (data: any) => api.post('/admin/components', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/admin/components/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/admin/components/${id}`).then(res => res.data),
};

export const publicProductsApi = {
  getAll: () => api.get('/products').then(res => res.data),
  getBySlug: (slug: string) => api.get(`/products/${slug}`).then(res => res.data),
};

export default api;
