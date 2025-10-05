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
	"github.com/golang-jwt/jwt/v5"
	"os"
)

type UserClaims struct {
	Sub               string   `json:"sub"`
	Email             string   `json:"email"`
	PreferredUsername string   `json:"preferred_username"`
	Name              string   `json:"name"`
	RealmRoles        []string `json:"realm_roles"`
}

var (
	realmURL     = os.Getenv("AUTH_REALM_URL")
	clientID     = os.Getenv("AUTH_CLIENT_ID")
	clientSecret = os.Getenv("AUTH_CLIENT_SECRET")
)

func ValidationKeycloak(r *gin.Engine) gin.HandlerFunc {
	ctx := context.Background()

	provider, err := oidc.NewProvider(ctx, realmURL)
	if err != nil {
		log.Fatalf("Error connecting to Keycloak: %v", err)
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: "account"})

	authMiddleware := func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No token"})
			return
		}

		rawToken := strings.TrimPrefix(authHeader, "Bearer ")

		// Verify the ID token
		idToken, err := verifier.Verify(ctx, rawToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid ID token"})
			return
		}

		// Parse ID token claims
		var claims UserClaims
		if err := idToken.Claims(&claims); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse ID token claims"})
			return
		}

		// Parse access token manually to extract roles
		token, _, err := new(jwt.Parser).ParseUnverified(rawToken, jwt.MapClaims{})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse access token"})
			return
		}

		if mapClaims, ok := token.Claims.(jwt.MapClaims); ok {
			if ra, ok := mapClaims["realm_access"].(map[string]interface{}); ok {
				if roles, ok := ra["roles"].([]interface{}); ok {
					for _, r := range roles {
						if roleStr, ok := r.(string); ok {
							claims.RealmRoles = append(claims.RealmRoles, roleStr)
						}
					}
				}
			}
		}

		c.Set("user", claims)
		c.Next()
	}

	r.GET("/auth/redirect", func(c *gin.Context) {
		code := c.Query("code")
		state := c.Query("state")

		if code == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "code not provided"})
			return
		}

		tauriCallback := url.URL{
			Scheme: "tauri",
			Host:   "callback",
		}

		q := tauriCallback.Query()
		q.Set("code", code)
		if state != "" {
			q.Set("state", state)
		}
		tauriCallback.RawQuery = q.Encode()

		c.Redirect(http.StatusFound, tauriCallback.String())
	})

	r.GET("/auth/me", authMiddleware, func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
			return
		}

		claims := user.(UserClaims)

		c.JSON(200, claims)
	})

	r.POST("/auth/refresh", func(c *gin.Context) {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}

		if err := c.BindJSON(&req); err != nil || req.RefreshToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token is required"})
			return
		}

		tokenURL := realmURL + "/protocol/openid-connect/token"

		data := url.Values{}
		data.Set("grant_type", "refresh_token")
		data.Set("client_id", clientID)
		data.Set("client_secret", clientSecret)
		data.Set("refresh_token", req.RefreshToken)

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

	r.GET("/auth/callback", func(c *gin.Context) {
		code := c.Query("code")
		redirectURI := c.Query("redirect_uri")

		if code == "" || redirectURI == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "code or redirect_uri not provided"})
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
