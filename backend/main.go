package main

import (
	"log"

	"achieving-backend/internal/config"
	"achieving-backend/internal/models"
	"achieving-backend/internal/routes"
)

func main() {
	// Load environment and connect DB
	config.LoadEnv()
	db := config.ConnectDB()

	// Migrations
	models.MigrateGoals(db)
	models.MigrateSpending(db)
	models.MigrateAuth(db)

	// Router
	r := routes.SetupRouter(db)
	port := config.MustGetEnv("PORT", "8081")
	log.Printf("server listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}