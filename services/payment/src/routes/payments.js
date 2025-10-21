const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const router = express.Router();

// Service URLs
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://mini-commerce-order:8080';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://mini-commerce-cart:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://mini-commerce-notification:3007';

// 무료 결제 처리 (오케스트레이터)
router.post('/process', async (req, res) => {
  const { user_id, items, total_amount, shipping_address, billing_address, payment_method } = req.body;
  
  console.log('=== Payment Orchestration Started ===');
  console.log('User ID:', user_id);
  console.log('Items count:', items?.length);
  console.log('Total amount:', total_amount);
  
  try {
    // 1. 결제 검증
    if (payment_method !== 'free_trial') {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method for free trial'
      });
    }

    // 2. 결제 처리 (무료)
    const paymentId = uuidv4();
    console.log('Step 1: Payment processed -', paymentId);

    // 3. 주문 생성
    console.log('Step 2: Creating order...');
    const orderResponse = await axios.post(`${ORDER_SERVICE_URL}/api/orders`, {
      user_id,
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price || 0
      })),
      total_amount: total_amount || 0,
      shipping_address: shipping_address || '기본 배송지',
      billing_address: billing_address || '기본 청구지',
      payment_id: paymentId
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const order = orderResponse.data;
    console.log('Step 2: Order created -', order.id);

    // 4. 장바구니 비우기
    console.log('Step 3: Clearing cart...');
    try {
      const token = req.headers.authorization;
      await axios.delete(`${CART_SERVICE_URL}/api/cart/`, {
        timeout: 5000,
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      console.log('Step 3: Cart cleared successfully');
    } catch (cartError) {
      console.error('Cart clear failed (non-critical):', cartError.message);
      // 장바구니 비우기 실패는 치명적이지 않음 - 계속 진행
    }

    // 5. 알림 전송
    console.log('Step 4: Sending notification...');
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notify/`, {
        user_id,
        order_id: order.id,
        type: 'order_created',
        title: '주문이 완료되었습니다',
        message: `주문번호 ${order.id}가 성공적으로 생성되었습니다.`,
        channel: 'email',
        status: 'pending'
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Step 4: Notification sent successfully');
    } catch (notifError) {
      console.error('Notification send failed (non-critical):', notifError.message);
      if (notifError.response) {
        console.error('Notification error details:', JSON.stringify(notifError.response.data));
      }
      // 알림 전송 실패는 치명적이지 않음 - 계속 진행
    }

    // 6. 성공 응답
    const paymentResult = {
      success: true,
      payment_id: paymentId,
      order_id: order.id,
      amount: total_amount || 0,
      payment_method: 'free_trial',
      status: 'completed',
      transaction_id: `FREE_${paymentId}`,
      timestamp: new Date().toISOString()
    };

    console.log('=== Payment Orchestration Completed ===');
    console.log('Payment ID:', paymentId);
    console.log('Order ID:', order.id);

    res.json(paymentResult);

  } catch (error) {
    console.error('=== Payment Orchestration Failed ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      details: error.message,
      step: error.config?.url || 'unknown'
    });
  }
});

// 결제 상태 조회
router.get('/:paymentId', (req, res) => {
  const { paymentId } = req.params;
  
  // 무료 결제는 항상 완료 상태
  res.json({
    payment_id: paymentId,
    status: 'completed',
    amount: 0,
    payment_method: 'free_trial'
  });
});

module.exports = router;
