import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { ShoppingBag, User, Search, Heart, Star, Plus, Minus, Trash2, Bell, CreditCard, Package, Users, Settings } from 'lucide-react';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Context for global state
interface AppContextType {
  user: any | null;
  cart: any[];
  cartCount: number;
  notifications: any[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  createOrder: (orderData: any) => Promise<any>;
  getOrders: () => Promise<any[]>;
  getNotifications: () => Promise<any[]>;
  processPayment: (paymentData: any) => Promise<any>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// API Service
class ApiService {
  private baseURL = 'http://localhost';
  
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Auth APIs
  async login(email: string, password: string) {
    return this.request(':3001/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request(':3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Product APIs
  async getProducts(filters?: any) {
    const defaultFilters = { per_page: 100, ...filters };
    const queryParams = new URLSearchParams(defaultFilters).toString();
    return this.request(`:3002/api/catalog/?${queryParams}`);
  }

  async getProduct(id: string) {
    return this.request(`:3002/api/catalog/${id}`);
  }

  // Cart APIs
  async getCart() {
    return this.request(':3003/api/cart/');
  }

  async addToCart(productId: string, quantity: number = 1) {
    return this.request(':3003/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.request(`:3003/api/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: string) {
    return this.request(`:3003/api/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Order APIs
  async createOrder(orderData: any) {
    return this.request(':3004/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Payment APIs
  async processPayment(paymentData: any) {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3006/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        ...paymentData,
        amount: 0, // 무료 결제
        payment_method: 'free_trial'
      }),
    });

    if (!response.ok) {
      throw new Error(`Payment API Error: ${response.status}`);
    }

    return response.json();
  }

  async getOrders() {
    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    
    if (!userId) {
      console.error('No user ID found');
      return { orders: [] };
    }

    const response = await fetch(`http://localhost:3004/api/orders/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get orders: ${response.status}`);
    }

    const orders = await response.json();
    return { orders: Array.isArray(orders) ? orders : [orders] };
  }

  async getOrder(id: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3004/api/orders/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get order: ${response.status}`);
    }

    return response.json();
  }

  // Inventory APIs
  async checkInventory(productId: string) {
    return this.request(`:3005/api/inventory/${productId}`);
  }

  // Notification APIs
  async getNotifications() {
    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    
    if (!userId) {
      console.error('No user ID found');
      return { notifications: [] };
    }

    const response = await fetch(`http://localhost:3007/api/notify/?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get notifications: ${response.status}`);
    }

    return response.json();
  }

  async markNotificationRead(id: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3007/api/notify/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ status: 'sent' }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.status}`);
    }

    return response.json();
  }
}

const apiService = new ApiService();

// App Provider Component
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize app state
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
      loadCart();
      loadNotifications();
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      localStorage.setItem('token', response.tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      await loadCart();
      await loadNotifications();
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setCart([]);
    setNotifications([]);
  };

  const loadCart = async () => {
    try {
      const response = await apiService.getCart();
      setCart(response.items || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const addToCart = async (product: any) => {
    try {
      console.log('Adding to cart:', product.id, product.name);
      await apiService.addToCart(product.id, 1);
      await loadCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const cartItem = cart.find(item => item.product_id === productId);
      if (cartItem) {
        await apiService.removeFromCart(cartItem.id);
        await loadCart();
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    try {
      const cartItem = cart.find(item => item.product_id === productId);
      if (cartItem) {
        if (quantity <= 0) {
          await apiService.removeFromCart(cartItem.id);
        } else {
          await apiService.updateCartItem(cartItem.id, quantity);
        }
        await loadCart();
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    }
  };

  const createOrder = async (orderData: any) => {
    try {
      const response = await apiService.createOrder(orderData);
      await loadCart(); // Clear cart after order
      return response;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };

  const processPayment = async (paymentData: any) => {
    try {
      const response = await apiService.processPayment(paymentData);
      return response;
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw error;
    }
  };

  const getOrders = async () => {
    try {
      const response = await apiService.getOrders();
      return response.orders || [];
    } catch (error) {
      console.error('Failed to get orders:', error);
      return [];
    }
  };

  const getNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      return response.notifications || [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value: AppContextType = {
    user,
    cart,
    cartCount,
    notifications,
    isAuthenticated,
    login,
    logout,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    createOrder,
    getOrders,
    getNotifications,
    processPayment,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Header Component
const Header: React.FC = () => {
  const { user, cartCount, isAuthenticated, logout } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Mini Commerce</span>
            </a>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="/products" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Products
            </a>
            {isAuthenticated && (
              <>
                <a href="/orders" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Orders
                </a>
                <a href="/notifications" className="relative text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  <Bell className="h-5 w-5" />
                </a>
              </>
            )}
            <a href="/cart" className="relative text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </a>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">안녕하세요, {user?.firstName}님!</span>
                <button 
                  onClick={logout}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <a href="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Login
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Home Component
const Home: React.FC = () => {
  const { addToCart, isAuthenticated } = useApp();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts({ limit: 4 });
      setFeaturedProducts(response.products || []);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await addToCart(product);
      alert('장바구니에 추가되었습니다!');
    } catch (error) {
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Mini Commerce
        </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Discover amazing products from top brands. Fast shipping, secure payments, and exceptional customer service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/products"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
              >
                Shop Now
              </a>
              <a
                href="/products"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-lg"
              >
                Browse Categories
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <a
              href="/products"
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Products
            </a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow group">
                <div className="relative">
                  <div className="aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Product Image</span>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50">
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">4.5</span>
                    <span className="ml-1 text-sm text-gray-500">(128)</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-600">${product.price}</span>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Products Component
const Products: React.FC = () => {
  const { addToCart, isAuthenticated } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', 'Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await addToCart(product);
      alert('장바구니에 추가되었습니다!');
    } catch (error) {
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border mb-6">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} products found
              </span>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600 hover:text-white transition-colors`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600 hover:text-white transition-colors`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow group">
                  {viewMode === 'grid' ? (
                    <div className="p-4">
                      <div className="relative mb-4">
                        <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Product Image</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-600">4.5</span>
                        <span className="ml-1 text-sm text-gray-500">(128)</span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{product.category}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-blue-600">${product.price}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Add to Cart
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center p-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg mr-4 flex-shrink-0 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">Image</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center mb-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">4.5</span>
                          <span className="ml-1 text-sm text-gray-500">(128)</span>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-blue-600">${product.price}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Add to Cart
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Checkout Component
const Checkout: React.FC = () => {
  const { cart, user, isAuthenticated, createOrder, processPayment } = useApp();
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('기본 배송지');
  const [billingAddress, setBillingAddress] = useState('기본 청구지');

  const handlePayment = async () => {
    if (!isAuthenticated || !user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setLoading(true);
      
      const paymentData = {
        user_id: user.id,
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: parseFloat(item.product_price) || 0
        })),
        total_amount: cart.reduce((sum, item) => sum + ((parseFloat(item.product_price) || 0) * item.quantity), 0),
        shipping_address: shippingAddress,
        billing_address: billingAddress
      };

      console.log('Starting payment orchestration...');
      console.log('Payment data:', paymentData);

      // Payment 서비스가 모든 오케스트레이션 처리 (결제 → 주문 생성 → 장바구니 비우기 → 알림 전송)
      const paymentResult = await processPayment(paymentData);
      
      console.log('Payment result:', paymentResult);
      
      if (paymentResult.success) {
        alert(`결제가 완료되었습니다!\n주문번호: ${paymentResult.order_id}`);
        // 장바구니는 백엔드에서 비워졌으므로 프론트엔드 상태만 업데이트
        window.location.href = '/orders';
      } else {
        alert('결제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMsg = error.response?.data?.details || error.message || '알 수 없는 오류';
      alert(`결제 처리에 실패했습니다.\n오류: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">결제하기</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 주문 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">주문 정보</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배송지
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  청구지
                </label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 결제 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">결제 정보</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>상품 금액:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>배송비:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>할인:</span>
                <span className="text-green-600">-${subtotal.toFixed(2)}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-semibold">
                <span>총 결제금액:</span>
                <span className="text-green-600">$0.00</span>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="text-green-600 font-semibold">
                    🎉 무료 체험 결제
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  모든 상품이 무료로 제공됩니다.
                </p>
              </div>
              
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
              >
                {loading ? '결제 처리 중...' : '무료로 결제하기'}
              </button>
            </div>
          </div>
        </div>

        {/* 주문 상품 목록 */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">주문 상품</h2>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Image</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product_name}</h3>
                    <p className="text-gray-600">수량: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(parseFloat(item.product_price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cart Component
const Cart: React.FC = () => {
  const { cart, updateCartQuantity, removeFromCart, createOrder, isAuthenticated } = useApp();
  const [loading, setLoading] = useState(false);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    try {
      await updateCartQuantity(productId, newQuantity);
    } catch (error) {
      alert('수량 변경에 실패했습니다.');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      alert('상품 제거에 실패했습니다.');
    }
  };

  const handleCheckout = async () => {
    console.log('🛒 Checkout button clicked!');
    console.log('🛒 Is authenticated:', isAuthenticated);
    console.log('🛒 Cart length:', cart.length);
    
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (cart.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    console.log('🛒 Redirecting to checkout page...');
    // 결제 페이지로 이동
    window.location.href = '/checkout';
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
        
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-4">Start shopping to add items to your cart</p>
            <a
              href="/products"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-500 text-xs">Image</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                      <p className="text-gray-600">${item.product_price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.product_price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="text-red-600 hover:text-red-800 mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total ({totalItems} items)</span>
                  <span className="text-lg font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                  style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Orders Component
const Orders: React.FC = () => {
  const { isAuthenticated, user } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    }
  }, [isAuthenticated, user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">주문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">주문이 없습니다</h3>
            <p className="text-gray-600">아직 주문한 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">주문 #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      주문일: {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'completed' ? '완료' :
                     order.status === 'pending' ? '처리중' : order.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-xs">IMG</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">수량: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">총 금액</span>
                    <span className="text-lg font-bold text-blue-600">${order.total_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Login Component
const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(email, password);
      if (success) {
        window.location.href = '/';
      } else {
        setError('로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">로그인</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              이메일 주소
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="demo@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>
          <p className="text-center text-gray-600 text-sm mt-4">
            테스트 계정: demo@example.com / password
          </p>
        </form>
      </div>
    </div>
  );
};

// Notifications Component
const Notifications: React.FC = () => {
  const { notifications, isAuthenticated } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      // Update notifications in context
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">알림을 불러오는 중...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">알림이 없습니다</h3>
            <p className="text-gray-600">새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/login" element={<Login />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;