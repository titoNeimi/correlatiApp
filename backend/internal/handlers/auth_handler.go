package handlers

import (
	"correlatiApp/internal/http"
	"correlatiApp/internal/models"
	"correlatiApp/internal/services"
	"correlatiApp/internal/utils"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type loginData struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthHandlers struct {
	DB       *gorm.DB
	Sessions *services.Service
	Cookies  httpx.CookieCfg
}

type meResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandlers) LoginHandler(c *gin.Context) {
	var data loginData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Parametros invalidos"})
		return
	}
	user := services.GetUserByEmail(data.Email)
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
	c.JSON(http.StatusOK, meResponse{ID: user.ID, Email: user.Email})
}