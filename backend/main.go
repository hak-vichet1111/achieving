package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/google/uuid"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Goal represents the goal entity aligned with the frontend type
// Fields optional in frontend are pointers here
// JSON field names match the TS types
type Goal struct {
	ID            string     `gorm:"primaryKey" json:"id"`
	Title         string     `gorm:"not null" json:"title"`
	Description   string     `gorm:"type:text" json:"description"`
	Category      string     `json:"category"`
	SaveFrequency string     `json:"saveFrequency"`
	Duration      *int       `json:"duration"`
	StartDate     *time.Time `json:"startDate"`
	EndDate       *time.Time `json:"endDate"`
	TargetDate    *time.Time `json:"targetDate"`
	Status        string     `gorm:"type:varchar(20);not null;default:not_started" json:"status"`
	CreatedAt     time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	TargetAmount  *float64   `json:"targetAmount"`
	CurrentAmount *float64   `json:"currentAmount"`
}

var db *gorm.DB

func loadEnv() {
	_ = godotenv.Load()
}

func mustGetEnv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}

func connectDB() *gorm.DB {
	host := mustGetEnv("DB_HOST", "localhost")
	port := mustGetEnv("DB_PORT", "3306")
	user := mustGetEnv("DB_USER", "root")
	pass := mustGetEnv("DB_PASS", "")
	name := mustGetEnv("DB_NAME", "achieving_db")
	// MySQL DSN
	dsn := user + ":" + pass + "@tcp(" + host + ":" + port + ")/" + name + "?charset=utf8mb4&parseTime=True&loc=Local"
	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	return database
}

func migrate(database *gorm.DB) {
	// Dev-only: ensure schema alignment with string UUID primary key
	_ = database.Migrator().DropTable(&Goal{})
	if err := database.AutoMigrate(&Goal{}); err != nil {
		log.Fatalf("failed to migrate schema: %v", err)
	}
}

func setupRouter() *gin.Engine {
	r := gin.Default()
	// CORS
	allowOrigin := mustGetEnv("ALLOW_ORIGIN", "http://localhost:5174")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{allowOrigin, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.GET("/goals", listGoals)
		api.POST("/goals", createGoal)
		api.PATCH("/goals/:id/status", updateGoalStatus)
		api.PUT("/goals/:id", updateGoal)
		api.DELETE("/goals/:id", deleteGoal)
	}

	// Health
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"ok": true}) })
	return r
}

func listGoals(c *gin.Context) {
	var goals []Goal
	if err := db.Order("created_at desc").Find(&goals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list goals"})
		return
	}
	c.JSON(http.StatusOK, goals)
}

type CreateGoalInput struct {
	Title         string   `json:"title" binding:"required"`
	Description   *string  `json:"description"`
	Category      *string  `json:"category"`
	SaveFrequency *string  `json:"saveFrequency"`
	Duration      *int     `json:"duration"`
	StartDate     *string  `json:"startDate"`
	EndDate       *string  `json:"endDate"`
	TargetDate    *string  `json:"targetDate"`
	TargetAmount  *float64 `json:"targetAmount"`
	CurrentAmount *float64 `json:"currentAmount"`
}

func createGoal(c *gin.Context) {
	var input CreateGoalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	var sd *time.Time
	if input.StartDate != nil && *input.StartDate != "" {
		if parsed, err := time.Parse(time.RFC3339, *input.StartDate); err == nil {
			sd = &parsed
		} else if parsed2, err2 := time.Parse("2006-01-02", *input.StartDate); err2 == nil {
			sd = &parsed2
		}
	}

	var ed *time.Time
	if input.EndDate != nil && *input.EndDate != "" {
		if parsed, err := time.Parse(time.RFC3339, *input.EndDate); err == nil {
			ed = &parsed
		} else if parsed2, err2 := time.Parse("2006-01-02", *input.EndDate); err2 == nil {
			ed = &parsed2
		}
	} else if input.TargetDate != nil && *input.TargetDate != "" {
		if parsed, err := time.Parse(time.RFC3339, *input.TargetDate); err == nil {
			ed = &parsed
		} else if parsed2, err2 := time.Parse("2006-01-02", *input.TargetDate); err2 == nil {
			ed = &parsed2
		}
	}

	desc := ""
	if input.Description != nil {
		desc = *input.Description
	}
	cat := ""
	if input.Category != nil {
		cat = *input.Category
	}
	freq := ""
	if input.SaveFrequency != nil {
		freq = *input.SaveFrequency
	}

	g := Goal{
		ID:            uuid.NewString(),
		Title:         input.Title,
		Description:   desc,
		Category:      cat,
		SaveFrequency: freq,
		Duration:      input.Duration,
		StartDate:     sd,
		EndDate:       ed,
		TargetDate:    ed,
		Status:        "not_started",
		TargetAmount:  input.TargetAmount,
		CurrentAmount: input.CurrentAmount,
	}
	if err := db.Create(&g).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create goal"})
		return
	}
	c.JSON(http.StatusCreated, g)
}

type UpdateStatusInput struct {
	Status string `json:"status" binding:"required"`
}

func updateGoalStatus(c *gin.Context) {
	id := c.Param("id")
	var input UpdateStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	switch input.Status {
	case "not_started", "in_progress", "completed":
		// ok
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	res := db.Model(&Goal{}).Where("id = ?", id).Update("status", input.Status)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

type UpdateGoalInput struct {
	Title         *string  `json:"title"`
	Description   *string  `json:"description"`
	Category      *string  `json:"category"`
	SaveFrequency *string  `json:"saveFrequency"`
	Duration      *int     `json:"duration"`
	StartDate     *string  `json:"startDate"`
	EndDate       *string  `json:"endDate"`
	TargetDate    *string  `json:"targetDate"`
	TargetAmount  *float64 `json:"targetAmount"`
	CurrentAmount *float64 `json:"currentAmount"`
}

func updateGoal(c *gin.Context) {
	id := c.Param("id")
	var input UpdateGoalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	updates := map[string]interface{}{}
	if input.Title != nil {
		updates["title"] = *input.Title
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.Category != nil {
		updates["category"] = *input.Category
	}
	if input.SaveFrequency != nil {
		updates["save_frequency"] = *input.SaveFrequency
	}
	if input.Duration != nil {
		updates["duration"] = *input.Duration
	}
	if input.StartDate != nil {
		if *input.StartDate == "" {
			updates["start_date"] = nil
		} else {
			if parsed, err := time.Parse(time.RFC3339, *input.StartDate); err == nil {
				updates["start_date"] = parsed
			} else if parsed2, err2 := time.Parse("2006-01-02", *input.StartDate); err2 == nil {
				updates["start_date"] = parsed2
			}
		}
	}
	if input.EndDate != nil {
		if *input.EndDate == "" {
			updates["end_date"] = nil
			updates["target_date"] = nil
		} else {
			if parsed, err := time.Parse(time.RFC3339, *input.EndDate); err == nil {
				updates["end_date"] = parsed
				updates["target_date"] = parsed
			} else if parsed2, err2 := time.Parse("2006-01-02", *input.EndDate); err2 == nil {
				updates["end_date"] = parsed2
				updates["target_date"] = parsed2
			}
		}
	}
	if input.TargetDate != nil {
		if *input.TargetDate == "" {
			updates["target_date"] = nil
		} else {
			if parsed, err := time.Parse(time.RFC3339, *input.TargetDate); err == nil {
				updates["target_date"] = parsed
				updates["end_date"] = parsed
			} else if parsed2, err2 := time.Parse("2006-01-02", *input.TargetDate); err2 == nil {
				updates["target_date"] = parsed2
				updates["end_date"] = parsed2
			}
		}
	}
	if input.TargetAmount != nil {
		updates["target_amount"] = *input.TargetAmount
	}
	if input.CurrentAmount != nil {
		updates["current_amount"] = *input.CurrentAmount
	}

	res := db.Model(&Goal{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update goal"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}
	var g Goal
	if err := db.First(&g, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch updated goal"})
		return
	}
	c.JSON(http.StatusOK, g)
}

func deleteGoal(c *gin.Context) {
	id := c.Param("id")
	res := db.Delete(&Goal{}, "id = ?", id)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete goal"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

func main() {
	loadEnv()
	db = connectDB()
	migrate(db)

	r := setupRouter()
	port := mustGetEnv("PORT", "8080")
	log.Printf("server listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}