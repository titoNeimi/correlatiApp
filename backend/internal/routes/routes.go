package routes

import (
	"correlatiApp/internal/handlers"
	"correlatiApp/internal/http"
	"correlatiApp/internal/middleware"
	"correlatiApp/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"os"
	"time"
)

func SetUpRoutes(r *gin.Engine, db *gorm.DB) {

	allowedOrigins := []string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	r.Use(middleware.RequestID())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.RateLimit(120, time.Minute))
	r.Use(middleware.ErrorLogger())
	r.Use(middleware.CSRFMiddleware(middleware.CSRFCfg{
		AllowedOrigins: allowedOrigins,
		ExemptPaths:    []string{"/auth/login", "/auth/register"},
	}))

	sessSvc := services.New(db, 7*24*time.Hour)

	cookieSecure := os.Getenv("COOKIE_SECURE")
	secure := cookieSecure != "false"
	cookies := httpx.CookieCfg{
		Name:     "session_id",
		Domain:   "",
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	}
	authHandlers := &handlers.AuthHandlers{DB: db, Sessions: sessSvc, Cookies: cookies}

	users := r.Group("/users")
	{
		users.GET("", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.GetAllUsers)
		users.POST("", handlers.CreateUser)
		users.GET("/:id", handlers.GetUser)
		users.PUT("/:id", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.UpdateUser)
		users.DELETE("/:id", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.DeleteUser)
		users.POST("/:id/session/revoke", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.RevokeSession)
	}
	degreeProgram := r.Group("/degreeProgram")
	{
		degreeProgram.GET("", middleware.OptionalAuth(db, sessSvc, cookies), handlers.GetAllDegreeProgramsWithSubjects)
		degreeProgram.POST("", middleware.OptionalAuth(db, sessSvc, cookies), handlers.CreateProgram)
		degreeProgram.GET("/:id", middleware.OptionalAuth(db, sessSvc, cookies), handlers.GetProgramById)
		degreeProgram.PUT("/:id", handlers.UpdateProgram)
		degreeProgram.DELETE("/:id", handlers.DeleteProgram)
		degreeProgram.POST("/:id/approve", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin", "staff"), handlers.ApproveProgram)
		degreeProgram.POST("/:id/publish", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin", "staff"), handlers.PublishProgram)
		degreeProgram.POST("/:id/unapprove", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin", "staff"), handlers.UnapproveProgram)
		degreeProgram.POST("/:id/unpublish", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin", "staff"), handlers.UnpublishProgram)

		degreeProgram.POST("/:id/electivePools", middleware.AuthRequired(db, sessSvc, cookies), handlers.CreateElectivePool)
		degreeProgram.GET("/:id/electivePools", handlers.GetElectivePoolsByProgram)
		degreeProgram.GET("/:id/electivePools/:poolId", handlers.GetElectivePoolByID)
		degreeProgram.PUT("/:id/electivePools/:poolId", middleware.AuthRequired(db, sessSvc, cookies), handlers.UpdateElectivePool)
		degreeProgram.DELETE("/:id/electivePools/:poolId", middleware.AuthRequired(db, sessSvc, cookies), handlers.DeleteElectivePool)
		degreeProgram.POST("/:id/electivePools/:poolId/subjects", middleware.AuthRequired(db, sessSvc, cookies), handlers.AddSubjectToElectivePool)
		degreeProgram.DELETE("/:id/electivePools/:poolId/subjects/:subjectId", middleware.AuthRequired(db, sessSvc, cookies), handlers.RemoveSubjectFromElectivePool)

		degreeProgram.POST("/:id/electiveRules", middleware.AuthRequired(db, sessSvc, cookies), handlers.CreateElectiveRule)
		degreeProgram.GET("/:id/electiveRules", handlers.GetElectiveRulesByProgram)
		degreeProgram.GET("/:id/electiveRules/:ruleId", handlers.GetElectiveRuleByID)
		degreeProgram.PUT("/:id/electiveRules/:ruleId", middleware.AuthRequired(db, sessSvc, cookies), handlers.UpdateElectiveRule)
		degreeProgram.DELETE("/:id/electiveRules/:ruleId", middleware.AuthRequired(db, sessSvc, cookies), handlers.DeleteElectiveRule)
	}
	subjects := r.Group("/subjects")
	{
		subjects.POST("", handlers.CreateSubject)
		subjects.GET("/:programId", handlers.GetAllSubjectsFromProgram)
		subjects.PUT("/:id", handlers.UpdateSubject)
		subjects.DELETE("/:id", handlers.DeleteSubject)
	}
	universities := r.Group("/universities")
	{
		universities.GET("", middleware.OptionalAuth(db, sessSvc, cookies), handlers.GetAllUniversities)
		universities.POST("", handlers.CreateUniversity)
		universities.GET("/:id", middleware.OptionalAuth(db, sessSvc, cookies), handlers.GetUniversityByID)
		universities.PUT("/:id", handlers.UpdateUniversity)
		universities.DELETE("/:id", handlers.DeleteUniversity)
	}

	auth := r.Group("/auth")
	{
		auth.GET("/me", middleware.AuthRequired(db, sessSvc, cookies), authHandlers.Me)
		auth.POST("/login", middleware.RateLimit(8, time.Minute), authHandlers.LoginHandler)
		auth.POST("/logout", middleware.AuthRequired(db, sessSvc, cookies), authHandlers.Logout)
		auth.POST("/register", authHandlers.Register)
	}

	me := r.Group("/me", middleware.AuthRequired(db, sessSvc, cookies))
	{
		me.GET("/subjects/:programId", handlers.GetMySubjectsFromProgram)
		me.POST("/subjects/:programId", handlers.SaveMySubjectsFromProgram)
		program := me.Group("/programs")
		{
			program.GET("", handlers.GetMyPrograms)
			program.POST("/:id/enroll", handlers.EnrollProgram)
			program.DELETE("/:id/enroll", handlers.UnenrollProgram)
			program.POST("/:id/favorite", handlers.FavoriteProgram)
			program.DELETE("/:id/favorite", handlers.UnfavoriteProgram)
		}
	}
}
