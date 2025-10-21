import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';

const Cart: React.FC = () => {
  // Sample cart data
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      productId: '1',
      productName: 'Wireless Bluetooth Headphones',
      productPrice: 89.99,
      productImage: '/api/placeholder/100/100',
      quantity: 2,
      inStock: true
    },
    {
      id: '2',
      productId: '2',
      productName: 'Premium Coffee Maker',
      productPrice: 199.99,
      productImage: '/api/placeholder/100/100',
      quantity: 1,
      inStock: true
    },
    {
      id: '3',
      productId: '3',
      productName: 'Smart Fitness Watch',
      productPrice: 299.99,
      productImage: '/api/placeholder/100/100',
      quantity: 1,
      inStock: true
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(items => items.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              to="/products"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart Items ({totalItems})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 text-xs">Image</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {item.productName}
                        </h3>
                        <p className="text-gray-600">${item.productPrice}</p>
                        {!item.inStock && (
                          <p className="text-red-600 text-sm">Out of Stock</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={isLoading}
                            className="p-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isLoading || !item.inStock}
                            className="p-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ${(item.productPrice * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-800 mt-2 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button 
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                </button>
                
                <div className="text-center">
                  <Link
                    to="/products"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Security Features */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-1" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" />
                    <span>Easy Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;