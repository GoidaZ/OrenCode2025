package routers

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"orencode/src/models"
)

func CreateReq(r *gin.Engine) {
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

	r.POST("/requests", func(c *gin.Context) {
		var req models.Request
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Title == "" || req.Creator == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and creator are required"})
			return
		}

		if err := db.Create(&req).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save request"})
			return
		}

		c.JSON(http.StatusCreated, req)
	})
}
