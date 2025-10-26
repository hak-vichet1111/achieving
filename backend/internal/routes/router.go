package routes

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"achieving-backend/internal/config"
	"achieving-backend/internal/handlers"
)

// SetupRouter constructs the gin Engine with middleware and registered routes
func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()
	// Trusted proxies
	r.SetTrustedProxies([]string{"127.0.0.1"})
	// CORS based on env
	allowOrigin := config.MustGetEnv("ALLOW_ORIGIN", "http://localhost:5174")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{allowOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	// Auth
	handlers.RegisterAuthRoutes(api, db)
	// Goals
	handlers.RegisterGoalRoutes(api, db)
	// Spending
	handlers.RegisterSpendingRoutes(api, db)

	// Health
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"ok": true}) })
	return r
}