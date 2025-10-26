package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"achieving-backend/internal/services"
	"achieving-backend/internal/repository"
 	"achieving-backend/internal/middleware"
)

func parseISODate(s string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, s); err == nil { return t, nil }
	return time.Parse("2006-01-02", s)
}

// RegisterSpendingRoutes wires spend-related endpoints into the router group
func RegisterSpendingRoutes(api *gin.RouterGroup, db *gorm.DB) {
	svc := services.NewSpendingService(repository.NewSpendingRepository(db))
	api.Use(middleware.AuthRequired())
	// Spending entries
	api.GET("/spending", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		month := c.Query("month")
		entries, err := svc.ListSpending(userID, month)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list spending"}); return }
		c.JSON(http.StatusOK, entries)
	})
	type CreateSpendingInput struct { Amount float64 `json:"amount" binding:"required"`; Category string `json:"category" binding:"required"`; Date string `json:"date" binding:"required"`; Note string `json:"note"` }
	api.POST("/spending", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		var input CreateSpendingInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		d, err := parseISODate(input.Date)
		if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"}); return }
		entry, err := svc.CreateSpending(userID, input.Amount, input.Category, d, input.Note)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create spending"}); return }
		c.JSON(http.StatusCreated, entry)
	})
	api.DELETE("/spending/:id", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		id := c.Param("id")
		rows, err := svc.DeleteSpending(userID, id)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete spending"}); return }
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "not found"}); return }
		c.Status(http.StatusNoContent)
	})
	// Earnings
	api.GET("/earnings", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		month := c.Query("month")
		items, err := svc.ListEarnings(userID, month)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list earnings"}); return }
		c.JSON(http.StatusOK, items)
	})
	type CreateEarningInput struct { Source string `json:"source" binding:"required"`; Amount float64 `json:"amount" binding:"required"`; Date string `json:"date" binding:"required"` }
	api.POST("/earnings", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		var input CreateEarningInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		d, err := parseISODate(input.Date)
		if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"}); return }
		item, err := svc.CreateEarning(userID, input.Source, input.Amount, d)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create earning"}); return }
		c.JSON(http.StatusCreated, item)
	})
	api.DELETE("/earnings/:id", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		id := c.Param("id")
		rows, err := svc.DeleteEarning(userID, id)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete earning"}); return }
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "not found"}); return }
		c.Status(http.StatusNoContent)
	})
	// Borrows
	api.GET("/borrows", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		month := c.Query("month")
		items, err := svc.ListBorrows(userID, month)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list borrows"}); return }
		c.JSON(http.StatusOK, items)
	})
	type CreateBorrowInput struct { From string `json:"from" binding:"required"`; Amount float64 `json:"amount" binding:"required"`; Date string `json:"date" binding:"required"` }
	api.POST("/borrows", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		var input CreateBorrowInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		d, err := parseISODate(input.Date)
		if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"}); return }
		item, err := svc.CreateBorrow(userID, input.From, input.Amount, d)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create borrow"}); return }
		c.JSON(http.StatusCreated, item)
	})
	type UpdateRepaymentInput struct { RepaidAmount float64 `json:"repaidAmount" binding:"required"`; RepaidDate string `json:"repaidDate" binding:"required"` }
	api.PATCH("/borrows/:id/repayment", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		id := c.Param("id")
		var input UpdateRepaymentInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		d, err := parseISODate(input.RepaidDate)
		if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date"}); return }
		rows, err := svc.UpdateBorrowRepayment(userID, id, input.RepaidAmount, d)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update borrow"}); return }
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "not found"}); return }
		c.Status(http.StatusNoContent)
	})
	api.DELETE("/borrows/:id", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		id := c.Param("id")
		rows, err := svc.DeleteBorrow(userID, id)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete borrow"}); return }
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "not found"}); return }
		c.Status(http.StatusNoContent)
	})
	// Categories
	api.GET("/categories", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		cats, err := svc.ListCategories(userID)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list categories"}); return }
		c.JSON(http.StatusOK, cats)
	})
	type CreateCategoryInput struct { Name string `json:"name" binding:"required"` }
	api.POST("/categories", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		var input CreateCategoryInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		cat, err := svc.CreateCategory(userID, input.Name)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"}); return }
		c.JSON(http.StatusCreated, cat)
	})
	api.DELETE("/categories/:name", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		name := c.Param("name")
		rows, err := svc.DeleteCategory(userID, name)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete category"}); return }
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "not found"}); return }
		c.Status(http.StatusNoContent)
	})
	// Plans
	api.GET("/plans", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		month := c.Query("month")
		plans, err := svc.ListPlans(userID, month)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list plans"}); return }
		c.JSON(http.StatusOK, plans)
	})
	type UpsertPlanInput struct { MonthKey string `json:"monthKey" binding:"required"`; Category string `json:"category" binding:"required"`; PlannedAmount float64 `json:"plannedAmount" binding:"required"` }
	api.POST("/plans", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		var input UpsertPlanInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		plan, updated, err := svc.UpsertPlan(userID, input.MonthKey, input.Category, input.PlannedAmount)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upsert plan"}); return }
		if updated { c.JSON(http.StatusOK, plan) } else { c.JSON(http.StatusCreated, plan) }
	})
	api.DELETE("/plans/:month/:category", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		month := c.Param("month")
		category := c.Param("category")
		rows, err := svc.DeletePlan(userID, month, category)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete plan"}); return }
		if rows == 0 { c.JSON(http.StatusNotFound, gin.H{"error": "not found"}); return }
		c.Status(http.StatusNoContent)
	})
	// Months
	api.GET("/months", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		months, err := svc.ListMonths(userID)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list months"}); return }
		c.JSON(http.StatusOK, months)
	})
	type CreateMonthInput struct { MonthKey string `json:"monthKey" binding:"required"` }
	api.POST("/months", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		var input CreateMonthInput
		if err := c.ShouldBindJSON(&input); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"}); return }
		if len(input.MonthKey) != 7 || input.MonthKey[4] != '-' { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid month key"}); return }
		m, err := svc.CreateMonthWithSeeds(userID, input.MonthKey)
		if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create month"}); return }
		c.JSON(http.StatusCreated, m)
	})
	api.GET("/months/:month/summary", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		mk := c.Param("month")
		spending, earnings, borrows, plans := svc.MonthSummary(userID, mk)
		c.JSON(http.StatusOK, gin.H{"monthKey": mk, "spending": spending, "earnings": earnings, "borrows": borrows, "plans": plans})
	})
	api.DELETE("/months/:month", func(c *gin.Context) {
		claimsAny, _ := c.Get("claims")
		claims := claimsAny.(map[string]interface{})
		userID := claims["sub"].(string)
		mk := c.Param("month")
		if err := svc.DeleteMonthCascade(userID, mk); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete month"}); return }
		c.Status(http.StatusNoContent)
	})
}