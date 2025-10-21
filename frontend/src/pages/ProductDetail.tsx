import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Heart, Share, ShoppingCart, Plus, Minus } from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Sample product data
  const product = {
    id: id || '1',
    name: 'Sample Product',
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.5,
    reviewCount: 128,
    description: 'This is a sample product description. It includes detailed information about the product features, specifications, and benefits.',
    features: [
      'High-quality materials',
      'Durable construction',
      'Easy to use',
      'Great value for money',
    ],
    images: ['/placeholder.jpg', '/placeholder.jpg', '/placeholder.jpg'],
    inStock: true,
    stockCount: 15,
  };

  const handleAddToCart = () => {
    alert(`Added ${quantity} item(s) to cart!`);
  };

  const handleBuyNow = () => {
    alert('Proceeding to checkout...');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="aspect-square bg-gray-200 rounded-lg mb-4">
            {/* Main image placeholder */}
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Product Image {selectedImage + 1}
            </div>
          </div>
          <div className="flex space-x-2">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-16 h-16 bg-gray-200 rounded-md ${
                  selectedImage === index ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <span className="text-3xl font-bold text-gray-900">${product.price}</span>
            {product.originalPrice && (
              <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
            )}
            {product.originalPrice && (
              <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                Save ${(product.originalPrice - product.price).toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {product.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {product.inStock ? `${product.stockCount} in stock` : 'Out of stock'}
            </p>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>

          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
              <Heart className="h-5 w-5" />
              <span>Add to Wishlist</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
              <Share className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((review) => (
            <div key={review} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Customer {review}</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                This is a sample review for the product. The customer is very satisfied with their purchase.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;