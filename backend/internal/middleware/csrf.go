package middleware

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

type CSRFCfg struct {
	AllowedOrigins []string
	ExemptPaths    []string
	ExemptPrefixes []string
}

func CSRFMiddleware(cfg CSRFCfg) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(cfg.AllowedOrigins))
	for _, origin := range cfg.AllowedOrigins {
		allowed[origin] = struct{}{}
	}

	return func(c *gin.Context) {
		path := c.Request.URL.Path
		for _, p := range cfg.ExemptPaths {
			if path == p {
				c.Next()
				return
			}
		}
		for _, prefix := range cfg.ExemptPrefixes {
			if strings.HasPrefix(path, prefix) {
				c.Next()
				return
			}
		}

		method := c.Request.Method
		if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
			c.Next()
			return
		}

		origin := strings.TrimSpace(c.Request.Header.Get("Origin"))
		referer := strings.TrimSpace(c.Request.Header.Get("Referer"))

		if origin == "" && referer == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF protection: missing origin"})
			return
		}

		if origin != "" {
			if _, ok := allowed[origin]; ok {
				c.Next()
				return
			}
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF protection: invalid origin"})
			return
		}

		u, err := url.Parse(referer)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF protection: invalid referer"})
			return
		}
		if u.Scheme == "" || u.Host == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF protection: invalid referer"})
			return
		}
		originFromReferer := u.Scheme + "://" + u.Host
		if _, ok := allowed[originFromReferer]; ok {
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF protection: invalid referer"})
	}
}
