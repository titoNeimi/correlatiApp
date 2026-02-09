package main

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/routes"
	"log/slog"

	"github.com/gin-gonic/gin"
)

func main() {
	db.Connect()
	gin.SetMode(gin.DebugMode)
	router := gin.Default()
	router.SetTrustedProxies(nil)
	routes.SetUpRoutes(router, db.Db)
	slog.Info("Server started")
	router.Run(":8080")
}
