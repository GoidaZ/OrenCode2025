package routers

import (
	"fmt"
	"github.com/google/uuid"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	openbao "github.com/openbao/openbao/api/v2"
	"gorm.io/gorm"

	"orencode/src/models"
)

type Hub struct {
	clients map[string]map[*Client]bool // userID -> clients
	lock    sync.RWMutex
}

type Client struct {
	userID string
	conn   *gin.Context
}

var hub = Hub{
	clients: make(map[string]map[*Client]bool),
	lock:    sync.RWMutex{},
}

func (h *Hub) register(c *Client) {
	h.lock.Lock()
	defer h.lock.Unlock()
	if _, ok := h.clients[c.userID]; !ok {
		h.clients[c.userID] = make(map[*Client]bool)
	}
	h.clients[c.userID][c] = true
}

func (h *Hub) unregister(c *Client) {
	h.lock.Lock()
	defer h.lock.Unlock()
	if conns, ok := h.clients[c.userID]; ok {
		delete(conns, c)
		if len(conns) == 0 {
			delete(h.clients, c.userID)
		}
	}
}

func (h *Hub) send(userID string, message interface{}) {
	h.lock.RLock()
	defer h.lock.RUnlock()
	if conns, ok := h.clients[userID]; ok {
		for client := range conns {
			client.conn.JSON(http.StatusOK, message)
		}
	}
}

func CreateReq(r *gin.Engine, db *gorm.DB) {
	config := openbao.DefaultConfig()
	config.Address = "http://openbao:8200/"
	client, err := openbao.NewClient(config)
	if err != nil {
		log.Fatalf("unable to initialize OpenBao client: %v", err)
	}

	username := os.Getenv("OPENBAO_USERNAME")
	password := os.Getenv("OPENBAO_PASSWORD")
	if err := authUserPass(client, username, password); err != nil {
		log.Fatalf("unable to authenticate: %v", err)
	}

	go startTokenRefresher(client, username, password, 50*time.Minute)

	r.POST("/request/create", func(c *gin.Context) {
		userClaims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user := userClaims.(UserClaims)
		var req models.Request
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		req.Creator, _ = uuid.Parse(user.Sub)
		req.Status = "PENDING"
		req.CreatedAt = time.Now()

		if err := db.Create(&req).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
			return
		}

		hub.send(user.Sub, req)

		c.JSON(http.StatusCreated, req)
	})

	r.GET("/request/list", func(c *gin.Context) {
		userClaims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user := userClaims.(UserClaims)

		var requests []models.Request
		if err := db.Where("creator = ?", user.Sub).Find(&requests).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch requests"})
			return
		}
		c.JSON(http.StatusOK, requests)
	})

	r.GET("/ws", func(c *gin.Context) {
		userClaims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user := userClaims.(UserClaims)
		client := &Client{userID: user.Sub, conn: c}
		hub.register(client)
		defer hub.unregister(client)

		c.Stream(func(w io.Writer) bool { return true })
	})

	manager := r.Group("/request/manage")
	manager.Use(func(c *gin.Context) {
		userClaims, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		user := userClaims.(UserClaims)
		allowed := false
		for _, role := range user.RealmRoles {
			if role == "manager" {
				allowed = true
				break
			}
		}
		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	})

	manager.GET("/list", func(c *gin.Context) {
		var requests []models.Request
		limit := 20
		offset := 0
		if l := c.Query("limit"); l != "" {
			fmt.Sscanf(l, "%d", &limit)
		}
		if o := c.Query("offset"); o != "" {
			fmt.Sscanf(o, "%d", &offset)
		}

		if err := db.Limit(limit).Offset(offset).Find(&requests).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch requests"})
			return
		}
		c.JSON(http.StatusOK, requests)
	})

	manager.POST("/:id/approve", func(c *gin.Context) {
		id := c.Param("id")
		var req models.Request
		if err := db.First(&req, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
			return
		}

		var body struct {
			Data map[string]interface{} `json:"data"`
		}
		if err := c.BindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		dataPath := fmt.Sprintf("secrets/data/users/%s/%s", req.Creator, req.Resource)
		if _, err := client.Logical().Write(dataPath, map[string]interface{}{"data": body.Data}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write to OpenBao"})
			return
		}

		deleteAfter := req.ValidFor
		if deleteAfter == "" {
			deleteAfter = "0s"
		}

		metaPath := fmt.Sprintf("secrets/metadata/users/%s/%s", req.Creator, req.Resource)
		_, err := client.Logical().Write(metaPath, map[string]interface{}{
			"custom_metadata": map[string]string{
				"description": req.Resource,
			},
			"delete_version_after": deleteAfter,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write secret metadata"})
			return
		}

		req.Status = "ACCEPT"
		db.Save(&req)

		hub.send(req.Creator.String(), map[string]interface{}{
			"type":    "approved",
			"request": req,
		})

		c.Status(http.StatusNoContent)
	})

	manager.POST("/:id/reject", func(c *gin.Context) {
		id := c.Param("id")
		var req models.Request
		if err := db.First(&req, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
			return
		}

		req.Status = "REJECT"
		db.Save(&req)

		hub.send(req.Creator.String(), map[string]interface{}{
			"type":    "rejected",
			"request": req,
		})

		c.Status(http.StatusNoContent)
	})
}
