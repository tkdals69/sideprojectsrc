package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

// JWTClaims represents the JWT token claims
type JWTClaims struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Aud       string `json:"aud"`
	Iss       string `json:"iss"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check if the header starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse and validate the token
		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Verify the signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			// Return the secret key (should match auth service)
			return []byte("your-super-secret-jwt-key-here"), nil
		}, jwt.WithValidMethods([]string{"HS256"}))

		if err != nil {
			logrus.WithError(err).Warn("JWT token validation failed:", err.Error())
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token", "details": err.Error()})
			c.Abort()
			return
		}

		// Check if the token is valid
		if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
			// Validate issuer and audience
			if claims.Iss != "auth-service" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token issuer"})
				c.Abort()
				return
			}
			if claims.Aud != "mini-commerce" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token audience"})
				c.Abort()
				return
			}
			
			// Set user information in the context
			c.Set("userID", claims.UserID)
			c.Set("email", claims.Email)
			c.Set("firstName", claims.FirstName)
			c.Set("lastName", claims.LastName)
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims", "token_valid": token.Valid, "claims_ok": ok})
			c.Abort()
			return
		}
	}
}
