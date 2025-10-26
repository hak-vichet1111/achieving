package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"achieving-backend/internal/models"
)

type SpendingRepository struct {
	db *gorm.DB
}

func NewSpendingRepository(db *gorm.DB) *SpendingRepository {
	return &SpendingRepository{db: db}
}

func (r *SpendingRepository) EnsureMonth(userID, monthKey string) error {
	var m models.Month
	if err := r.db.Where("user_id = ? AND month_key = ?", userID, monthKey).First(&m).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.db.Create(&models.Month{UserID: userID, MonthKey: monthKey}).Error
		}
		return err
	}
	return nil
}

func (r *SpendingRepository) ListSpending(userID, monthKey string) ([]models.SpendingEntry, error) {
	var entries []models.SpendingEntry
	q := r.db.Where("user_id = ?", userID).Order("date desc")
	if monthKey != "" { q = q.Where("month_key = ?", monthKey) }
	if err := q.Find(&entries).Error; err != nil { return nil, err }
	return entries, nil
}

func (r *SpendingRepository) CreateSpending(userID string, amount float64, category string, date time.Time, note string) (*models.SpendingEntry, error) {
	mk := date.Format("2006-01")
	_ = r.EnsureMonth(userID, mk)
	entry := models.SpendingEntry{ID: uuid.NewString(), UserID: userID, Amount: amount, Category: category, Date: date, MonthKey: mk, Note: note}
	if err := r.db.Create(&entry).Error; err != nil { return nil, err }
	return &entry, nil
}

func (r *SpendingRepository) DeleteSpending(userID, id string) (int64, error) {
	res := r.db.Where("user_id = ?", userID).Delete(&models.SpendingEntry{}, "id = ?", id)
	return res.RowsAffected, res.Error
}

func (r *SpendingRepository) ListEarnings(userID, monthKey string) ([]models.EarningEntry, error) {
	var items []models.EarningEntry
	q := r.db.Where("user_id = ?", userID).Order("date desc")
	if monthKey != "" { q = q.Where("month_key = ?", monthKey) }
	if err := q.Find(&items).Error; err != nil { return nil, err }
	return items, nil
}

func (r *SpendingRepository) CreateEarning(userID, source string, amount float64, date time.Time) (*models.EarningEntry, error) {
	mk := date.Format("2006-01")
	_ = r.EnsureMonth(userID, mk)
	item := models.EarningEntry{ID: uuid.NewString(), UserID: userID, Source: source, Amount: amount, Date: date, MonthKey: mk}
	if err := r.db.Create(&item).Error; err != nil { return nil, err }
	return &item, nil
}

func (r *SpendingRepository) DeleteEarning(userID, id string) (int64, error) {
	res := r.db.Where("user_id = ?", userID).Delete(&models.EarningEntry{}, "id = ?", id)
	return res.RowsAffected, res.Error
}

func (r *SpendingRepository) ListBorrows(userID, monthKey string) ([]models.BorrowEntry, error) {
	var items []models.BorrowEntry
	q := r.db.Where("user_id = ?", userID).Order("date desc")
	if monthKey != "" { q = q.Where("month_key = ?", monthKey) }
	if err := q.Find(&items).Error; err != nil { return nil, err }
	return items, nil
}

func (r *SpendingRepository) CreateBorrow(userID, from string, amount float64, date time.Time) (*models.BorrowEntry, error) {
	mk := date.Format("2006-01")
	_ = r.EnsureMonth(userID, mk)
	item := models.BorrowEntry{ID: uuid.NewString(), UserID: userID, From: from, Amount: amount, Date: date, MonthKey: mk}
	if err := r.db.Create(&item).Error; err != nil { return nil, err }
	return &item, nil
}

func (r *SpendingRepository) UpdateBorrowRepayment(userID, id string, repaidAmount float64, repaidDate time.Time) (int64, error) {
	updates := map[string]interface{}{"repaid_amount": repaidAmount, "repaid_date": repaidDate}
	res := r.db.Model(&models.BorrowEntry{}).Where("id = ? AND user_id = ?", id, userID).Updates(updates)
	return res.RowsAffected, res.Error
}

func (r *SpendingRepository) DeleteBorrow(userID, id string) (int64, error) {
	res := r.db.Where("user_id = ?", userID).Delete(&models.BorrowEntry{}, "id = ?", id)
	return res.RowsAffected, res.Error
}

func (r *SpendingRepository) ListCategories(userID string) ([]models.Category, error) {
	var cats []models.Category
	if err := r.db.Where("user_id = ?", userID).Order("name asc").Find(&cats).Error; err != nil { return nil, err }
	return cats, nil
}

func (r *SpendingRepository) CreateCategory(userID, name string) (*models.Category, error) {
	cat := models.Category{UserID: userID, Name: name}
	if err := r.db.Create(&cat).Error; err != nil { return nil, err }
	return &cat, nil
}

func (r *SpendingRepository) DeleteCategory(userID, name string) (int64, error) {
	res := r.db.Delete(&models.Category{}, "user_id = ? AND name = ?", userID, name)
	return res.RowsAffected, res.Error
}

func (r *SpendingRepository) ListPlans(userID, monthKey string) ([]models.Plan, error) {
	var plans []models.Plan
	q := r.db.Where("user_id = ?", userID)
	if monthKey == "" {
		if err := q.Order("month_key desc, category asc").Find(&plans).Error; err != nil { return nil, err }
		return plans, nil
	}
	if err := q.Where("month_key = ?", monthKey).Order("category asc").Find(&plans).Error; err != nil { return nil, err }
	return plans, nil
}

func (r *SpendingRepository) UpsertPlan(userID, monthKey, category string, plannedAmount float64) (*models.Plan, bool, error) {
	_ = r.EnsureMonth(userID, monthKey)
	var existing models.Plan
	if err := r.db.Where("user_id = ? AND month_key = ? AND category = ?", userID, monthKey, category).First(&existing).Error; err == nil {
		existing.PlannedAmount = plannedAmount
		if err2 := r.db.Save(&existing).Error; err2 != nil { return nil, false, err2 }
		return &existing, true, nil
	}
	p := models.Plan{ID: uuid.NewString(), UserID: userID, MonthKey: monthKey, Category: category, PlannedAmount: plannedAmount}
	if err := r.db.Create(&p).Error; err != nil { return nil, false, err }
	return &p, false, nil
}

func (r *SpendingRepository) DeletePlan(userID, monthKey, category string) (int64, error) {
	res := r.db.Delete(&models.Plan{}, "user_id = ? AND month_key = ? AND category = ?", userID, monthKey, category)
	return res.RowsAffected, res.Error
}

func (r *SpendingRepository) ListMonths(userID string) ([]models.Month, error) {
	var months []models.Month
	if err := r.db.Where("user_id = ?", userID).Order("month_key desc").Find(&months).Error; err != nil { return nil, err }
	return months, nil
}

func (r *SpendingRepository) CreateMonthWithSeeds(userID, monthKey string) (*models.Month, error) {
	// Transaction: create month and seed plans for all categories for this user
	tx := r.db.Begin()
	if tx.Error != nil { return nil, tx.Error }
	m := models.Month{UserID: userID, MonthKey: monthKey}
	if err := tx.Create(&m).Error; err != nil { tx.Rollback(); return nil, err }
	var cats []models.Category
	if err := tx.Where("user_id = ?", userID).Order("name asc").Find(&cats).Error; err == nil {
		for _, cat := range cats {
			var existing models.Plan
			if err := tx.Where("user_id = ? AND month_key = ? AND category = ?", userID, monthKey, cat.Name).First(&existing).Error; err == gorm.ErrRecordNotFound {
				_ = tx.Create(&models.Plan{ID: uuid.NewString(), UserID: userID, MonthKey: monthKey, Category: cat.Name, PlannedAmount: 0}).Error
			}
		}
	}
	if err := tx.Commit().Error; err != nil { return nil, err }
	return &m, nil
}

func (r *SpendingRepository) MonthSummary(userID, monthKey string) ([]models.SpendingEntry, []models.EarningEntry, []models.BorrowEntry, []models.Plan) {
	var spending []models.SpendingEntry
	var earnings []models.EarningEntry
	var borrows []models.BorrowEntry
	var plans []models.Plan
	_ = r.db.Where("user_id = ? AND month_key = ?", userID, monthKey).Order("date desc").Find(&spending).Error
	_ = r.db.Where("user_id = ? AND month_key = ?", userID, monthKey).Order("date desc").Find(&earnings).Error
	_ = r.db.Where("user_id = ? AND month_key = ?", userID, monthKey).Order("date desc").Find(&borrows).Error
	_ = r.db.Where("user_id = ? AND month_key = ?", userID, monthKey).Order("category asc").Find(&plans).Error
	return spending, earnings, borrows, plans
}

func (r *SpendingRepository) DeleteMonthCascade(userID, monthKey string) error {
	tx := r.db.Begin()
	if tx.Error != nil { return tx.Error }
	if err := tx.Where("user_id = ? AND month_key = ?", userID, monthKey).Delete(&models.SpendingEntry{}).Error; err != nil { tx.Rollback(); return err }
	if err := tx.Where("user_id = ? AND month_key = ?", userID, monthKey).Delete(&models.EarningEntry{}).Error; err != nil { tx.Rollback(); return err }
	if err := tx.Where("user_id = ? AND month_key = ?", userID, monthKey).Delete(&models.BorrowEntry{}).Error; err != nil { tx.Rollback(); return err }
	if err := tx.Delete(&models.Plan{}, "user_id = ? AND month_key = ?", userID, monthKey).Error; err != nil { tx.Rollback(); return err }
	if err := tx.Delete(&models.Month{}, "user_id = ? AND month_key = ?", userID, monthKey).Error; err != nil { tx.Rollback(); return err }
	return tx.Commit().Error
}