package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"achieving-backend/internal/models"
	"achieving-backend/internal/services"
	"achieving-backend/internal/middleware"
)

// RegisterAuthRoutes wires /auth endpoints using layered services
func RegisterAuthRoutes(api *gin.RouterGroup, db *gorm.DB) {
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
		var existing models.User
		if err := db.Where("email = ?", email).First(&existing).Error; err == nil {
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
		u := models.User{ID: uuid.NewString(), Email: email, Name: input.Name, PasswordHash: string(ph)}
		if err := db.Create(&u).Error; err != nil {
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
		var u models.User
		if err := db.Where("email = ?", email).First(&u).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		tok, claims, err := services.GenerateToken(u.ID, u.Name, u.Email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": tok, "user": claims})
	})

	// Me endpoint protected by middleware
	api.GET("/auth/me", middleware.AuthRequired(), func(c *gin.Context) {
		claims, _ := c.Get("claims")
		c.JSON(http.StatusOK, gin.H{"user": claims})
	})

	// Update profile (name)
	type UpdateProfileInput struct { Name string `json:"name" binding:"required"` }
	api.PATCH("/auth/profile", middleware.AuthRequired(), func(c *gin.Context) {
		var input UpdateProfileInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		claims, _ := c.Get("claims")
		m := claims.(map[string]interface{})
		userID, _ := m["sub"].(string)
		if userID == "" { c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"}); return }
		if err := db.Model(&models.User{}).Where("id = ?", userID).Update("name", input.Name).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"}); return
		}
		c.Status(http.StatusNoContent)
	})

	// Change password
	type ChangePasswordInput struct { Current string `json:"current" binding:"required"`; New string `json:"new" binding:"required"` }
	api.PATCH("/auth/password", middleware.AuthRequired(), func(c *gin.Context) {
		var input ChangePasswordInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		if len(input.New) < 6 { c.JSON(http.StatusBadRequest, gin.H{"error": "password too short"}); return }
		claims, _ := c.Get("claims")
		m := claims.(map[string]interface{})
		userID, _ := m["sub"].(string)
		if userID == "" { c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"}); return }
		var u models.User
		if err := db.First(&u, "id = ?", userID).Error; err != nil { c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"}); return }
		if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(input.Current)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "incorrect current password"}); return
		}
		ph, err := bcrypt.GenerateFromPassword([]byte(input.New), bcrypt.DefaultCost)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"}); return }
		if err := db.Model(&models.User{}).Where("id = ?", userID).Update("password_hash", string(ph)).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to change password"}); return
		}
		c.Status(http.StatusNoContent)
	})
}