package routers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/coreos/go-oidc"
	"github.com/gin-gonic/gin"
)

type UserClaims struct {
	Sub               string `json:"sub"`
	Email             string `json:"email"`
	PreferredUsername string `json:"preferred_username"`
	Name              string `json:"name"`
}

var (
	realmURL     = "http://localhost:8080/realms/test"
	clientID     = "backend"
	clientSecret = "HZ7KVvK2qtecvr0YwC8fmFbFDFEzK9iY"
	redirectURI  = "http://localhost:8000/auth/callback"
)

func ValidationKeycloak(r *gin.Engine) gin.HandlerFunc {
	ctx := context.Background()

	provider, err := oidc.NewProvider(ctx, realmURL)
	if err != nil {
		log.Fatalf("Error connecting to Keycloak: %v", err)
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})

	authMiddleware := func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No token"})
			return
		}

		rawToken := strings.TrimPrefix(authHeader, "Bearer ")
		idToken, err := verifier.Verify(ctx, rawToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		var claims UserClaims
		if err := idToken.Claims(&claims); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse claims"})
			return
		}
		c.Set("user", claims)
		c.Next()
	}

	r.GET("/me", authMiddleware, func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
			return
		}

		claims := user.(UserClaims)

		c.JSON(200, gin.H{
			"msg":  "access allowed",
			"user": claims,
		})
	})

	r.GET("/auth/callback", func(c *gin.Context) {
		code := c.Query("code")
		if code == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "code not provided"})
			return
		}

		tokenURL := realmURL + "/protocol/openid-connect/token"

		data := url.Values{}
		data.Set("grant_type", "authorization_code")
		data.Set("client_id", clientID)
		data.Set("client_secret", clientSecret)
		data.Set("code", code)
		data.Set("redirect_uri", redirectURI)

		resp, err := http.PostForm(tokenURL, data)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to request token"})
			return
		}
		defer resp.Body.Close()

		var tokens map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&tokens); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse token response"})
			return
		}

		c.JSON(http.StatusOK, tokens)
	})

	return authMiddleware
}
