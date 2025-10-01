package middleware

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"correlatiApp/internal/http"
	"correlatiApp/internal/models"
	"correlatiApp/internal/services"
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
		if err := db.First(&user, "id = ?", sess.UserID).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "usuario no encontrado"})
			return
		}

		c.Set("user", user)
		c.Next()
	}
}
