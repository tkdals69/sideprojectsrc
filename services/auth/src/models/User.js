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

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.phone = data.phone;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const query = `
        SELECT id, email, password_hash, first_name, last_name, phone, is_active, created_at, updated_at
        FROM auth_service.users 
        WHERE email = $1
      `;
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = `
        SELECT id, email, password_hash, first_name, last_name, phone, is_active, created_at, updated_at
        FROM auth_service.users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const query = `
        INSERT INTO auth_service.users (id, email, password_hash, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, password_hash, first_name, last_name, phone, is_active, created_at, updated_at
      `;
      const values = [
        userData.id,
        userData.email,
        userData.passwordHash,
        userData.firstName,
        userData.lastName,
        userData.phone || null
      ];
      
      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('User with this email already exists');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Update user
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updateData.firstName !== undefined) {
        fields.push(`first_name = $${paramCount}`);
        values.push(updateData.firstName);
        paramCount++;
      }
      if (updateData.lastName !== undefined) {
        fields.push(`last_name = $${paramCount}`);
        values.push(updateData.lastName);
        paramCount++;
      }
      if (updateData.phone !== undefined) {
        fields.push(`phone = $${paramCount}`);
        values.push(updateData.phone);
        paramCount++;
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE auth_service.users 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, email, password_hash, first_name, last_name, phone, is_active, created_at, updated_at
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Update password
  static async updatePassword(id, newPasswordHash) {
    try {
      const query = `
        UPDATE auth_service.users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, first_name, last_name, phone, is_active, created_at, updated_at
      `;
      
      const result = await pool.query(query, [newPasswordHash, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Deactivate user
  static async deactivate(id) {
    try {
      const query = `
        UPDATE auth_service.users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, first_name, last_name, phone, is_active, created_at, updated_at
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Get user statistics
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30_days
        FROM auth_service.users
      `;
      
      const result = await pool.query(query);
      return result.rows[0];
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

module.exports = { User };
