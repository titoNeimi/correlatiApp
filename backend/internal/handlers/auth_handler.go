package handlers

import (
	"acadifyapp/internal/http"
	"acadifyapp/internal/models"
	"acadifyapp/internal/services"
	"acadifyapp/internal/utils"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type loginData struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthHandlers struct {
	DB            *gorm.DB
	Sessions      *services.Service
	Cookies       httpx.CookieCfg
	Mailer        services.PasswordResetMailer
	ResetURLBase  string
	ResetTokenTTL time.Duration
}

type meResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type resetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

const forgotPasswordGenericMessage = "si el email existe, te enviamos instrucciones para recuperar la contrasena"
const forgotPasswordMinInterval = time.Minute

func (h *AuthHandlers) LoginHandler(c *gin.Context) {
	var data loginData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Parametros invalidos"})
		return
	}
	email := strings.TrimSpace(strings.ToLower(data.Email))
	user := services.GetUserByEmail(email)
	if user.ID == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Datos incorrectos"})
		return
	}
	isValidPassword := utils.CheckPasswordHash(data.Password, user.Password)
	if !isValidPassword {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Datos incorrectos"})
		slog.Info("No se a podido iniciar sesion, contrasenia incorrecta")
		return
	}

	sess, err := h.Sessions.Create(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo crear la sesión"})
		return
	}

	httpx.SetSessionCookie(c.Writer, h.Cookies, sess.ID, sess.ExpiresAt)

	c.JSON(http.StatusOK, meResponse{ID: user.ID, Email: user.Email})
}

func (h *AuthHandlers) Logout(c *gin.Context) {
	if cookie, err := c.Request.Cookie(h.Cookies.Name); err == nil && cookie.Value != "" {
		_ = h.Sessions.Revoke(cookie.Value)
	}
	httpx.ClearSessionCookie(c.Writer, h.Cookies)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *AuthHandlers) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros inválidos"})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))

	var count int64
	if err := h.DB.Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error verificando existencia"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "el usuario ya existe"})
		return
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo procesar la contraseña"})
		return
	}

	user := models.User{
		ID:       uuid.NewString(),
		Email:    email,
		Password: hashed,
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "el usuario ya existe"})
		return
	}

	sess, err := h.Sessions.Create(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo crear la sesión"})
		return
	}

	httpx.SetSessionCookie(c.Writer, h.Cookies, sess.ID, sess.ExpiresAt)

	c.JSON(http.StatusCreated, meResponse{ID: user.ID, Email: user.Email})
}

func (h *AuthHandlers) Me(c *gin.Context) {
	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	user := u.(models.User)
	c.JSON(http.StatusOK, meResponse{ID: user.ID, Email: user.Email, Role: user.Role})
}

func (h *AuthHandlers) ForgotPassword(c *gin.Context) {
	if h.Mailer == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "password reset mailer is not configured"})
		return
	}

	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros inválidos"})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	now := time.Now().UTC()

	var user models.User
	if err := h.DB.Select("id", "email").Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{"message": forgotPasswordGenericMessage})
			return
		}
		slog.Error("error searching user for password reset", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo iniciar la recuperación"})
		return
	}

	var latestToken models.PasswordResetToken
	if err := h.DB.Select("created_at").Where("user_id = ?", user.ID).Order("created_at DESC").First(&latestToken).Error; err == nil {
		if now.Sub(latestToken.CreatedAt) < forgotPasswordMinInterval {
			c.JSON(http.StatusOK, gin.H{"message": forgotPasswordGenericMessage})
			return
		}
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		slog.Error("error checking latest reset token", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo iniciar la recuperación"})
		return
	}

	rawToken, err := generateSecureToken(32)
	if err != nil {
		slog.Error("error generating password reset token", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo iniciar la recuperación"})
		return
	}

	resetToken := models.PasswordResetToken{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		TokenHash: hashResetToken(rawToken),
		ExpiresAt: now.Add(h.getResetTokenTTL()),
	}

	if err := h.DB.Where("user_id = ?", user.ID).Delete(&models.PasswordResetToken{}).Error; err != nil {
		slog.Error("error deleting previous reset tokens", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo iniciar la recuperación"})
		return
	}

	if err := h.DB.Create(&resetToken).Error; err != nil {
		slog.Error("error creating reset token", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo iniciar la recuperación"})
		return
	}

	resetURL, err := buildResetURL(h.ResetURLBase, rawToken)
	if err != nil {
		_ = h.DB.Where("id = ?", resetToken.ID).Delete(&models.PasswordResetToken{}).Error
		slog.Error("error building reset URL", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo iniciar la recuperación"})
		return
	}

	if err := h.Mailer.SendPasswordReset(user.Email, resetURL); err != nil {
		_ = h.DB.Where("id = ?", resetToken.ID).Delete(&models.PasswordResetToken{}).Error
		slog.Error("error sending reset password email", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo enviar el correo de recuperación"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": forgotPasswordGenericMessage})
}

func (h *AuthHandlers) ResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros inválidos"})
		return
	}

	now := time.Now().UTC()
	hashedToken := hashResetToken(strings.TrimSpace(req.Token))

	var token models.PasswordResetToken
	if err := h.DB.
		Where("token_hash = ? AND used_at IS NULL AND expires_at > ?", hashedToken, now).
		First(&token).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "token inválido o expirado"})
			return
		}
		slog.Error("error finding password reset token", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo restablecer la contraseña"})
		return
	}

	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo procesar la contraseña"})
		return
	}

	tx := h.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo restablecer la contraseña"})
		return
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	if err := tx.Model(&models.User{}).Where("id = ?", token.UserID).Update("password", newHash).Error; err != nil {
		tx.Rollback()
		slog.Error("error updating password", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo restablecer la contraseña"})
		return
	}

	if err := tx.Model(&models.PasswordResetToken{}).Where("id = ?", token.ID).Update("used_at", now).Error; err != nil {
		tx.Rollback()
		slog.Error("error marking reset token as used", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo restablecer la contraseña"})
		return
	}

	if err := tx.Where("user_id = ? AND id <> ?", token.UserID, token.ID).Delete(&models.PasswordResetToken{}).Error; err != nil {
		tx.Rollback()
		slog.Error("error cleaning other reset tokens", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo restablecer la contraseña"})
		return
	}

	if err := tx.Where("user_id = ?", token.UserID).Delete(&models.Session{}).Error; err != nil {
		tx.Rollback()
		slog.Error("error deleting user sessions after password reset", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo restablecer la contraseña"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		slog.Error("error committing password reset transaction", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo restablecer la contraseña"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "contraseña restablecida correctamente"})
}

func (h *AuthHandlers) getResetTokenTTL() time.Duration {
	if h.ResetTokenTTL <= 0 {
		return 30 * time.Minute
	}
	return h.ResetTokenTTL
}

func generateSecureToken(size int) (string, error) {
	if size <= 0 {
		size = 32
	}
	random := make([]byte, size)
	if _, err := rand.Read(random); err != nil {
		return "", err
	}
	return hex.EncodeToString(random), nil
}

func hashResetToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func buildResetURL(base, token string) (string, error) {
	rawBase := strings.TrimSpace(base)
	if rawBase == "" {
		return "", errors.New("empty reset URL base")
	}

	u, err := url.Parse(rawBase)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return "", errors.New("invalid reset URL base")
	}

	query := u.Query()
	query.Set("token", token)
	u.RawQuery = query.Encode()
	return u.String(), nil
}
