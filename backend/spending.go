package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Models
type SpendingEntry struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Amount    float64   `json:"amount"`
	Category  string    `gorm:"index" json:"category"`
	Date      time.Time `json:"date"`
	MonthKey  string    `gorm:"index" json:"monthKey"`
	Month     Month     `gorm:"foreignKey:MonthKey;references:MonthKey;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Note      string    `gorm:"type:text" json:"note"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

type EarningEntry struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Source    string    `json:"source"`
	Amount    float64   `json:"amount"`
	Date      time.Time `json:"date"`
	MonthKey  string    `gorm:"index" json:"monthKey"`
	Month     Month     `gorm:"foreignKey:MonthKey;references:MonthKey;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

type BorrowEntry struct {
	ID           string     `gorm:"primaryKey" json:"id"`
	From         string     `json:"from"`
	Amount       float64    `json:"amount"`
	Date         time.Time  `json:"date"`
	MonthKey     string     `gorm:"index" json:"monthKey"`
	Month        Month      `gorm:"foreignKey:MonthKey;references:MonthKey;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	RepaidAmount *float64   `json:"repaidAmount"`
	RepaidDate   *time.Time `json:"repaidDate"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"createdAt"`
}

type Category struct {
	Name      string    `gorm:"primaryKey" json:"name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

type Plan struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	MonthKey      string    `gorm:"index:idx_month_category" json:"monthKey"` // YYYY-MM
	Month         Month     `gorm:"foreignKey:MonthKey;references:MonthKey;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Category      string    `gorm:"index:idx_month_category" json:"category"`
	PlannedAmount float64   `json:"plannedAmount"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

// NEW: Months
type Month struct {
	MonthKey  string    `gorm:"primaryKey" json:"monthKey"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

// Migration hook
func MigrateSpending(database *gorm.DB) {
	_ = database.AutoMigrate(&SpendingEntry{}, &EarningEntry{}, &BorrowEntry{}, &Category{}, &Plan{}, &Month{})
	// Backfill MonthKey for existing data where missing
	database.Exec("UPDATE spending_entries SET month_key = DATE_FORMAT(date, '%Y-%m') WHERE month_key IS NULL OR month_key = ''")
	database.Exec("UPDATE earning_entries SET month_key = DATE_FORMAT(date, '%Y-%m') WHERE month_key IS NULL OR month_key = ''")
	database.Exec("UPDATE borrow_entries SET month_key = DATE_FORMAT(date, '%Y-%m') WHERE month_key IS NULL OR month_key = ''")

	// Ensure FK constraints exist (CASCADE) between entries/plans and months
	_ = database.Migrator().CreateConstraint(&SpendingEntry{}, "Month")
	_ = database.Migrator().CreateConstraint(&EarningEntry{}, "Month")
	_ = database.Migrator().CreateConstraint(&BorrowEntry{}, "Month")
	_ = database.Migrator().CreateConstraint(&Plan{}, "Month")
}

// Helpers
func parseISODate(s string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	return time.Parse("2006-01-02", s)
}

// Routes registration
func RegisterSpendingRoutes(api *gin.RouterGroup, database *gorm.DB) {
	// Spending entries
	api.GET("/spending", func(c *gin.Context) {
		month := c.Query("month")
		var entries []SpendingEntry
		if month == "" {
			if err := database.Order("date desc").Find(&entries).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list spending"})
				return
			}
		} else {
			if err := database.Where("month_key = ?", month).Order("date desc").Find(&entries).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list spending"})
				return
			}
		}
		c.JSON(http.StatusOK, entries)
	})

	type CreateSpendingInput struct {
		Amount   float64 `json:"amount" binding:"required"`
		Category string  `json:"category" binding:"required"`
		Date     string  `json:"date" binding:"required"`
		Note     string  `json:"note"`
	}
	api.POST("/spending", func(c *gin.Context) {
		var input CreateSpendingInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		d, err := parseISODate(input.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"})
			return
		}
		mk := d.Format("2006-01")
		// ensure month exists
		var m Month
		if err := database.Where("month_key = ?", mk).First(&m).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				_ = database.Create(&Month{MonthKey: mk}).Error
			}
		}
		entry := SpendingEntry{
			ID:       uuid.NewString(),
			Amount:   input.Amount,
			Category: input.Category,
			Date:     d,
			MonthKey: mk,
			Note:     input.Note,
		}
		if err := database.Create(&entry).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create spending"})
			return
		}
		c.JSON(http.StatusCreated, entry)
	})
	api.DELETE("/spending/:id", func(c *gin.Context) {
		id := c.Param("id")
		res := database.Delete(&SpendingEntry{}, "id = ?", id)
		if res.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete spending"})
			return
		}
		if res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.Status(http.StatusNoContent)
	})

	// Earnings
	api.GET("/earnings", func(c *gin.Context) {
		month := c.Query("month")
		var items []EarningEntry
		if month == "" {
			if err := database.Order("date desc").Find(&items).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list earnings"})
				return
			}
		} else {
			if err := database.Where("month_key = ?", month).Order("date desc").Find(&items).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list earnings"})
				return
			}
		}
		c.JSON(http.StatusOK, items)
	})
	type CreateEarningInput struct {
		Source string  `json:"source" binding:"required"`
		Amount float64 `json:"amount" binding:"required"`
		Date   string  `json:"date" binding:"required"`
	}
	api.POST("/earnings", func(c *gin.Context) {
		var input CreateEarningInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		d, err := parseISODate(input.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"})
			return
		}
		mk := d.Format("2006-01")
		var m Month
		if err := database.Where("month_key = ?", mk).First(&m).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				_ = database.Create(&Month{MonthKey: mk}).Error
			}
		}
		item := EarningEntry{ID: uuid.NewString(), Source: input.Source, Amount: input.Amount, Date: d, MonthKey: mk}
		if err := database.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create earning"})
			return
		}
		c.JSON(http.StatusCreated, item)
	})
	api.DELETE("/earnings/:id", func(c *gin.Context) {
		id := c.Param("id")
		res := database.Delete(&EarningEntry{}, "id = ?", id)
		if res.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete earning"})
			return
		}
		if res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.Status(http.StatusNoContent)
	})

	// Borrows
	api.GET("/borrows", func(c *gin.Context) {
		month := c.Query("month")
		var items []BorrowEntry
		if month == "" {
			if err := database.Order("date desc").Find(&items).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list borrows"})
				return
			}
		} else {
			if err := database.Where("month_key = ?", month).Order("date desc").Find(&items).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list borrows"})
				return
			}
		}
		c.JSON(http.StatusOK, items)
	})
	type CreateBorrowInput struct {
		From   string  `json:"from" binding:"required"`
		Amount float64 `json:"amount" binding:"required"`
		Date   string  `json:"date" binding:"required"`
	}
	api.POST("/borrows", func(c *gin.Context) {
		var input CreateBorrowInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		d, err := parseISODate(input.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"})
			return
		}
		mk := d.Format("2006-01")
		var m Month
		if err := database.Where("month_key = ?", mk).First(&m).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				_ = database.Create(&Month{MonthKey: mk}).Error
			}
		}
		item := BorrowEntry{ID: uuid.NewString(), From: input.From, Amount: input.Amount, Date: d, MonthKey: mk}
		if err := database.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create borrow"})
			return
		}
		c.JSON(http.StatusCreated, item)
	})
	type UpdateRepaymentInput struct {
		RepaidAmount float64 `json:"repaidAmount" binding:"required"`
		RepaidDate   string  `json:"repaidDate" binding:"required"`
	}
	api.PATCH("/borrows/:id/repayment", func(c *gin.Context) {
		id := c.Param("id")
		var input UpdateRepaymentInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		d, err := parseISODate(input.RepaidDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"})
			return
		}
		updates := map[string]interface{}{"repaid_amount": input.RepaidAmount, "repaid_date": d}
		res := database.Model(&BorrowEntry{}).Where("id = ?", id).Updates(updates)
		if res.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update borrow"})
			return
		}
		if res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.Status(http.StatusNoContent)
	})
	api.DELETE("/borrows/:id", func(c *gin.Context) {
		id := c.Param("id")
		res := database.Delete(&BorrowEntry{}, "id = ?", id)
		if res.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete borrow"})
			return
		}
		if res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.Status(http.StatusNoContent)
	})

	// Categories
	api.GET("/categories", func(c *gin.Context) {
		var cats []Category
		if err := database.Order("name asc").Find(&cats).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list categories"})
			return
		}
		c.JSON(http.StatusOK, cats)
	})
	type CreateCategoryInput struct {
		Name string `json:"name" binding:"required"`
	}
	api.POST("/categories", func(c *gin.Context) {
		var input CreateCategoryInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		cat := Category{Name: input.Name}
		if err := database.Create(&cat).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
			return
		}
		c.JSON(http.StatusCreated, cat)
	})
	api.DELETE("/categories/:name", func(c *gin.Context) {
		name := c.Param("name")
		res := database.Delete(&Category{}, "name = ?", name)
		if res.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete category"})
			return
		}
		if res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.Status(http.StatusNoContent)
	})

	// Plans
	api.GET("/plans", func(c *gin.Context) {
		month := c.Query("month")
		var plans []Plan
		if month == "" {
			if err := database.Order("month_key desc, category asc").Find(&plans).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list plans"})
				return
			}
		} else {
			if err := database.Where("month_key = ?", month).Order("category asc").Find(&plans).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list plans"})
				return
			}
		}
		c.JSON(http.StatusOK, plans)
	})
	type UpsertPlanInput struct {
		MonthKey      string  `json:"monthKey" binding:"required"`
		Category      string  `json:"category" binding:"required"`
		PlannedAmount float64 `json:"plannedAmount" binding:"required"`
	}
	api.POST("/plans", func(c *gin.Context) {
		var input UpsertPlanInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		// ensure month exists
		var m Month
		if err := database.Where("month_key = ?", input.MonthKey).First(&m).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				_ = database.Create(&Month{MonthKey: input.MonthKey}).Error
			}
		}
		var existing Plan
		if err := database.Where("month_key = ? AND category = ?", input.MonthKey, input.Category).First(&existing).Error; err == nil {
			// update
			existing.PlannedAmount = input.PlannedAmount
			if err2 := database.Save(&existing).Error; err2 != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update plan"})
				return
			}
			c.JSON(http.StatusOK, existing)
			return
		}
		p := Plan{ID: uuid.NewString(), MonthKey: input.MonthKey, Category: input.Category, PlannedAmount: input.PlannedAmount}
		if err := database.Create(&p).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create plan"})
			return
		}
		c.JSON(http.StatusCreated, p)
	})
	api.DELETE("/plans/:month/:category", func(c *gin.Context) {
		month := c.Param("month")
		category := c.Param("category")
		res := database.Delete(&Plan{}, "month_key = ? AND category = ?", month, category)
		if res.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete plan"})
			return
		}
		if res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.Status(http.StatusNoContent)
	})

	// NEW: Months CRUD
	api.GET("/months", func(c *gin.Context) {
		var months []Month
		if err := database.Order("month_key desc").Find(&months).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list months"})
			return
		}
		c.JSON(http.StatusOK, months)
	})
	type CreateMonthInput struct {
		MonthKey string `json:"monthKey" binding:"required"`
	}
	api.POST("/months", func(c *gin.Context) {
		var input CreateMonthInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		// naive format validation YYYY-MM
		if len(input.MonthKey) != 7 || input.MonthKey[4] != '-' {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid month key"})
			return
		}
		m := Month{MonthKey: input.MonthKey}
		if err := database.Create(&m).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create month"})
			return
		}
		c.JSON(http.StatusCreated, m)
	})
	api.GET("/months/:month/summary", func(c *gin.Context) {
		mk := c.Param("month")
		var spending []SpendingEntry
		var earnings []EarningEntry
		var borrows []BorrowEntry
		var plans []Plan
		_ = database.Where("month_key = ?", mk).Order("date desc").Find(&spending).Error
		_ = database.Where("month_key = ?", mk).Order("date desc").Find(&earnings).Error
		_ = database.Where("month_key = ?", mk).Order("date desc").Find(&borrows).Error
		_ = database.Where("month_key = ?", mk).Order("category asc").Find(&plans).Error
		c.JSON(http.StatusOK, gin.H{
			"monthKey": mk,
			"spending": spending,
			"earnings": earnings,
			"borrows":  borrows,
			"plans":    plans,
		})
	})
	api.DELETE("/months/:month", func(c *gin.Context) {
		mk := c.Param("month")
		// Start a transaction to ensure all deletions succeed or fail together
		tx := database.Begin()
		if tx.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start transaction"})
			return
		}
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Check if month exists first
		var month Month
		if err := tx.First(&month, "month_key = ?", mk).Error; err != nil {
			tx.Rollback()
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "month not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find month"})
			}
			return
		}

		// Purge associated tables explicitly by month_key (robust even without FKs)
		if err := tx.Where("month_key = ?", mk).Delete(&SpendingEntry{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete spending entries"})
			return
		}
		if err := tx.Where("month_key = ?", mk).Delete(&EarningEntry{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete earning entries"})
			return
		}
		if err := tx.Where("month_key = ?", mk).Delete(&BorrowEntry{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete borrow entries"})
			return
		}
		if err := tx.Where("month_key = ?", mk).Delete(&Plan{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete plans"})
			return
		}

		// Delete the month record itself (FK cascade will also handle if present)
		if err := tx.Delete(&Month{}, "month_key = ?", mk).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete month"})
			return
		}

		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to commit transaction"})
			return
		}
		c.Status(http.StatusNoContent)
	})
}