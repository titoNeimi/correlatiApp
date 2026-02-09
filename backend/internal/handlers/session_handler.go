package handlers

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/services"
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RevokeSession(c *gin.Context) {
	id := c.Param("id")

	sessions := services.New(db.Db, 0)
	deleted, user, err := sessions.DeleteSessionByUserId(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if err != nil {
		slog.Error("Error deleting the user sessions", "userId", id, slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "An error has occurred while deleting the user sessions"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{
		"message": "User sessions deleted",
		"deleted": deleted,
	})
	slog.Info("User session have been deleted", slog.Any("User: ", user), slog.Int64("DeletedRows:", deleted))
}
