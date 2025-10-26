package models

import (
	"time"
	"gorm.io/gorm"
)

// Goal represents the goal entity aligned with the frontend type
// Fields optional in frontend are pointers here
// JSON field names match the TS types
type Goal struct {
	ID            string     `gorm:"primaryKey;size:36" json:"id"`
	UserID        string     `gorm:"index;size:36" json:"userId"`
	User          User       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
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

// MigrateGoals performs auto-migration for the Goal model
func MigrateGoals(db *gorm.DB) {
	_ = db.AutoMigrate(&Goal{})
	// Ensure column sizes for legacy schemas
	db.Exec("ALTER TABLE `goals` MODIFY `id` VARCHAR(36) NOT NULL")
	db.Exec("ALTER TABLE `goals` MODIFY `user_id` VARCHAR(36)")
	// Add FK only if missing to avoid duplicate constraint errors
	if !db.Migrator().HasConstraint(&Goal{}, "User") {
		_ = db.Migrator().CreateConstraint(&Goal{}, "User")
	}
}