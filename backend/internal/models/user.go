package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents an authenticated user
// Keep tags minimal and aligned with API responses
// PasswordHash is omitted from JSON
type User struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;size:255" json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func MigrateAuth(db *gorm.DB) {
	// Ensure table exists
	_ = db.AutoMigrate(&User{})
	// Verify the column type of `users.id`; fix if it's integer from legacy schema
	var dataType string
	db.Raw("SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'id'", "users").Scan(&dataType)
	if dataType != "varchar" {
		// Convert id to VARCHAR(36) to store UUIDs
		db.Exec("ALTER TABLE `users` MODIFY COLUMN `id` VARCHAR(36) NOT NULL")
		// Re-apply migration to ensure constraints (primary key, indexes)
		_ = db.AutoMigrate(&User{})
	}
}