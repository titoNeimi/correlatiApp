package routes

import (
	"acadifyapp/internal/handlers"
	httpx "acadifyapp/internal/http"
	"acadifyapp/internal/middleware"
	"acadifyapp/internal/models"
	"acadifyapp/internal/services"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetUpRoutes(r *gin.Engine, db *gorm.DB) {

	allowedOrigins := []string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"https://acadifyapp.com",
		"https://www.acadifyapp.com",
	}
	if extraOrigins := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS")); extraOrigins != "" {
		seen := make(map[string]struct{}, len(allowedOrigins))
		for _, origin := range allowedOrigins {
			seen[origin] = struct{}{}
		}
		for _, origin := range strings.Split(extraOrigins, ",") {
			clean := strings.TrimSpace(origin)
			if clean == "" {
				continue
			}
			if _, exists := seen[clean]; exists {
				continue
			}
			allowedOrigins = append(allowedOrigins, clean)
			seen[clean] = struct{}{}
		}
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
		ExemptPaths: []string{
			"/auth/login",
			"/auth/register",
			"/auth/password/forgot",
			"/auth/password/reset",
			"/suggestions",
		},
	}))

	r.GET("/health", handlers.Health)

	sessSvc := services.New(db, 7*24*time.Hour)
	startMaintenanceJobs(db, sessSvc)

	cookieSecure := os.Getenv("COOKIE_SECURE")
	secure := cookieSecure != "false"
	cookieDomain := strings.TrimSpace(os.Getenv("COOKIE_DOMAIN"))
	cookies := httpx.CookieCfg{
		Name:     "session_id",
		Domain:   cookieDomain,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	}

	resetURLBase := strings.TrimSpace(os.Getenv("PASSWORD_RESET_URL_BASE"))
	if resetURLBase == "" {
		resetURLBase = "http://localhost:3000/reset-password"
	}

	resetTokenTTL := 30 * time.Minute
	if rawTTL := strings.TrimSpace(os.Getenv("PASSWORD_RESET_TOKEN_TTL")); rawTTL != "" {
		ttl, err := time.ParseDuration(rawTTL)
		if err != nil || ttl <= 0 {
			slog.Warn("invalid PASSWORD_RESET_TOKEN_TTL, using default", slog.String("value", rawTTL))
		} else {
			resetTokenTTL = ttl
		}
	}

	var resetMailer services.PasswordResetMailer
	apiCfg := services.BrevoAPIConfigFromEnv()
	apiMailer, err := services.NewBrevoAPIMailer(apiCfg)
	if err == nil {
		resetMailer = apiMailer
		slog.Info(
			"password reset mailer configured",
			slog.String("provider", "brevo_api"),
			slog.String("api_url", apiCfg.APIURL),
			slog.String("from_email", apiCfg.FromEmail),
			slog.Duration("timeout", apiCfg.Timeout),
		)
	} else {
		slog.Warn("brevo API mailer is not configured, trying SMTP fallback", slog.Any("error", err))
		smtpCfg := services.BrevoSMTPConfigFromEnv()
		smtpMailer, smtpErr := services.NewBrevoSMTPMailer(smtpCfg)
		if smtpErr != nil {
			slog.Warn("brevo mailer is not configured, password reset by email disabled", slog.Any("error", smtpErr))
		} else {
			slog.Info(
				"password reset mailer configured",
				slog.String("provider", "brevo_smtp"),
				slog.String("host", smtpCfg.Host),
				slog.Int("port", smtpCfg.Port),
				slog.String("from_email", smtpCfg.FromEmail),
			)
			resetMailer = smtpMailer
		}
	}
	if resetMailer == nil {
		slog.Warn("password reset mailer is disabled; /auth/password/forgot will return 503")
	}

	authHandlers := &handlers.AuthHandlers{
		DB:            db,
		Sessions:      sessSvc,
		Cookies:       cookies,
		Mailer:        resetMailer,
		ResetURLBase:  resetURLBase,
		ResetTokenTTL: resetTokenTTL,
	}

	users := r.Group("/users")
	{
		users.GET("", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.GetAllUsers)
		users.POST("", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.CreateUser)
		users.GET("/:id", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.GetUser)
		users.PUT("/:id", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.UpdateUser)
		users.DELETE("/:id", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.DeleteUser)
		users.POST("/:id/session/revoke", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin"), handlers.RevokeSession)
	}
	degreeProgram := r.Group("/degreeProgram")
	{
		degreeProgram.GET("", middleware.OptionalAuth(db, sessSvc, cookies), handlers.GetAllDegreeProgramsWithSubjects)
		degreeProgram.POST("", middleware.AuthRequired(db, sessSvc, cookies), handlers.CreateProgram)
		degreeProgram.GET("/:id", middleware.OptionalAuth(db, sessSvc, cookies), handlers.GetProgramById)
		degreeProgram.PUT("/:id", middleware.AuthRequired(db, sessSvc, cookies), handlers.UpdateProgram)
		degreeProgram.DELETE("/:id", middleware.AuthRequired(db, sessSvc, cookies), handlers.DeleteProgram)
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
		subjects.POST("", middleware.AuthRequired(db, sessSvc, cookies), handlers.CreateSubject)
		subjects.GET("/:programId", handlers.GetAllSubjectsFromProgram)
		subjects.PUT("/:id", middleware.AuthRequired(db, sessSvc, cookies), handlers.UpdateSubject)
		subjects.DELETE("/:id", middleware.AuthRequired(db, sessSvc, cookies), handlers.DeleteSubject)
	}
	universities := r.Group("/universities")
	{
		universities.GET("", middleware.OptionalAuth(db, sessSvc, cookies), handlers.GetAllUniversities)
		universities.POST("", middleware.AuthRequired(db, sessSvc, cookies), handlers.CreateUniversity)
		universities.GET("/:id", middleware.OptionalAuth(db, sessSvc, cookies), handlers.GetUniversityByID)
		universities.PUT("/:id", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin", "staff"), handlers.UpdateUniversity)
		universities.DELETE("/:id", middleware.AuthRequired(db, sessSvc, cookies), middleware.RoleRequired("admin", "staff"), handlers.DeleteUniversity)
	}

	auth := r.Group("/auth")
	{
		auth.GET("/me", middleware.AuthRequired(db, sessSvc, cookies), authHandlers.Me)
		auth.POST("/login", middleware.RateLimit(8, time.Minute), authHandlers.LoginHandler)
		auth.POST("/logout", middleware.AuthRequired(db, sessSvc, cookies), authHandlers.Logout)
		auth.POST("/register", middleware.RateLimit(5, time.Minute), authHandlers.Register)

		auth.POST("/password/forgot", middleware.RateLimit(5, time.Minute), authHandlers.ForgotPassword)
		auth.POST("/password/reset", middleware.RateLimit(5, time.Minute), authHandlers.ResetPassword)
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

	suggestionsToEmail := strings.TrimSpace(os.Getenv("SUGGESTIONS_TO_EMAIL"))
	if suggestionsToEmail == "" {
		suggestionsToEmail = "acadifyapp@gmail.com"
	}
	var suggestionMailer services.SuggestionMailer
	if apiMailer != nil {
		suggestionMailer = apiMailer
	}
	suggestionHandlers := &handlers.SuggestionHandlers{
		Mailer:  suggestionMailer,
		ToEmail: suggestionsToEmail,
	}
	r.POST("/suggestions", middleware.RateLimit(10, time.Minute), suggestionHandlers.Submit)
}

func startMaintenanceJobs(db *gorm.DB, sessions *services.Service) {
	runCleanup := func() {
		if deletedSessions, err := sessions.DeleteExpired(); err != nil {
			slog.Warn("failed to delete expired sessions", slog.Any("error", err))
		} else if deletedSessions > 0 {
			slog.Info("expired sessions deleted", slog.Int64("count", deletedSessions))
		}

		now := time.Now().UTC()
		tx := db.Where("expires_at <= ? OR (used_at IS NOT NULL AND used_at <= ?)", now, now.Add(-24*time.Hour)).
			Delete(&models.PasswordResetToken{})
		if tx.Error != nil {
			slog.Warn("failed to delete expired password reset tokens", slog.Any("error", tx.Error))
			return
		}
		if tx.RowsAffected > 0 {
			slog.Info("expired password reset tokens deleted", slog.Int64("count", tx.RowsAffected))
		}
	}

	runCleanup()

	go func() {
		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			runCleanup()
		}
	}()
}
