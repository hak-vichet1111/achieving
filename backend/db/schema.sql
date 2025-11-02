-- Achieving App canonical MySQL schema
-- Engine: InnoDB, Charset: utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

-- Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Months (composite PK)
CREATE TABLE IF NOT EXISTS `months` (
  `user_id` VARCHAR(36) NOT NULL,
  `month_key` VARCHAR(7) NOT NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`user_id`, `month_key`),
  CONSTRAINT `fk_months_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories (composite PK)
CREATE TABLE IF NOT EXISTS `categories` (
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`user_id`, `name`),
  CONSTRAINT `fk_categories_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Plans (unique across user+month+category)
CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `month_key` VARCHAR(7) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `planned_amount` DOUBLE NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_month_category` (`user_id`, `month_key`, `category`),
  CONSTRAINT `fk_plans_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_plans_month`
    FOREIGN KEY (`user_id`, `month_key`) REFERENCES `months`(`user_id`, `month_key`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Spending entries
CREATE TABLE IF NOT EXISTS `spending_entries` (
  `id` VARCHAR(36) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `date` DATETIME NOT NULL,
  `month_key` VARCHAR(7) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_spending_user` (`user_id`),
  KEY `idx_spending_month` (`month_key`),
  KEY `idx_spending_user_month` (`user_id`, `month_key`),
  KEY `idx_spending_category` (`category`),
  CONSTRAINT `fk_spending_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_spending_month`
    FOREIGN KEY (`user_id`, `month_key`) REFERENCES `months`(`user_id`, `month_key`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Earning entries
CREATE TABLE IF NOT EXISTS `earning_entries` (
  `id` VARCHAR(36) NOT NULL,
  `source` VARCHAR(255) NULL,
  `amount` DOUBLE NOT NULL,
  `date` DATETIME NOT NULL,
  `month_key` VARCHAR(7) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_earning_user` (`user_id`),
  KEY `idx_earning_month` (`month_key`),
  KEY `idx_earning_user_month` (`user_id`, `month_key`),
  CONSTRAINT `fk_earning_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_earning_month`
    FOREIGN KEY (`user_id`, `month_key`) REFERENCES `months`(`user_id`, `month_key`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Borrow entries
CREATE TABLE IF NOT EXISTS `borrow_entries` (
  `id` VARCHAR(36) NOT NULL,
  `from` VARCHAR(255) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `date` DATETIME NOT NULL,
  `month_key` VARCHAR(7) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `repaid_amount` DOUBLE NULL,
  `repaid_date` DATETIME NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_borrow_user` (`user_id`),
  KEY `idx_borrow_month` (`month_key`),
  KEY `idx_borrow_user_month` (`user_id`, `month_key`),
  CONSTRAINT `fk_borrow_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_borrow_month`
    FOREIGN KEY (`user_id`, `month_key`) REFERENCES `months`(`user_id`, `month_key`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Goals
CREATE TABLE IF NOT EXISTS `goals` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(255) NULL,
  `save_frequency` VARCHAR(255) NULL,
  `duration` INT NULL,
  `start_date` DATETIME NULL,
  `end_date` DATETIME NULL,
  `target_date` DATETIME NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'not_started',
  `created_at` DATETIME(3) NULL,
  `target_amount` DOUBLE NULL,
  `current_amount` DOUBLE NULL,
  PRIMARY KEY (`id`),
  KEY `idx_goals_user` (`user_id`),
  CONSTRAINT `fk_goals_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;