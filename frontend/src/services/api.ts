import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/api/auth/register', userData),
  
  logout: () =>
    api.post('/api/auth/logout'),
  
  getProfile: () =>
    api.get('/api/auth/profile'),
  
  updateProfile: (userData: any) =>
    api.put('/api/auth/profile', userData),
};

// Catalog API
export const catalogApi = {
  getProducts: (params?: any) =>
    api.get('/api/catalog', { params }),
  
  getProduct: (id: string) =>
    api.get(`/api/catalog/${id}`),
  
  searchProducts: (query: string, filters?: any) =>
    api.get('/api/bff/search', { params: { q: query, ...filters } }),
};

// Cart API
export const cartApi = {
  getCart: () =>
    api.get('/api/cart'),
  
  addItem: (productId: string, quantity: number) =>
    api.post('/api/cart/items', { product_id: productId, quantity }),
  
  updateItem: (itemId: string, quantity: number) =>
    api.put(`/api/cart/items/${itemId}`, { quantity }),
  
  removeItem: (itemId: string) =>
    api.delete(`/api/cart/items/${itemId}`),
  
  clearCart: () =>
    api.delete('/api/cart'),
  
  getItemCount: () =>
    api.get('/api/cart/count'),
};

// Order API
export const orderApi = {
  getOrders: () =>
    api.get('/api/orders'),
  
  getOrder: (id: string) =>
    api.get(`/api/orders/${id}`),
  
  createOrder: (orderData: any) =>
    api.post('/api/orders', orderData),
  
  cancelOrder: (id: string, reason?: string) =>
    api.put(`/api/orders/${id}/cancel`, { reason }),
};

// Inventory API
export const inventoryApi = {
  getInventory: () =>
    api.get('/api/inventory'),
  
  getProductInventory: (productId: string) =>
    api.get(`/api/inventory/${productId}`),
  
  getStockStatus: (productId: string) =>
    api.get(`/api/inventory/${productId}/status`),
};

// Payment API
export const paymentApi = {
  processPayment: (paymentData: any) =>
    api.post('/api/payment/process', paymentData),
  
  getPaymentStatus: (paymentId: string) =>
    api.get(`/api/payment/status/${paymentId}`),
  
  refundPayment: (paymentId: string, amount?: number, reason?: string) =>
    api.post('/api/payment/refund', { paymentId, amount, reason }),
};

// Notification API
export const notificationApi = {
  getNotifications: (params?: any) =>
    api.get('/api/notifications', { params }),
  
  getNotification: (id: string) =>
    api.get(`/api/notifications/${id}`),
  
  markAsRead: (id: string) =>
    api.put(`/api/notifications/${id}`, { status: 'read' }),
  
  deleteNotification: (id: string) =>
    api.delete(`/api/notifications/${id}`),
};

// BFF API
export const bffApi = {
  getDashboard: () =>
    api.get('/api/bff/dashboard'),
  
  getProductDetails: (productId: string) =>
    api.get(`/api/bff/products/${productId}/details`),
  
  createOrder: (orderData: any) =>
    api.post('/api/bff/orders', orderData),
  
  checkoutCart: (checkoutData: any) =>
    api.post('/api/bff/cart/checkout', checkoutData),
  
  getProfile: () =>
    api.get('/api/bff/profile'),
  
  getHealth: () =>
    api.get('/api/bff/health'),
};

export default api;