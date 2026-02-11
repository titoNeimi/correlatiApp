package middleware

import (
	"net/http"
	"strconv"
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
	cleanupInterval := window
	if cleanupInterval > 5*time.Minute {
		cleanupInterval = 5 * time.Minute
	}
	if cleanupInterval < 10*time.Second {
		cleanupInterval = 10 * time.Second
	}

	go func() {
		ticker := time.NewTicker(cleanupInterval)
		defer ticker.Stop()

		for now := range ticker.C {
			now = now.UTC()
			mu.Lock()
			for key, entry := range entries {
				if now.After(entry.windowEnd) {
					delete(entries, key)
				}
			}
			mu.Unlock()
		}
	}()

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
			retryAfter := int(time.Until(resetAt).Seconds())
			if retryAfter < 1 {
				retryAfter = 1
			}
			c.Header("Retry-After", strconv.Itoa(retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "too many requests"})
			return
		}

		c.Next()
	}
}
