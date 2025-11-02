package models

import (
    "log"
    "os"
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
    // Ensure table exists (guarded)
    if os.Getenv("DISABLE_LEGACY_MIGRATIONS") == "true" {
        log.Println("AutoMigrate disabled; skipping users table migration")
    } else {
        _ = db.AutoMigrate(&User{})
    }
	// Verify the column type of `users.id`; fix if it's integer from legacy schema
	var dataType string
	db.Raw("SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'id'", "users").Scan(&dataType)
    if os.Getenv("DISABLE_LEGACY_MIGRATIONS") == "true" {
        log.Println("Legacy migrations disabled; skipping users.id type change")
    } else if dataType != "varchar" {
        // Convert id to VARCHAR(36) to store UUIDs
        db.Exec("ALTER TABLE `users` MODIFY COLUMN `id` VARCHAR(36) NOT NULL")
        // Re-apply migration to ensure constraints (primary key, indexes)
        _ = db.AutoMigrate(&User{})
    }
}