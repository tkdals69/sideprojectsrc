const { v4: uuidv4 } = require('uuid');

/**
 * Generate mock payment response based on various factors
 * @param {Object} paymentData - Payment request data
 * @returns {Object} Mock payment response
 */
function generateMockResponse(paymentData) {
  const { orderId, amount, paymentMethod, isRefund = false } = paymentData;
  
  // Get failure rate from environment (default 10%)
  const failureRate = parseFloat(process.env.MOCK_FAILURE_RATE || '0.1');
  
  // Simulate various failure scenarios
  const shouldFail = Math.random() < failureRate;
  
  if (shouldFail) {
    return generateFailureResponse(paymentData);
  }
  
  // Simulate processing delay
  const processingDelay = Math.random() * 2000; // 0-2 seconds
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = {
        paymentId: uuidv4(),
        orderId,
        amount,
        status: 'success',
        paymentMethod,
        processedAt: new Date().toISOString(),
        transactionId: generateTransactionId(),
        authorizationCode: generateAuthorizationCode(),
        failureReason: null
      };
      
      resolve(response);
    }, processingDelay);
  });
}

/**
 * Generate failure response
 * @param {Object} paymentData - Payment request data
 * @returns {Object} Failure response
 */
function generateFailureResponse(paymentData) {
  const { orderId, amount, paymentMethod } = paymentData;
  
  const failureReasons = [
    'Insufficient funds',
    'Card declined',
    'Invalid card number',
    'Expired card',
    'CVV mismatch',
    'Card blocked',
    'Network timeout',
    'Invalid payment method',
    'Fraud detection',
    'Daily limit exceeded'
  ];
  
  const randomReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
  
  return {
    paymentId: uuidv4(),
    orderId,
    amount,
    status: 'failed',
    paymentMethod,
    processedAt: new Date().toISOString(),
    failureReason: randomReason,
    transactionId: null,
    authorizationCode: null
  };
}

/**
 * Generate transaction ID
 * @returns {string} Transaction ID
 */
function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

/**
 * Generate authorization code
 * @returns {string} Authorization code
 */
function generateAuthorizationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate card number (Luhn algorithm)
 * @param {string} cardNumber - Card number to validate
 * @returns {boolean} Whether card number is valid
 */
function validateCardNumber(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }
  
  // Remove spaces and non-digits
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate expiry date
 * @param {string} expiryDate - Expiry date in MM/YY format
 * @returns {boolean} Whether expiry date is valid
 */
function validateExpiryDate(expiryDate) {
  if (!expiryDate || typeof expiryDate !== 'string') {
    return false;
  }
  
  const [month, year] = expiryDate.split('/');
  if (!month || !year) {
    return false;
  }
  
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }
  
  if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
    return false;
  }
  
  return true;
}

/**
 * Validate CVV
 * @param {string} cvv - CVV code
 * @returns {boolean} Whether CVV is valid
 */
function validateCVV(cvv) {
  if (!cvv || typeof cvv !== 'string') {
    return false;
  }
  
  const cleanCVV = cvv.replace(/\D/g, '');
  return cleanCVV.length === 3 || cleanCVV.length === 4;
}

/**
 * Simulate payment processing with various scenarios
 * @param {Object} paymentData - Payment request data
 * @returns {Object} Processing result
 */
function simulatePaymentProcessing(paymentData) {
  const { cardNumber, expiryDate, cvv, amount } = paymentData;
  
  // Validate card details
  if (cardNumber && !validateCardNumber(cardNumber)) {
    return {
      status: 'failed',
      failureReason: 'Invalid card number'
    };
  }
  
  if (expiryDate && !validateExpiryDate(expiryDate)) {
    return {
      status: 'failed',
      failureReason: 'Invalid or expired card'
    };
  }
  
  if (cvv && !validateCVV(cvv)) {
    return {
      status: 'failed',
      failureReason: 'Invalid CVV'
    };
  }
  
  // Simulate amount-based failures
  if (amount > 10000) {
    return {
      status: 'failed',
      failureReason: 'Amount exceeds daily limit'
    };
  }
  
  if (amount < 1) {
    return {
      status: 'failed',
      failureReason: 'Amount too low'
    };
  }
  
  // Simulate random failures
  const failureRate = parseFloat(process.env.MOCK_FAILURE_RATE || '0.1');
  if (Math.random() < failureRate) {
    return generateFailureResponse(paymentData);
  }
  
  return {
    status: 'success',
    paymentId: uuidv4(),
    transactionId: generateTransactionId(),
    authorizationCode: generateAuthorizationCode()
  };
}

module.exports = {
  generateMockResponse,
  generateFailureResponse,
  generateTransactionId,
  generateAuthorizationCode,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  simulatePaymentProcessing
};
