import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Direct service URLs (since API Gateway is not running)
const AUTH_API_URL = 'http://localhost:3001';
const CATALOG_API_URL = 'http://localhost:3002';
const CART_API_URL = 'http://localhost:3003';
const ORDER_API_URL = 'http://localhost:3004';
const INVENTORY_API_URL = 'http://localhost:3005';
const PAYMENT_API_URL = 'http://localhost:3006';

// Create axios instances for each service
const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
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
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create API instances
const authApiInstance = createApiInstance(AUTH_API_URL);
const catalogApiInstance = createApiInstance(CATALOG_API_URL);
const cartApiInstance = createApiInstance(CART_API_URL);
const orderApiInstance = createApiInstance(ORDER_API_URL);
const inventoryApiInstance = createApiInstance(INVENTORY_API_URL);
const paymentApiInstance = createApiInstance(PAYMENT_API_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    authApiInstance.post('/api/auth/login', { email, password }),
  
  register: (userData: any) =>
    authApiInstance.post('/api/auth/register', userData),
  
  logout: () =>
    authApiInstance.post('/api/auth/logout'),
  
  getProfile: () =>
    authApiInstance.get('/api/auth/profile'),
  
  updateProfile: (userData: any) =>
    authApiInstance.put('/api/auth/profile', userData),
};

// Catalog API
export const catalogApi = {
  getProducts: (params?: any) =>
    catalogApiInstance.get('/api/catalog', { params }),
  
  getProduct: (id: string) =>
    catalogApiInstance.get(`/api/catalog/${id}`),
  
  searchProducts: (query: string, filters?: any) =>
    catalogApiInstance.get('/api/catalog/search', { params: { q: query, ...filters } }),
};

// Cart API
export const cartApi = {
  getCart: () =>
    cartApiInstance.get('/api/cart'),
  
  addItem: (productId: string, quantity: number) =>
    cartApiInstance.post('/api/cart/items', { product_id: productId, quantity }),
  
  updateItem: (itemId: string, quantity: number) =>
    cartApiInstance.put(`/api/cart/items/${itemId}`, { quantity }),
  
  removeItem: (itemId: string) =>
    cartApiInstance.delete(`/api/cart/items/${itemId}`),
  
  clearCart: () =>
    cartApiInstance.delete('/api/cart'),
  
  getItemCount: () =>
    cartApiInstance.get('/api/cart/count'),
};

// Order API
export const orderApi = {
  getOrders: () =>
    orderApiInstance.get('/api/orders'),
  
  getOrder: (id: string) =>
    orderApiInstance.get(`/api/orders/${id}`),
  
  createOrder: (orderData: any) =>
    orderApiInstance.post('/api/orders', orderData),
  
  cancelOrder: (id: string, reason?: string) =>
    orderApiInstance.put(`/api/orders/${id}/cancel`, { reason }),
};

// Inventory API
export const inventoryApi = {
  getInventory: () =>
    inventoryApiInstance.get('/api/inventory'),
  
  getProductInventory: (productId: string) =>
    inventoryApiInstance.get(`/api/inventory/${productId}`),
  
  getStockStatus: (productId: string) =>
    inventoryApiInstance.get(`/api/inventory/${productId}/status`),
};

// Payment API
export const paymentApi = {
  processPayment: (paymentData: any) =>
    paymentApiInstance.post('/api/payment/process', paymentData),
  
  getPaymentStatus: (paymentId: string) =>
    paymentApiInstance.get(`/api/payment/status/${paymentId}`),
  
  refundPayment: (paymentId: string, amount?: number, reason?: string) =>
    paymentApiInstance.post('/api/payment/refund', { paymentId, amount, reason }),
};

// Notification API (using auth service for now)
export const notificationApi = {
  getNotifications: (params?: any) =>
    authApiInstance.get('/api/notifications', { params }),
  
  getNotification: (id: string) =>
    authApiInstance.get(`/api/notifications/${id}`),
  
  markAsRead: (id: string) =>
    authApiInstance.put(`/api/notifications/${id}`, { status: 'read' }),
  
  deleteNotification: (id: string) =>
    authApiInstance.delete(`/api/notifications/${id}`),
};

export default authApiInstance;