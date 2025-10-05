package routers

import (
	"fmt"

	"github.com/gin-gonic/gin"
	openbao "github.com/openbao/openbao/api/v2"

	"log"
	"net/http"
	"orencode/src/models"
	"os"

	"gorm.io/gorm"
)

func OpenBao(r *gin.Engine, db *gorm.DB) {
	// TODO: Распределить права

	config := openbao.DefaultConfig()
	config.Address = "http://127.0.0.1:8091/bao"

	client, err := openbao.NewClient(config)
	if err != nil {
		log.Fatalf("unable to initialize OpenBao client: %v", err)
	}

	err = authUserPass(client)
	if err != nil {
		log.Fatalf("unable to authenticate with userpass: %v", err)
	}

	r.GET("/key/list", func(c *gin.Context) {
		var requests []models.Request

		creatorID := "058f1f46-8a10-4887-a185-29938ab8c3cb"

		if err := db.Where("creator = ?", creatorID).Find(&requests).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, requests)
	})

	// GET /key/get?username=testuser&secret_name=mysecret
	r.GET("/key/get", func(c *gin.Context) {
		username := c.Query("username")
		secretName := c.Query("secret_name")

		if username == "" || secretName == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "missing query params: username and secret_name are required",
			})
			return
		}

		path := fmt.Sprintf("secrets/data/users/%s/%s", username, secretName)

		secret, err := client.Logical().Read(path)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed to read key",
				"details": err.Error(),
			})
			return
		}

		if secret == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "key not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"username":    username,
			"secret_name": secretName,
			"path":        path,
			"data":        secret.Data,
			"wrap":        secret.WrapInfo,
			"lease":       secret.LeaseDuration,
			"renew":       secret.Renewable,
			"auth":        secret.Auth,
		})
	})

	// POST /key/set?username=testuser&secret_name=mysecret
	r.POST("/key/set", func(c *gin.Context) {
		username := c.Query("username")
		secretName := c.Query("secret_name")

		if username == "" || secretName == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "missing query params: username and secret_name are required",
			})
			return
		}

		var secretData map[string]interface{}
		if err := c.BindJSON(&secretData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		path := fmt.Sprintf("secrets/data/users/%s/%s", username, secretName)

		data := map[string]interface{}{
			"data": secretData,
		}

		_, err := client.Logical().Write(path, data)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed to write key",
				"details": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":     "Secret saved successfully",
			"username":    username,
			"secret_name": secretName,
			"path":        path,
		})
	})

	r.GET("/auth/status", func(c *gin.Context) {
		secret, err := client.Logical().Read("auth/token/lookup-self")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"authenticated": false,
				"error":         err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"authenticated": true,
			"token_info":    secret.Data,
		})
	})
}

func authUserPass(client *openbao.Client) error {

	username := os.Getenv("OPENBAO_USERNAME")
	password := os.Getenv("OPENBAO_PASSWORD")

	if username == "" || password == "" {
		return fmt.Errorf("OPENBAO_USERNAME and OPENBAO_PASSWORD environment variables are required")
	}

	secret, err := client.Logical().Write("auth/userpass/login/"+username, map[string]interface{}{
		"password": password,
	})
	if err != nil {
		return err
	}
	if secret == nil || secret.Auth == nil {
		return fmt.Errorf("authentication failed: no auth info returned")
	}

	// токен
	client.SetToken(secret.Auth.ClientToken)
	log.Printf("Successfully authenticated as user: %s", username)
	return nil
}
