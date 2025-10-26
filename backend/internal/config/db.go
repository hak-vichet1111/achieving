package config

import (
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// ConnectDB connects to MySQL using env vars
func ConnectDB() *gorm.DB {
	host := MustGetEnv("DB_HOST", "localhost")
	port := MustGetEnv("DB_PORT", "3306")
	user := MustGetEnv("DB_USER", "root")
	pass := MustGetEnv("DB_PASS", "")
	name := MustGetEnv("DB_NAME", "achieving_db")
	// MySQL DSN
	dsn := user + ":" + pass + "@tcp(" + host + ":" + port + ")/" + name + "?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	return db
}