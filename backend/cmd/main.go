package main

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/routes"
	"log/slog"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

func main() {
	db.Connect()
	mode := strings.ToLower(strings.TrimSpace(os.Getenv("GIN_MODE")))
	switch mode {
	case gin.DebugMode, gin.ReleaseMode, gin.TestMode:
	default:
		mode = gin.ReleaseMode
	}
	gin.SetMode(mode)
	router := gin.Default()
	router.SetTrustedProxies(nil)
	routes.SetUpRoutes(router, db.Db)
	slog.Info("Server started")
	router.Run(":8080")
}
