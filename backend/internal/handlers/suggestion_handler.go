package handlers

import (
	"acadifyapp/internal/services"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type SuggestionHandlers struct {
	Mailer  services.SuggestionMailer
	ToEmail string
}

type suggestionRequest struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	Type        string `json:"type" binding:"required"`
	Description string `json:"description" binding:"required"`
}

var validSuggestionTypes = map[string]bool{
	"career":     true,
	"university": true,
	"feature":    true,
	"bug":        true,
}

func (h *SuggestionHandlers) Submit(c *gin.Context) {
	if h.Mailer == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "servicio de sugerencias no disponible"})
		return
	}

	var req suggestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos invalidos"})
		return
	}

	req.Type = strings.ToLower(strings.TrimSpace(req.Type))
	if !validSuggestionTypes[req.Type] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tipo de sugerencia invalido"})
		return
	}

	req.Description = strings.TrimSpace(req.Description)
	if req.Description == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "la descripcion no puede estar vacia"})
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		name = "Anonimo"
	}

	if err := h.Mailer.SendSuggestion(name, strings.TrimSpace(req.Email), req.Type, req.Description, h.ToEmail); err != nil {
		slog.Error("failed to send suggestion email", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo enviar la sugerencia"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "sugerencia enviada"})
}
