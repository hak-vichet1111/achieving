package services

import (
	"time"
	"achieving-backend/internal/models"
	"achieving-backend/internal/repository"
)

type GoalService struct {
	repo *repository.GoalRepository
}

func NewGoalService(repo *repository.GoalRepository) *GoalService {
	return &GoalService{repo: repo}
}

func (s *GoalService) ListGoals(userID string) ([]models.Goal, error) {
	return s.repo.ListGoals(userID)
}

func (s *GoalService) CreateGoal(userID, title, description, category, saveFrequency string, duration *int, startDate, endDate, targetDate *time.Time, targetAmount *float64) (*models.Goal, error) {
	return s.repo.CreateGoal(userID, title, description, category, saveFrequency, duration, startDate, endDate, targetDate, targetAmount)
}

func (s *GoalService) UpdateGoal(userID, id string, updates map[string]interface{}) (int64, error) {
	return s.repo.UpdateGoal(userID, id, updates)
}

func (s *GoalService) FindGoal(userID, id string) (*models.Goal, error) {
	return s.repo.FindGoal(userID, id)
}

func (s *GoalService) DeleteGoal(userID, id string) (int64, error) {
	return s.repo.DeleteGoal(userID, id)
}