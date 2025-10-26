package services

import (
	"time"
	"achieving-backend/internal/models"
	"achieving-backend/internal/repository"
)

type SpendingService struct {
	repo *repository.SpendingRepository
}

func NewSpendingService(repo *repository.SpendingRepository) *SpendingService {
	return &SpendingService{repo: repo}
}

func (s *SpendingService) EnsureMonth(userID, monthKey string) error { return s.repo.EnsureMonth(userID, monthKey) }

func (s *SpendingService) ListSpending(userID, monthKey string) ([]models.SpendingEntry, error) { return s.repo.ListSpending(userID, monthKey) }
func (s *SpendingService) CreateSpending(userID string, amount float64, category string, date time.Time, note string) (*models.SpendingEntry, error) {
	return s.repo.CreateSpending(userID, amount, category, date, note)
}
func (s *SpendingService) DeleteSpending(userID, id string) (int64, error) { return s.repo.DeleteSpending(userID, id) }

func (s *SpendingService) ListEarnings(userID, monthKey string) ([]models.EarningEntry, error) { return s.repo.ListEarnings(userID, monthKey) }
func (s *SpendingService) CreateEarning(userID, source string, amount float64, date time.Time) (*models.EarningEntry, error) {
	return s.repo.CreateEarning(userID, source, amount, date)
}
func (s *SpendingService) DeleteEarning(userID, id string) (int64, error) { return s.repo.DeleteEarning(userID, id) }

func (s *SpendingService) ListBorrows(userID, monthKey string) ([]models.BorrowEntry, error) { return s.repo.ListBorrows(userID, monthKey) }
func (s *SpendingService) CreateBorrow(userID, from string, amount float64, date time.Time) (*models.BorrowEntry, error) {
	return s.repo.CreateBorrow(userID, from, amount, date)
}
func (s *SpendingService) UpdateBorrowRepayment(userID, id string, repaidAmount float64, repaidDate time.Time) (int64, error) {
	return s.repo.UpdateBorrowRepayment(userID, id, repaidAmount, repaidDate)
}
func (s *SpendingService) DeleteBorrow(userID, id string) (int64, error) { return s.repo.DeleteBorrow(userID, id) }

func (s *SpendingService) ListCategories(userID string) ([]models.Category, error) { return s.repo.ListCategories(userID) }
func (s *SpendingService) CreateCategory(userID, name string) (*models.Category, error) { return s.repo.CreateCategory(userID, name) }
func (s *SpendingService) DeleteCategory(userID, name string) (int64, error) { return s.repo.DeleteCategory(userID, name) }

func (s *SpendingService) ListPlans(userID, monthKey string) ([]models.Plan, error) { return s.repo.ListPlans(userID, monthKey) }
func (s *SpendingService) UpsertPlan(userID, monthKey, category string, plannedAmount float64) (*models.Plan, bool, error) {
	return s.repo.UpsertPlan(userID, monthKey, category, plannedAmount)
}
func (s *SpendingService) DeletePlan(userID, monthKey, category string) (int64, error) { return s.repo.DeletePlan(userID, monthKey, category) }

func (s *SpendingService) ListMonths(userID string) ([]models.Month, error) { return s.repo.ListMonths(userID) }
func (s *SpendingService) CreateMonthWithSeeds(userID, monthKey string) (*models.Month, error) { return s.repo.CreateMonthWithSeeds(userID, monthKey) }
func (s *SpendingService) MonthSummary(userID, monthKey string) ([]models.SpendingEntry, []models.EarningEntry, []models.BorrowEntry, []models.Plan) {
	return s.repo.MonthSummary(userID, monthKey)
}
func (s *SpendingService) DeleteMonthCascade(userID, monthKey string) error { return s.repo.DeleteMonthCascade(userID, monthKey) }