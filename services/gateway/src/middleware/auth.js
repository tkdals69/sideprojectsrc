const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8080';

/**
 * JWT authentication middleware
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with auth service
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        token: token
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.valid) {
        req.user = response.data.user;
        next();
      } else {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      }
    } catch (authError) {
      // Fallback to local JWT verification if auth service is unavailable
      console.warn('Auth service unavailable, using local JWT verification:', authError.message);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName
        };
        next();
      } catch (jwtError) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {
          token: token
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data.valid) {
          req.user = response.data.user;
        }
      } catch (authError) {
        // Silently fail for optional auth
        console.warn('Optional auth failed:', authError.message);
      }
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}

/**
 * Admin role middleware
 */
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Check if user has admin role (implement based on your user model)
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }

  next();
}

/**
 * Rate limiting middleware for authenticated users
 */
function userRateLimitMiddleware(req, res, next) {
  // Implement user-specific rate limiting
  // This is a placeholder - implement based on your requirements
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  userRateLimitMiddleware
};
