package middleware

import (
	"acadifyapp/internal/http"
	"acadifyapp/internal/models"
	"acadifyapp/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"slices"
)

func AuthRequired(db *gorm.DB, sessions *services.Service, cookies httpx.CookieCfg) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Request.Cookie(cookies.Name)
		if err != nil || cookie.Value == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
			return
		}

		sess, err := sessions.FindActive(cookie.Value)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "sesión inválida o vencida"})
			return
		}

		var user models.User
		if err := db.Model(&user).First(&user, "id = ?", sess.UserID).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "usuario no encontrado"})
			return
		}

		c.Set("user", user)
		c.Next()
	}
}

func OptionalAuth(db *gorm.DB, sessions *services.Service, cookies httpx.CookieCfg) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Request.Cookie(cookies.Name)
		if err != nil || cookie.Value == "" {
			c.Next()
			return
		}

		sess, err := sessions.FindActive(cookie.Value)
		if err != nil {
			c.Next()
			return
		}

		var user models.User
		if err := db.Model(&user).First(&user, "id = ?", sess.UserID).Error; err != nil {
			c.Next()
			return
		}

		c.Set("user", user)
		c.Next()
	}
}

func RoleRequired(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := c.Get("user")
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
			return
		}
		u, ok := user.(models.User)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
			return
		}

		if slices.Contains(roles, u.Role) {
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
	}
}
