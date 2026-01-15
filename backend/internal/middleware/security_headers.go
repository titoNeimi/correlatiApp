package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")

		if isHTTPSRequest(c) {
			c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		}

		c.Next()
	}
}

func isHTTPSRequest(c *gin.Context) bool {
	if c.Request.TLS != nil {
		return true
	}
	proto := strings.TrimSpace(c.GetHeader("X-Forwarded-Proto"))
	return strings.EqualFold(proto, "https")
}
