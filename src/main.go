package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"log"
	"orencode/src/routers"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"orencode/src/models"
)

func main() {
	godotenv.Load()

	dsn := os.Getenv("DATABASE_DSN")
	if dsn == "" {
		log.Fatal("DATABASE_DSN env is required")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.Request{}); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	r := gin.Default()

	// TODO: Go .env
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	routers.ValidationKeycloak(r)
	routers.CreateReq(r, db)
	routers.OpenBao(r, db)

	log.Println("Server started at :8080")
	if err := r.Run(":" + os.Getenv("PORT")); err != nil {
		log.Fatal(err)
	}
}
