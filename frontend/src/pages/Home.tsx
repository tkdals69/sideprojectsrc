import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, Star, ArrowRight, Heart, Eye } from 'lucide-react';

const Home: React.FC = () => {
  // Sample featured products data
  const featuredProducts = [
    {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      price: 89.99,
      originalPrice: 129.99,
      image: '/api/placeholder/300/300',
      rating: 4.5,
      reviews: 128,
      category: 'Electronics'
    },
    {
      id: '2',
      name: 'Premium Coffee Maker',
      price: 199.99,
      originalPrice: 249.99,
      image: '/api/placeholder/300/300',
      rating: 4.8,
      reviews: 89,
      category: 'Home & Kitchen'
    },
    {
      id: '3',
      name: 'Smart Fitness Watch',
      price: 299.99,
      originalPrice: 399.99,
      image: '/api/placeholder/300/300',
      rating: 4.6,
      reviews: 256,
      category: 'Electronics'
    },
    {
      id: '4',
      name: 'Organic Cotton T-Shirt',
      price: 24.99,
      originalPrice: 34.99,
      image: '/api/placeholder/300/300',
      rating: 4.3,
      reviews: 67,
      category: 'Clothing'
    }
  ];

  const categories = [
    { name: 'Electronics', icon: '📱', count: 156 },
    { name: 'Clothing', icon: '👕', count: 89 },
    { name: 'Home & Garden', icon: '🏠', count: 234 },
    { name: 'Sports', icon: '⚽', count: 78 },
    { name: 'Books', icon: '📚', count: 145 },
    { name: 'Beauty', icon: '💄', count: 67 }
  ];

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
              <Link
                to="/products"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
              >
                Shop Now
              </Link>
              <Link
                to="/products"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-lg"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/products?category=${category.name}`}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center group"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.count} items</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link
              to="/products"
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
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
                  {product.originalPrice > product.price && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      Sale
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
                    <span className="ml-1 text-sm text-gray-500">({product.reviews})</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-600">${product.price}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <ShoppingBag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Free Shipping</h3>
              <p className="text-gray-600">Free shipping on orders over $100. Fast and reliable delivery to your doorstep.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payment</h3>
              <p className="text-gray-600">Your payment information is encrypted and secure. Shop with confidence.</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality Guarantee</h3>
              <p className="text-gray-600">We guarantee the quality of all our products. 30-day return policy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-xl text-blue-100 mb-8">Get the latest deals and new product announcements.</p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;