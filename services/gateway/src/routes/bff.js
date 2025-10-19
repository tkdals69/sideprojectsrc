const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8080';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:8080';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://cart-service:8080';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:8080';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:8080';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:8080';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8080';

// Helper function to make service calls
async function callService(url, options = {}) {
  try {
    const response = await axios({
      url,
      timeout: 10000,
      ...options
    });
    return response.data;
  } catch (error) {
    console.error(`Service call failed: ${url}`, error.message);
    throw error;
  }
}

// Dashboard data aggregation
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parallel service calls
    const [cartData, orderData, notificationData] = await Promise.allSettled([
      callService(`${CART_SERVICE_URL}/api/cart`, {
        headers: { 'X-User-ID': userId }
      }),
      callService(`${ORDER_SERVICE_URL}/api/orders/user/${userId}`),
      callService(`${NOTIFICATION_SERVICE_URL}/api/notify/user/${userId}?per_page=5`)
    ]);

    const dashboard = {
      cart: cartData.status === 'fulfilled' ? cartData.value : null,
      recentOrders: orderData.status === 'fulfilled' ? orderData.value : [],
      notifications: notificationData.status === 'fulfilled' ? notificationData.value.notifications : [],
      timestamp: new Date().toISOString()
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard aggregation failed:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Product details with inventory status
router.get('/products/:productId/details', async (req, res) => {
  try {
    const { productId } = req.params;

    // Get product details and inventory status in parallel
    const [productData, inventoryData] = await Promise.allSettled([
      callService(`${CATALOG_SERVICE_URL}/api/catalog/${productId}`),
      callService(`${INVENTORY_SERVICE_URL}/api/inventory/${productId}/status`)
    ]);

    if (productData.status === 'rejected') {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productData.value;
    const inventoryStatus = inventoryData.status === 'fulfilled' ? inventoryData.value : null;

    res.json({
      ...product,
      inventory: inventoryStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Product details aggregation failed:', error);
    res.status(500).json({ error: 'Failed to load product details' });
  }
});

// Order creation with inventory check
router.post('/orders', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { items, shippingAddress, billingAddress } = req.body;

    // Validate items and check inventory
    const inventoryChecks = await Promise.allSettled(
      items.map(item => 
        callService(`${INVENTORY_SERVICE_URL}/api/inventory/${item.productId}/status`)
      )
    );

    // Check if all items are available
    const unavailableItems = [];
    inventoryChecks.forEach((check, index) => {
      if (check.status === 'rejected' || 
          (check.status === 'fulfilled' && check.value.status !== 'in_stock')) {
        unavailableItems.push(items[index].productId);
      }
    });

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        error: 'Some items are not available',
        unavailableItems
      });
    }

    // Create order
    const orderData = {
      userId,
      items,
      shippingAddress,
      billingAddress,
      totalAmount: items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    };

    const order = await callService(`${ORDER_SERVICE_URL}/api/orders`, {
      method: 'POST',
      data: orderData
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Cart checkout process
router.post('/cart/checkout', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shippingAddress, billingAddress, paymentMethod } = req.body;

    // Get cart items
    const cartData = await callService(`${CART_SERVICE_URL}/api/cart`, {
      headers: { 'X-User-ID': userId }
    });

    if (!cartData.cart || !cartData.cart.items || cartData.cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Create order from cart
    const orderData = {
      userId,
      items: cartData.cart.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.productPrice
      })),
      shippingAddress,
      billingAddress,
      totalAmount: cartData.cart.items.reduce((sum, item) => 
        sum + (item.productPrice * item.quantity), 0
      )
    };

    const order = await callService(`${ORDER_SERVICE_URL}/api/orders`, {
      method: 'POST',
      data: orderData
    });

    // Clear cart after successful order creation
    await callService(`${CART_SERVICE_URL}/api/cart`, {
      method: 'DELETE',
      headers: { 'X-User-ID': userId }
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Cart checkout failed:', error);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
});

// User profile with recent activity
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user profile and recent activity in parallel
    const [profileData, orderData, notificationData] = await Promise.allSettled([
      callService(`${AUTH_SERVICE_URL}/api/auth/profile`, {
        headers: { 'Authorization': req.headers.authorization }
      }),
      callService(`${ORDER_SERVICE_URL}/api/orders/user/${userId}?limit=5`),
      callService(`${NOTIFICATION_SERVICE_URL}/api/notify/user/${userId}?per_page=5`)
    ]);

    const profile = {
      user: profileData.status === 'fulfilled' ? profileData.value.user : null,
      recentOrders: orderData.status === 'fulfilled' ? orderData.value : [],
      notifications: notificationData.status === 'fulfilled' ? notificationData.value.notifications : [],
      timestamp: new Date().toISOString()
    };

    res.json(profile);
  } catch (error) {
    console.error('Profile aggregation failed:', error);
    res.status(500).json({ error: 'Failed to load profile data' });
  }
});

// Search products with filters
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, perPage = 20 } = req.query;

    const searchParams = new URLSearchParams({
      query: q,
      category,
      min_price: minPrice,
      max_price: maxPrice,
      page,
      per_page: perPage
    });

    const products = await callService(`${CATALOG_SERVICE_URL}/api/catalog?${searchParams}`);

    res.json(products);
  } catch (error) {
    console.error('Product search failed:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Service health check
router.get('/health', async (req, res) => {
  try {
    const services = [
      { name: 'auth', url: AUTH_SERVICE_URL },
      { name: 'catalog', url: CATALOG_SERVICE_URL },
      { name: 'cart', url: CART_SERVICE_URL },
      { name: 'order', url: ORDER_SERVICE_URL },
      { name: 'inventory', url: INVENTORY_SERVICE_URL },
      { name: 'payment', url: PAYMENT_SERVICE_URL },
      { name: 'notification', url: NOTIFICATION_SERVICE_URL }
    ];

    const healthChecks = await Promise.allSettled(
      services.map(service => 
        callService(`${service.url}/health`).then(() => ({ name: service.name, status: 'healthy' }))
      )
    );

    const serviceStatus = healthChecks.map((check, index) => ({
      name: services[index].name,
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      error: check.status === 'rejected' ? check.reason.message : null
    }));

    const overallStatus = serviceStatus.every(s => s.status === 'healthy') ? 'healthy' : 'degraded';

    res.json({
      status: overallStatus,
      services: serviceStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: 'Failed to check service health' });
  }
});

module.exports = router;
