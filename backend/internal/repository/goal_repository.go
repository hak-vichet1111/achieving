package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"achieving-backend/internal/models"
)

type GoalRepository struct {
	db *gorm.DB
}

func NewGoalRepository(db *gorm.DB) *GoalRepository {
	return &GoalRepository{db: db}
}

func (r *GoalRepository) ListGoals(userID string) ([]models.Goal, error) {
	var goals []models.Goal
	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&goals).Error; err != nil { return nil, err }
	return goals, nil
}

func (r *GoalRepository) CreateGoal(userID, title, description, category string, saveFrequency string, duration *int, startDate, endDate, targetDate *time.Time, targetAmount *float64) (*models.Goal, error) {
	g := models.Goal{
		ID:            uuid.NewString(),
		UserID:        userID,
		Title:         title,
		Description:   description,
		Category:      category,
		SaveFrequency: saveFrequency,
		Duration:      duration,
		StartDate:     startDate,
		EndDate:       endDate,
		TargetDate:    targetDate,
		TargetAmount:  targetAmount,
		Status:        "active",
	}
	if err := r.db.Create(&g).Error; err != nil { return nil, err }
	return &g, nil
}

func (r *GoalRepository) UpdateGoal(userID, id string, updates map[string]interface{}) (int64, error) {
	res := r.db.Model(&models.Goal{}).Where("id = ? AND user_id = ?", id, userID).Updates(updates)
	return res.RowsAffected, res.Error
}

func (r *GoalRepository) FindGoal(userID, id string) (*models.Goal, error) {
	var g models.Goal
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&g).Error; err != nil { return nil, err }
	return &g, nil
}

func (r *GoalRepository) DeleteGoal(userID, id string) (int64, error) {
	res := r.db.Where("user_id = ?", userID).Delete(&models.Goal{}, "id = ?", id)
	return res.RowsAffected, res.Error
}