package services

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// jwtSecret returns the application JWT secret from env with a dev fallback
func jwtSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret"
	}
	return secret
}

// GenerateToken creates a signed JWT for the given user metadata
func GenerateToken(userID, name, email string) (string, jwt.MapClaims, error) {
	claims := jwt.MapClaims{
		"sub":    userID,
		"name":   name,
		"email":  email,
		"iat":    time.Now().Unix(),
		"exp":    time.Now().Add(24 * time.Hour).Unix(),
		"issuer": "achieving-backend",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(jwtSecret()))
	return signed, claims, err
}