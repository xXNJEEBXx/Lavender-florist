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

export const adminActivityLogsApi = {
  getAll: () => api.get('/admin/activity-logs').then(res => res.data),
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
  create: (data: any) => api.post('/admin/components', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined).then(res => res.data),
  update: (id: number, data: any) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/admin/components/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data);
    }
    return api.put(`/admin/components/${id}`, data).then(res => res.data);
  },
  delete: (id: number) => api.delete(`/admin/components/${id}`).then(res => res.data),
};

export const storeApi = {
  getQueueStatus: async (prepMinutes: number = 0, deliveryType: string = 'pickup', deliverySpeed: string = 'standard') => {
    const { data } = await api.get('/store/queue-status', {
      params: { prep_minutes: prepMinutes, delivery_type: deliveryType, delivery_speed: deliverySpeed }
    });
    return data;
  },
  getAvailableSlots: async (prepMinutes: number, deliveryType: string, deliverySpeed: string) => {
    const { data } = await api.get('/store/available-slots', {
      params: { prep_minutes: prepMinutes, delivery_type: deliveryType, delivery_speed: deliverySpeed }
    });
    return data;
  }
};

export const publicProductsApi = {
  getAll: (category?: string) => api.get('/products' + (category ? `?category=${category}` : '')).then(res => res.data),
  getBySlug: (slug: string) => api.get(`/products/${slug}`).then(res => res.data),
  checkout: (data: any) => api.post('/checkout', data).then(res => res.data),
};

export const adminOrdersApi = {
  getAll: (status: string = 'all', page: number = 1) => api.get(`/admin/orders?status=${status}&page=${page}`).then(res => res.data),
  getById: (id: number) => api.get(`/admin/orders/${id}`).then(res => res.data),
  verifyPayment: async (id: number) => {
    const { data } = await api.post(`/admin/orders/${id}/verify-payment`);
    return data;
  },
  updateFull: async (id: number, orderData: any) => {
    const { data } = await api.put(`/admin/orders/${id}/full`, orderData);
    return data;
  },
  updateStatus: async (id: number, status: string) => {
    const { data } = await api.put(`/admin/orders/${id}`, { status });
    return data;
  },
  sendToDelivery: async (id: number, skipPrimary: boolean = false) => {
    const { data } = await api.post(`/admin/orders/${id}/send-to-delivery`, { skip_primary: skipPrimary });
    return data;
  }
};

export const adminSettingsApi = {
  getWorkingHours: async () => {
    const { data } = await api.get('/admin/working-hours');
    return data;
  },
  saveWorkingHours: async (payload: any) => {
    const { data } = await api.post('/admin/working-hours', payload);
    return data;
  },
  deleteWorkingHours: async (id: number) => {
    const { data } = await api.delete(`/admin/working-hours/${id}`);
    return data;
  },
  
  getBreaks: async () => {
    const { data } = await api.get('/admin/breaks');
    return data;
  },
  saveBreak: async (payload: any) => {
    const { data } = await api.post('/admin/breaks', payload);
    return data;
  },
  deleteBreak: async (id: number) => {
    const { data } = await api.delete(`/admin/breaks/${id}`);
    return data;
  }
};

export const orderApi = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  getOrderByNumber: async (orderNumber: string) => {
    const response = await api.get(`/orders/${orderNumber}`);
    return response.data;
  },
  uploadReceipt: async (orderNumber: string, file: File | null, paymentJustification?: string) => {
    const formData = new FormData();
    if (file) formData.append('receipt', file);
    if (paymentJustification) formData.append('payment_justification', paymentJustification);
    
    const response = await api.post(`/orders/${orderNumber}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export const customerApi = {
  getAddresses: () => api.get('/addresses').then(res => res.data),
  addAddress: (data: any) => {
    if (data instanceof FormData) {
      return api.post('/addresses', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data);
    }
    return api.post('/addresses', data).then(res => res.data);
  },
  updateAddress: (id: number, data: any) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/addresses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data);
    }
    return api.put(`/addresses/${id}`, data).then(res => res.data);
  },
  deleteAddress: (id: number) => api.delete(`/addresses/${id}`).then(res => res.data),
};

export default api;
