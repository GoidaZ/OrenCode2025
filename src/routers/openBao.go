package routers

import (
	"github.com/gin-gonic/gin"
	openbao "github.com/openbao/openbao/api/v2"
	"gorm.io/gorm"
	"log"
	"net/http"
	"orencode/src/models"
)

func OpenBao(r *gin.Engine, db *gorm.DB) {
	// TODO: Распределить права

	config := openbao.DefaultConfig()
	config.Address = "http://127.0.0.1:1337" // TODO: Go .env

	client, err := openbao.NewClient(config)
	if err != nil {
		log.Fatalf("unable to initialize OpenBao client: %v", err)
	}

	client.SetToken("foobar") // TODO: Go .env

	r.GET("/key/list", func(c *gin.Context) {
		var requests []models.Request

		creatorID := "058f1f46-8a10-4887-a185-29938ab8c3cb"

		if err := db.Where("creator = ?", creatorID).Find(&requests).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, requests)
	})

	//  GET /key/id?path=mykey
	r.GET("/key/get", func(c *gin.Context) {
		path := c.Query("id")
		if path == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing query param: path"})
			return
		}

		secret, err := client.Logical().Read("secret/data/" + path)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read key", "details": err.Error()})
			return
		}

		if secret == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "key not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"path":  path,
			"data":  secret.Data,
			"wrap":  secret.WrapInfo,
			"lease": secret.LeaseDuration,
			"renew": secret.Renewable,
			"auth":  secret.Auth,
		})
	})
}
