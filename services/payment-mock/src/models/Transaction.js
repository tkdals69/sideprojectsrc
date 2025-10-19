const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mini_commerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.orderId = data.order_id;
    this.amount = data.amount;
    this.status = data.status;
    this.paymentMethod = data.payment_method;
    this.paymentReference = data.payment_reference;
    this.failureReason = data.failure_reason;
    this.processedAt = data.processed_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create new transaction
  static async create(transactionData) {
    try {
      const query = `
        INSERT INTO payment_service.transactions 
        (id, order_id, amount, status, payment_method, payment_reference, failure_reason, processed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, order_id, amount, status, payment_method, payment_reference, failure_reason, processed_at, created_at, updated_at
      `;
      const values = [
        transactionData.id,
        transactionData.orderId,
        transactionData.amount,
        transactionData.status,
        transactionData.paymentMethod,
        transactionData.paymentReference,
        transactionData.failureReason,
        transactionData.processedAt
      ];
      
      const result = await pool.query(query, values);
      return new Transaction(result.rows[0]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Find transaction by ID
  static async findById(id) {
    try {
      const query = `
        SELECT id, order_id, amount, status, payment_method, payment_reference, failure_reason, processed_at, created_at, updated_at
        FROM payment_service.transactions 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Transaction(result.rows[0]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Find transactions by order ID
  static async findByOrderId(orderId) {
    try {
      const query = `
        SELECT id, order_id, amount, status, payment_method, payment_reference, failure_reason, processed_at, created_at, updated_at
        FROM payment_service.transactions 
        WHERE order_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [orderId]);
      
      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Get payment statistics
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_transactions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
          COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_amount,
          COALESCE(AVG(CASE WHEN status = 'success' THEN amount ELSE NULL END), 0) as average_amount
        FROM payment_service.transactions
      `;
      
      const result = await pool.query(query);
      const stats = result.rows[0];
      
      const successRate = stats.total_transactions > 0 
        ? (stats.successful_transactions / stats.total_transactions) * 100 
        : 0;
      
      return {
        totalTransactions: parseInt(stats.total_transactions),
        successfulTransactions: parseInt(stats.successful_transactions),
        failedTransactions: parseInt(stats.failed_transactions),
        totalAmount: parseFloat(stats.total_amount),
        averageAmount: parseFloat(stats.average_amount),
        successRate: parseFloat(successRate.toFixed(2))
      };
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Update transaction status
  static async updateStatus(id, status, failureReason = null) {
    try {
      const query = `
        UPDATE payment_service.transactions 
        SET status = $1, failure_reason = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, order_id, amount, status, payment_method, payment_reference, failure_reason, processed_at, created_at, updated_at
      `;
      
      const result = await pool.query(query, [status, failureReason, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Transaction(result.rows[0]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Get transactions by status
  static async findByStatus(status) {
    try {
      const query = `
        SELECT id, order_id, amount, status, payment_method, payment_reference, failure_reason, processed_at, created_at, updated_at
        FROM payment_service.transactions 
        WHERE status = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [status]);
      
      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Get recent transactions
  static async findRecent(limit = 10) {
    try {
      const query = `
        SELECT id, order_id, amount, status, payment_method, payment_reference, failure_reason, processed_at, created_at, updated_at
        FROM payment_service.transactions 
        ORDER BY created_at DESC
        LIMIT $1
      `;
      const result = await pool.query(query, [limit]);
      
      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Test database connection
  static async testConnection() {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { Transaction };
