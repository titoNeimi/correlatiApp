package routes

import (
	"correlatiApp/internal/handlers"
	"github.com/gin-gonic/gin"

)


func SetUpRoutes (r *gin.Engine){
	users := r.Group("/users") 
	{
		users.GET("/", handlers.GetAllUsers)
		users.POST("/", handlers.CreateUser)
		users.GET("/:id", handlers.GetUser)
		users.PUT("/:id", handlers.UpdateUser)
		users.DELETE("/:id", handlers.DeleteUser)
	}
}