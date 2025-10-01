package routes

import (
	"correlatiApp/internal/handlers"
	"correlatiApp/internal/http"
	"correlatiApp/internal/middleware"
	"correlatiApp/internal/services"
	"net/http"
	"time"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetUpRoutes (r *gin.Engine, db *gorm.DB) {

	r.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "X-Requested-With"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
	}))

	sessSvc := services.New(db, 7*24*time.Hour)

	cookies := httpx.CookieCfg{
		Name:     "session_id",
		Domain:   "",
		Path:     "/",
		Secure:   false,                  
		SameSite: http.SameSiteLaxMode,
	}
	authHandlers := &handlers.AuthHandlers{DB: db, Sessions: sessSvc, Cookies: cookies}


	users := r.Group("/users") 
	{
		users.GET("/", middleware.AuthRequired(db, sessSvc, cookies), authHandlers.Me, handlers.GetAllUsers)
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

	auth := r.Group("/auth")
	{
		auth.POST("/me" ,middleware.AuthRequired(db, sessSvc, cookies), authHandlers.Me)
		auth.POST("/login", authHandlers.LoginHandler)
		auth.POST("/logout",middleware.AuthRequired(db, sessSvc, cookies), authHandlers.Logout)
		auth.POST("/register", authHandlers.Register)
	}

}