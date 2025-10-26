package models

import (
	"time"
	"gorm.io/gorm"
)

type SpendingEntry struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	Amount    float64   `json:"amount"`
	Category  string    `gorm:"index;size:64" json:"category"`
	Date      time.Time `json:"date"`
	MonthKey  string    `gorm:"index;size:7" json:"monthKey"`
	UserID    string    `gorm:"index;size:36" json:"userId"`
	User      User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Month     Month     `gorm:"foreignKey:UserID,MonthKey;references:UserID,MonthKey;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Note      string    `gorm:"type:text" json:"note"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

type EarningEntry struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	Source    string    `json:"source"`
	Amount    float64   `json:"amount"`
	Date      time.Time `json:"date"`
	MonthKey  string    `gorm:"index;size:7" json:"monthKey"`
	UserID    string    `gorm:"index;size:36" json:"userId"`
	User      User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Month     Month     `gorm:"foreignKey:UserID,MonthKey;references:UserID,MonthKey;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

type BorrowEntry struct {
	ID           string     `gorm:"primaryKey;size:36" json:"id"`
	From         string     `json:"from"`
	Amount       float64    `json:"amount"`
	Date         time.Time  `json:"date"`
	MonthKey     string     `gorm:"index;size:7" json:"monthKey"`
	UserID       string     `gorm:"index;size:36" json:"userId"`
	User         User       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Month        Month      `gorm:"foreignKey:UserID,MonthKey;references:UserID,MonthKey;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	RepaidAmount *float64   `json:"repaidAmount"`
	RepaidDate   *time.Time `json:"repaidDate"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"createdAt"`
}

type Category struct {
	UserID    string    `gorm:"primaryKey;size:36" json:"userId"`
	Name      string    `gorm:"primaryKey;size:64" json:"name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

type Plan struct {
	ID            string    `gorm:"primaryKey;size:36" json:"id"`
	UserID        string    `gorm:"uniqueIndex:idx_user_month_category;size:36" json:"userId"`
	MonthKey      string    `gorm:"uniqueIndex:idx_user_month_category;size:7" json:"monthKey"`
	Month         Month     `gorm:"foreignKey:UserID,MonthKey;references:UserID,MonthKey;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Category      string    `gorm:"uniqueIndex:idx_user_month_category;size:64" json:"category"`
	PlannedAmount float64   `json:"plannedAmount"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

type Month struct {
	UserID    string    `gorm:"primaryKey;size:36" json:"userId"`
	MonthKey  string    `gorm:"primaryKey;size:7" json:"monthKey"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func MigrateSpending(db *gorm.DB) {
	_ = db.AutoMigrate(&SpendingEntry{}, &EarningEntry{}, &BorrowEntry{}, &Category{}, &Plan{}, &Month{})
	// Backfill month_key for existing records
	db.Exec("UPDATE spending_entries SET month_key = DATE_FORMAT(date, '%Y-%m') WHERE month_key IS NULL OR month_key = ''")
	db.Exec("UPDATE earning_entries SET month_key = DATE_FORMAT(date, '%Y-%m') WHERE month_key IS NULL OR month_key = ''")
	db.Exec("UPDATE borrow_entries SET month_key = DATE_FORMAT(date, '%Y-%m') WHERE month_key IS NULL OR month_key = ''")
	// Ensure FK constraints exist (guarded)
	if !db.Migrator().HasConstraint(&SpendingEntry{}, "User") {
		_ = db.Migrator().CreateConstraint(&SpendingEntry{}, "User")
	}
	if !db.Migrator().HasConstraint(&EarningEntry{}, "User") {
		_ = db.Migrator().CreateConstraint(&EarningEntry{}, "User")
	}
	if !db.Migrator().HasConstraint(&BorrowEntry{}, "User") {
		_ = db.Migrator().CreateConstraint(&BorrowEntry{}, "User")
	}
	if !db.Migrator().HasConstraint(&SpendingEntry{}, "Month") {
		_ = db.Migrator().CreateConstraint(&SpendingEntry{}, "Month")
	}
	if !db.Migrator().HasConstraint(&EarningEntry{}, "Month") {
		_ = db.Migrator().CreateConstraint(&EarningEntry{}, "Month")
	}
	if !db.Migrator().HasConstraint(&BorrowEntry{}, "Month") {
		_ = db.Migrator().CreateConstraint(&BorrowEntry{}, "Month")
	}
	if !db.Migrator().HasConstraint(&Plan{}, "Month") {
		_ = db.Migrator().CreateConstraint(&Plan{}, "Month")
	}

	// --- Legacy schema alignment for production upgrades ---
	// Categories: ensure user_id column and composite primary key (user_id, name)
	var cnt int64
	db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'user_id'", "categories").Scan(&cnt)
	if cnt == 0 {
		db.Exec("ALTER TABLE `categories` ADD COLUMN `user_id` VARCHAR(36) NOT NULL AFTER `name`")
	}
	db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY' AND COLUMN_NAME = 'name'", "categories").Scan(&cnt)
	if cnt > 0 {
		// legacy PK on name only -> replace with (user_id, name)
		db.Exec("ALTER TABLE `categories` DROP PRIMARY KEY")
		db.Exec("ALTER TABLE `categories` ADD PRIMARY KEY (`user_id`, `name`)")
	}

	// Plans: ensure user_id column, field sizes, and unique index
	db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'user_id'", "plans").Scan(&cnt)
	if cnt == 0 {
		db.Exec("ALTER TABLE `plans` ADD COLUMN `user_id` VARCHAR(36) NOT NULL AFTER `id`")
	}
	// enforce column sizes
	db.Exec("ALTER TABLE `plans` MODIFY `month_key` VARCHAR(7) NOT NULL")
	db.Exec("ALTER TABLE `plans` MODIFY `category` VARCHAR(64) NOT NULL")
	// ensure unique index exists
	var idxCnt int64
	db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = 'idx_user_month_category'", "plans").Scan(&idxCnt)
	if idxCnt == 0 {
		db.Exec("CREATE UNIQUE INDEX `idx_user_month_category` ON `plans` (`user_id`, `month_key`, `category`)")
	}

	// Months: ensure user_id column, sizes, and composite primary key
	db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'months' AND COLUMN_NAME = 'user_id'").Scan(&cnt)
	if cnt == 0 {
		db.Exec("ALTER TABLE `months` ADD COLUMN `user_id` VARCHAR(36) NOT NULL AFTER `month_key`")
	}
	// enforce month_key size
	db.Exec("ALTER TABLE `months` MODIFY `month_key` VARCHAR(7) NOT NULL")
	// ensure composite PK includes both columns
	var pkColsCnt int64
	db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'months' AND CONSTRAINT_NAME = 'PRIMARY' AND COLUMN_NAME IN ('user_id','month_key')").Scan(&pkColsCnt)
	if pkColsCnt < 2 {
		db.Exec("ALTER TABLE `months` DROP PRIMARY KEY")
		db.Exec("ALTER TABLE `months` ADD PRIMARY KEY (`user_id`, `month_key`)")
	}

	// Entries: enforce sizes for legacy schemas
	db.Exec("ALTER TABLE `spending_entries` MODIFY `id` VARCHAR(36) NOT NULL")
	db.Exec("ALTER TABLE `spending_entries` MODIFY `user_id` VARCHAR(36) NOT NULL")
	db.Exec("ALTER TABLE `spending_entries` MODIFY `month_key` VARCHAR(7) NOT NULL")
	db.Exec("ALTER TABLE `spending_entries` MODIFY `category` VARCHAR(64) NOT NULL")

	db.Exec("ALTER TABLE `earning_entries` MODIFY `id` VARCHAR(36) NOT NULL")
	db.Exec("ALTER TABLE `earning_entries` MODIFY `user_id` VARCHAR(36) NOT NULL")
	db.Exec("ALTER TABLE `earning_entries` MODIFY `month_key` VARCHAR(7) NOT NULL")

	db.Exec("ALTER TABLE `borrow_entries` MODIFY `id` VARCHAR(36) NOT NULL")
	db.Exec("ALTER TABLE `borrow_entries` MODIFY `user_id` VARCHAR(36) NOT NULL")
	db.Exec("ALTER TABLE `borrow_entries` MODIFY `month_key` VARCHAR(7) NOT NULL")
}