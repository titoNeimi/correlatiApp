package main

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/routes"
	"log/slog"

	"github.com/gin-gonic/gin"
)

func main(){
	db.Connect()
	gin.SetMode(gin.DebugMode) 
	router := gin.Default()
	router.SetTrustedProxies(nil)
	routes.SetUpRoutes(router)
	slog.Info("Server started")
	router.Run()
}