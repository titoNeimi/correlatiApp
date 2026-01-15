package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const requestIDHeader = "X-Request-Id"

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := strings.TrimSpace(c.GetHeader(requestIDHeader))
		if id == "" {
			id = uuid.NewString()
		}
		c.Set("request_id", id)
		c.Header(requestIDHeader, id)
		c.Next()
	}
}

func GetRequestID(c *gin.Context) string {
	if value, ok := c.Get("request_id"); ok {
		if id, ok := value.(string); ok {
			return id
		}
	}
	return ""
}
