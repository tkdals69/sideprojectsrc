import React from 'react';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';

const Orders: React.FC = () => {
  // Sample orders data
  const orders = [
    {
      id: 'ORD-001',
      date: '2024-01-15',
      status: 'completed',
      total: 89.98,
      items: [
        { name: 'Sample Product 1', quantity: 2, price: 29.99 },
        { name: 'Sample Product 2', quantity: 1, price: 39.99 },
      ],
    },
    {
      id: 'ORD-002',
      date: '2024-01-10',
      status: 'processing',
      total: 49.99,
      items: [
        { name: 'Sample Product 3', quantity: 1, price: 49.99 },
      ],
    },
    {
      id: 'ORD-003',
      date: '2024-01-05',
      status: 'failed',
      total: 79.99,
      items: [
        { name: 'Sample Product 4', quantity: 1, price: 79.99 },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Order History</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                    <p className="text-sm text-gray-600">Placed on {order.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="text-lg font-semibold text-gray-900 mt-1">${order.total.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-600">
                      <span>{item.name} x {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details
                </button>
                {order.status === 'completed' && (
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Reorder
                  </button>
                )}
                {order.status === 'processing' && (
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">No orders yet</h2>
          <p className="mt-2 text-gray-600">Start shopping to see your orders here</p>
        </div>
      )}
    </div>
  );
};

export default Orders;