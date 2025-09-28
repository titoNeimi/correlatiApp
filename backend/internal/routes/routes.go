package routes

import (
	"correlatiApp/internal/handlers"
	"correlatiApp/internal/middleware"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)


func SetUpRoutes (r *gin.Engine){

	r.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
    MaxAge:           12 * time.Hour,
  }))

	users := r.Group("/users") 
	{
		users.GET("/", handlers.GetAllUsers)
		users.POST("/", handlers.CreateUser)
		users.GET("/:id", handlers.GetUser)
		users.PUT("/:id", handlers.UpdateUser)
		users.DELETE("/:id", handlers.DeleteUser)
	}
	degreeProgram := r.Group("degreeProgram")
	{
		degreeProgram.GET("/", handlers.GetAllDegreeProgramsWithSubjects)
		degreeProgram.POST("/", handlers.CreateProgram)
		degreeProgram.GET("/:id", handlers.GetProgramById)
		degreeProgram.PUT("/:id", handlers.UpdateProgram)
		degreeProgram.DELETE("/:id", handlers.DeleteProgram)
	}
	subjects := r.Group("/subjects")
	{
		subjects.POST("/", handlers.CreateSubject)
		subjects.GET("/:programId", handlers.GetAllSubjectsFromProgram)
		subjects.PUT("/:id", handlers.UpdateSubject)
		subjects.DELETE("/:id", handlers.DeleteSubject)
	}
	r.GET("/me", middleware.Auth(), handlers.LoginHandler)
	r.POST("/login", handlers.LoginHandler)
	r.POST("/logout", handlers.Logout)
}