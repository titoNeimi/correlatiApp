package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func Health(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, gin.H{
		"ok":        true,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}
