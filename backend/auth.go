package main

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents an authenticated user
type User struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;size:255" json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func MigrateAuth(database *gorm.DB) {
	_ = database.AutoMigrate(&User{})
}

func jwtSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret"
	}
	return secret
}

func RegisterAuthRoutes(api *gin.RouterGroup, database *gorm.DB) {
	// Registration
	type RegisterInput struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
		Name     string `json:"name"`
	}
	api.POST("/auth/register", func(c *gin.Context) {
		var input RegisterInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(input.Email))
		if email == "" || len(input.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email and password required"})
			return
		}
		if err := database.Where("email = ?", email).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
			return
		} else if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check user"})
			return
		}
		ph, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		u := User{ID: uuid.NewString(), Email: email, Name: input.Name, PasswordHash: string(ph)}
		if err := database.Create(&u).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": u.ID, "email": u.Email, "name": u.Name})
	})

	// Login
	type LoginInput struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	api.POST("/auth/login", func(c *gin.Context) {
		var input LoginInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(input.Email))
		var u User
		if err := database.Where("email = ?", email).First(&u).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user"})
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		// Issue JWT
		now := time.Now()
		claims := jwt.MapClaims{
			"sub":   u.ID,
			"email": u.Email,
			"name":  u.Name,
			"iat":   now.Unix(),
			"exp":   now.Add(7 * 24 * time.Hour).Unix(),
			"iss":   "achieving-api",
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signed, err := token.SignedString([]byte(jwtSecret()))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": signed, "user": gin.H{"id": u.ID, "email": u.Email, "name": u.Name}})
	})

	// Optional: auth check
	api.GET("/auth/me", func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}
		tokStr := strings.TrimPrefix(auth, "Bearer ")
		tok, err := jwt.Parse(tokStr, func(t *jwt.Token) (interface{}, error) { return []byte(jwtSecret()), nil })
		if err != nil || !tok.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		claims, ok := tok.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": claims})
	})
}