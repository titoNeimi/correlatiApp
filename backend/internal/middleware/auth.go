package middleware

import (
	"correlatiApp/internal/utils"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func Auth () gin.HandlerFunc {
	return func (c *gin.Context) {
		if c.Request.Method == http.MethodOptions {
      c.Next()
      return
		}
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization header"})
			return 
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		tokenString = strings.TrimSpace(tokenString)

		err := utils.VerifyToken(tokenString)

		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			slog.Info("Error al verificar el token", slog.Any("Error: ", err))
			return 
		}
		slog.Info("Middleware y token exitoso")
		c.Next()
	}
}