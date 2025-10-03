package main

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/coreos/go-oidc"
	"github.com/gin-gonic/gin"
)

var (
	realmURL = "http://localhost:8080/realms/my-realm"
	clientID = "my-backendApp"
)

func ValidationKeycloak() {
	ctx := context.Background()

	provider, err := oidc.NewProvider(ctx, realmURL)
	if err != nil {
		log.Fatalf("Error connecting to Keycloak: %v", err)
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})

	r := gin.Default()

	authMiddleware := func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not token"})
			return
		}

		rawToken := strings.TrimPrefix(authHeader, "Bearer ")
		_, err := verifier.Verify(ctx, rawToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		c.Next()
	}

	r.GET("/public", func(c *gin.Context) {
		c.JSON(200, gin.H{"msg": "public endpoint"})
	})

	r.GET("/private", authMiddleware, func(c *gin.Context) {
		c.JSON(200, gin.H{"msg": "access allowed"})
	})
}
