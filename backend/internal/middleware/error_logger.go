package middleware

import (
	"log/slog"

	"github.com/gin-gonic/gin"
)

func ErrorLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		status := c.Writer.Status()
		if len(c.Errors) == 0 && status < 500 {
			return
		}

		slog.Error(
			"request error",
			slog.String("request_id", GetRequestID(c)),
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.Int("status", status),
			slog.Int("errors", len(c.Errors)),
		)
	}
}
