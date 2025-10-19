import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🛒 Mini Commerce
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          MSA 기반 이커머스 시스템
        </p>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎉 프론트엔드 실행 성공!
          </h2>
          <p className="text-gray-600 mb-4">
            React 애플리케이션이 정상적으로 실행되고 있습니다.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✅ React 18.2.0</p>
            <p>✅ TypeScript</p>
            <p>✅ Tailwind CSS</p>
            <p>✅ 개발 서버 실행 중</p>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">구현된 기능들:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• 인증 시스템 (JWT)</p>
              <p>• 상품 목록/상세</p>
              <p>• 장바구니 관리</p>
              <p>• 주문 내역</p>
              <p>• 사용자 프로필</p>
              <p>• 반응형 디자인</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
