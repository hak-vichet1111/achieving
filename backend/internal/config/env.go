package config

import (
	"os"

	"github.com/joho/godotenv"
)

// LoadEnv loads .env if present
func LoadEnv() {
	_ = godotenv.Load()
}

// MustGetEnv returns env var or fallback if empty
func MustGetEnv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}