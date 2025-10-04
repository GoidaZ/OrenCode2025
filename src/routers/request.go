package routers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"orencode/src/models"
	"gorm.io/gorm"
)

func CreateReq(r *gin.Engine, db *gorm.DB) {
	// TODO: Распределить права

	r.POST("/request/create", func(c *gin.Context) {
		// TODO: Получать Creator из авторизации
		var req models.Request
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Key == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "key are required"})
			return
		}

		if err := db.Create(&req).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save request"})
			return
		}

		c.JSON(http.StatusCreated, req)
	})

	r.GET("/request/list", func(c *gin.Context) {
		var requests []models.Request
		if err := db.Find(&requests).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch requests"})
			return
		}
		c.JSON(http.StatusOK, requests)
	})
}
