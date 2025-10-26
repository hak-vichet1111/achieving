package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"achieving-backend/internal/models"
	"achieving-backend/internal/repository"
	"achieving-backend/internal/services"
	"achieving-backend/internal/middleware"
)

// RegisterGoalRoutes wires goal endpoints into the provided router group
func RegisterGoalRoutes(api *gin.RouterGroup, db *gorm.DB) {
	repo := repository.NewGoalRepository(db)
	svc := services.NewGoalService(repo)
	api.Use(middleware.AuthRequired())

	api.GET("/goals", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		goals, err := svc.ListGoals(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list goals"})
			return
		}
		c.JSON(http.StatusOK, goals)
	})

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

	api.POST("/goals", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
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
		if input.Description != nil { desc = *input.Description }
		cat := ""
		if input.Category != nil { cat = *input.Category }
		freq := ""
		if input.SaveFrequency != nil { freq = *input.SaveFrequency }

		g := models.Goal{
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
		// Create via service using per-user scoping
		created, err := svc.CreateGoal(userID, g.Title, g.Description, g.Category, g.SaveFrequency, g.Duration, g.StartDate, g.EndDate, g.TargetDate, g.TargetAmount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create goal"})
			return
		}
		c.JSON(http.StatusCreated, created)
	})

	type UpdateStatusInput struct { Status string `json:"status" binding:"required"` }

	api.PATCH("/goals/:id/status", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		id := c.Param("id")
		var input UpdateStatusInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		switch input.Status {
		case "not_started", "in_progress", "completed":
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
			return
		}
		updates := map[string]interface{}{"status": input.Status}
		rows, err := svc.UpdateGoal(userID, id, updates)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
			return
		}
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"}); return }
		c.Status(http.StatusNoContent)
	})

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

	api.PUT("/goals/:id", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		id := c.Param("id")
		var input UpdateGoalInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		updates := map[string]interface{}{}
		if input.Title != nil { updates["title"] = *input.Title }
		if input.Description != nil { updates["description"] = *input.Description }
		if input.Category != nil { updates["category"] = *input.Category }
		if input.SaveFrequency != nil { updates["save_frequency"] = *input.SaveFrequency }
		if input.Duration != nil { updates["duration"] = *input.Duration }
		if input.StartDate != nil {
			if *input.StartDate == "" { updates["start_date"] = nil } else {
				if parsed, err := time.Parse(time.RFC3339, *input.StartDate); err == nil { updates["start_date"] = parsed } else if parsed2, err2 := time.Parse("2006-01-02", *input.StartDate); err2 == nil { updates["start_date"] = parsed2 }
			}
		}
		if input.EndDate != nil {
			if *input.EndDate == "" { updates["end_date"] = nil; updates["target_date"] = nil } else {
				if parsed, err := time.Parse(time.RFC3339, *input.EndDate); err == nil { updates["end_date"] = parsed; updates["target_date"] = parsed } else if parsed2, err2 := time.Parse("2006-01-02", *input.EndDate); err2 == nil { updates["end_date"] = parsed2; updates["target_date"] = parsed2 }
			}
		}
		if input.TargetDate != nil {
			if *input.TargetDate == "" { updates["target_date"] = nil } else {
				if parsed, err := time.Parse(time.RFC3339, *input.TargetDate); err == nil { updates["target_date"] = parsed; updates["end_date"] = parsed } else if parsed2, err2 := time.Parse("2006-01-02", *input.TargetDate); err2 == nil { updates["target_date"] = parsed2; updates["end_date"] = parsed2 }
			}
		}
		if input.TargetAmount != nil { updates["target_amount"] = *input.TargetAmount }
		if input.CurrentAmount != nil { updates["current_amount"] = *input.CurrentAmount }

		rows, err := svc.UpdateGoal(userID, id, updates)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update goal"}); return }
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"}); return }
		g, err := svc.FindGoal(userID, id)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch updated goal"}); return }
		c.JSON(http.StatusOK, g)
	})

	api.DELETE("/goals/:id", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		id := c.Param("id")
		rows, err := svc.DeleteGoal(userID, id)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete goal"}); return }
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"}); return }
		c.Status(http.StatusNoContent)
	})
}