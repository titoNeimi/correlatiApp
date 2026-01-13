package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimitEntry struct {
	count     int
	windowEnd time.Time
}

func RateLimit(max int, window time.Duration) gin.HandlerFunc {
	if max <= 0 {
		max = 10
	}
	if window <= 0 {
		window = time.Minute
	}

	var mu sync.Mutex
	entries := map[string]*rateLimitEntry{}

	return func(c *gin.Context) {
		key := c.ClientIP()
		now := time.Now().UTC()

		mu.Lock()
		entry, ok := entries[key]
		if !ok || now.After(entry.windowEnd) {
			entry = &rateLimitEntry{count: 0, windowEnd: now.Add(window)}
			entries[key] = entry
		}
		entry.count++
		count := entry.count
		resetAt := entry.windowEnd
		mu.Unlock()

		if count > max {
			c.Header("Retry-After", resetAt.Format(time.RFC1123))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "too many requests"})
			return
		}

		c.Next()
	}
}
