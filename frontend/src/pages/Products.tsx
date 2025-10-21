import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Star, Heart, Eye, ShoppingBag, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  sku: string;
  image_url?: string;
  created_at: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = ['All', 'Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty'];

  // 상품 데이터 로드
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3002/api/catalog');
        
        if (!response.ok) {
          throw new Error('상품 데이터를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('상품 데이터를 불러오는데 실패했습니다.');
        toast.error('상품 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 검색 및 필터링
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy]);

  const handleAddToCart = async (productId: string) => {
    try {
      const response = await fetch('http://localhost:3003/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        toast.success('장바구니에 추가되었습니다!');
      } else {
        toast.error('장바구니 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('장바구니 추가에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">상품 목록</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">필터</h3>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="상품 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
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
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm border mb-6">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <span className="text-sm text-gray-600">
                  {filteredProducts.length}개의 상품
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">정렬:</label>
                  <select
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">이름순</option>
                    <option value="price-low">가격: 낮은순</option>
                    <option value="price-high">가격: 높은순</option>
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600 hover:text-white transition-colors`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600 hover:text-white transition-colors`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">상품을 찾을 수 없습니다</h3>
                <p className="text-gray-600">검색 조건을 변경해보세요</p>
              </div>
            ) : (
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
                            <span className="text-gray-500 text-sm">상품 이미지</span>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50">
                              <Heart className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                        <p className="text-gray-500 text-xs mb-3">{product.category} • {product.brand}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-blue-600">₩{product.price.toLocaleString()}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleAddToCart(product.id)}
                          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm"
                        >
                          장바구니에 추가
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center p-4">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg mr-4 flex-shrink-0 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">이미지</span>
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                          <p className="text-gray-500 text-xs mb-2">{product.category} • {product.brand}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-blue-600">₩{product.price.toLocaleString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddToCart(product.id)}
                          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                          장바구니에 추가
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;