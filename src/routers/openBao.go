package routers

import (
	"github.com/gin-gonic/gin"
	openbao "github.com/openbao/openbao/api/v2"
	"gorm.io/gorm"
	"log"
	"net/http"
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

	//  GET /key/get?path=secret/data/mykey
	r.GET("/key/get", func(c *gin.Context) {
		path := c.Query("path")
		if path == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing query param: path"})
			return
		}

		secret, err := client.Logical().Read(path)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read key", "details": err.Error()})
			return
		}

		if secret == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "key not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"path":   path,
			"data":   secret.Data,
			"wrap":   secret.WrapInfo,
			"lease":  secret.LeaseDuration,
			"renew":  secret.Renewable,
			"auth":   secret.Auth,
		})
	})
}
