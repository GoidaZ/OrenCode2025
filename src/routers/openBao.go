package routers

import (
	"fmt"
	"gorm.io/gorm"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	openbao "github.com/openbao/openbao/api/v2"
)

func OpenBao(r *gin.Engine, db *gorm.DB) {
	config := openbao.DefaultConfig()
	config.Address = "http://openbao:8200/"

	client, err := openbao.NewClient(config)
	if err != nil {
		log.Fatalf("unable to initialize OpenBao client: %v", err)
	}

	username := os.Getenv("OPENBAO_USERNAME")
	password := os.Getenv("OPENBAO_PASSWORD")
	if username == "" || password == "" {
		log.Fatalf("OPENBAO_USERNAME and OPENBAO_PASSWORD are required")
	}

	if err := authUserPass(client, username, password); err != nil {
		log.Fatalf("unable to authenticate: %v", err)
	}

	go startTokenRefresher(client, username, password, 50*time.Minute)

	r.GET("/secret/list", func(c *gin.Context) {
		userClaims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user := userClaims.(UserClaims)
		userID := user.Sub

		path := fmt.Sprintf("secrets/detailed-metadata/users/%s/", userID)
		secret, err := client.Logical().List(path)
		if err != nil || secret == nil || secret.Data == nil {
			c.JSON(http.StatusOK, []interface{}{})
			return
		}

		keyInfoRaw, ok := secret.Data["key_info"].(map[string]interface{})
		if !ok {
			c.JSON(http.StatusOK, []interface{}{})
			return
		}

		var keys []map[string]interface{}
		for keyID, info := range keyInfoRaw {
			infoMap := info.(map[string]interface{})
			customMeta := map[string]interface{}{}
			if cm, exists := infoMap["custom_metadata"].(map[string]interface{}); exists {
				customMeta = cm
			}

			var expireAt *string
			if dt, exists := infoMap["delete_version_after"].(string); exists {
				if dt == "0s" {
					expireAt = nil
				} else if dur, err := time.ParseDuration(dt); err == nil {
					t := time.Now().Add(dur).UTC().Format(time.RFC3339)
					expireAt = &t
				} else {
					expireAt = &dt
				}
			} else {
				expireAt = nil
			}

			keys = append(keys, map[string]interface{}{
				"id":          keyID,
				"description": customMeta["description"],
				"expire_at":   expireAt,
			})
		}

		c.JSON(http.StatusOK, keys)
	})

	r.GET("/secret/:name", func(c *gin.Context) {
		userClaims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user := userClaims.(UserClaims)
		userID := user.Sub
		keyID := c.Param("name")

		path := fmt.Sprintf("secrets/data/users/%s/%s", userID, keyID)
		secret, err := client.Logical().Read(path)
		if err != nil || secret == nil || secret.Data == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "key not found"})
			return
		}

		data, ok := secret.Data["data"].(map[string]interface{})
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid key data"})
			return
		}

		c.JSON(http.StatusOK, data)
	})

	r.POST("/secret/:name", func(c *gin.Context) {
		userClaims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user := userClaims.(UserClaims)
		userID := user.Sub
		keyID := c.Param("name")

		var req struct {
			Data     map[string]interface{} `json:"data"`
			Metadata map[string]interface{} `json:"metadata"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		dataPath := fmt.Sprintf("secrets/data/users/%s/%s", userID, keyID)
		if _, err := client.Logical().Write(dataPath, map[string]interface{}{"data": req.Data}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save key data"})
			return
		}

		if req.Metadata != nil {
			metaPath := fmt.Sprintf("secrets/metadata/users/%s/%s", userID, keyID)
			if _, err := client.Logical().Write(metaPath, req.Metadata); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save key metadata"})
				return
			}
		}

		c.Status(http.StatusNoContent)
	})

	r.DELETE("/secret/:name", func(c *gin.Context) {
		userClaims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user := userClaims.(UserClaims)
		userID := user.Sub
		keyID := c.Param("name")

		metaPath := fmt.Sprintf("secrets/metadata/users/%s/%s", userID, keyID)
		if _, err := client.Logical().Delete(metaPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete secret metadata"})
			return
		}

		c.Status(http.StatusNoContent)
	})
}

func authUserPass(client *openbao.Client, username, password string) error {
	secret, err := client.Logical().Write("auth/userpass/login/"+username, map[string]interface{}{
		"password": password,
	})
	if err != nil {
		return err
	}
	if secret == nil || secret.Auth == nil {
		return fmt.Errorf("authentication failed: no auth info returned")
	}
	client.SetToken(secret.Auth.ClientToken)
	log.Printf("Successfully authenticated as user: %s", username)
	return nil
}

func startTokenRefresher(client *openbao.Client, username, password string, interval time.Duration) {
	for {
		time.Sleep(interval)
		if err := authUserPass(client, username, password); err != nil {
			log.Printf("Failed to refresh token: %v", err)
		} else {
			log.Println("Token refreshed successfully")
		}
	}
}
