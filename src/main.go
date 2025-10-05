package main

import (
	"orencode/src/routers"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"orencode/src/models"

	"github.com/gookit/slog"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {

	slog.Info("Starting application initialization...")

	slog.Debug("Loading environment variables from .env file")
	if err := godotenv.Load(); err != nil {
		slog.Warnf("Failed to load .env file: %v", err)
	} else {
		slog.Info("Environment variables loaded successfully")
	}

	dsn := os.Getenv("DATABASE_DSN")
	if dsn == "" {
		slog.Fatal("DATABASE_DSN environment variable is required but not set")
	}
	slog.Debug("DATABASE_DSN retrieved from environment")

	slog.Info("Connecting to database...")
	start := time.Now()
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		slog.Fatalf("Failed to connect to database: %v", err)
	}
	slog.Infof("Database connection established in %v", time.Since(start))
	slog.Info("Running database migrations...")
	if err := db.AutoMigrate(&models.Request{}); err != nil {
		slog.Fatalf("Database migration failed: %v", err)
	}
	slog.Info("Database migrations completed successfully")

	slog.Info("Initializing Gin server...")
	r := gin.Default()

	slog.Debug("Configuring CORS middleware")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))
	slog.Info("CORS middleware configured")

	slog.Info("Registering application routes...")
	routers.ValidationKeycloak(r)
	slog.Debug("Keycloak validation routes registered")

	routers.CreateReq(r, db)
	slog.Debug("Request creation routes registered")

	routers.OpenBao(r, db)
	slog.Debug("OpenBao routes registered")

	slog.Info("All routes registered successfully")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		slog.Warnf("PORT environment variable not set, using default: %s", port)
	} else {
		slog.Infof("Server will start on port: %s", port)
	}

	slog.Infof("Server starting at :%s", port)
	if err := r.Run(":" + port); err != nil {
		slog.Fatalf("Failed to start server: %v", err)
	}
}
