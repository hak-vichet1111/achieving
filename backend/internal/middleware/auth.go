package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func jwtSecretFunc(t *jwt.Token) (interface{}, error) {
	return []byte(jwtSecret()), nil
}

func jwtSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret"
	}
	return secret
}

// AuthRequired validates Bearer token and injects claims into context
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}
		tokStr := strings.TrimPrefix(auth, "Bearer ")
		tok, err := jwt.Parse(tokStr, jwtSecretFunc)
		if err != nil || !tok.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		claims, ok := tok.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		// Normalize to plain map for handler assertions
		c.Set("claims", map[string]interface{}(claims))
		c.Next()
	}
}