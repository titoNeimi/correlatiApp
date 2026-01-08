package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"correlatiApp/internal/services"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

func EnrollProgram(c *gin.Context) {
	id := c.Param("id")

	slog.Info(id)

	var degreeProgram models.DegreeProgram

	err := db.Db.Where("id = ?", id).First(&degreeProgram).Error
	if err != nil {
		slog.Error("Program not found", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Program not found"})
		return
	}

	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	user := u.(models.User)

	for _, dp := range user.DegreePrograms {
		if dp.ID == id {
			c.IndentedJSON(http.StatusConflict, gin.H{"ok": false, "error": "Already enrolled"})
			return
		}
	}

	degreeProgramIDs := make([]string, 0, len(user.DegreePrograms)+1)
	for _, dp := range user.DegreePrograms {
		degreeProgramIDs = append(degreeProgramIDs, dp.ID)
	}
	degreeProgramIDs = append(degreeProgramIDs, id)

	dto := models.UserUpdateDTO{DegreeProgramsID: &degreeProgramIDs}
	if _, err := services.UpdateUser(user.ID, dto); err != nil {
		slog.Error("Error enrolling user in program", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error enrolling user"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}

func UnenrollProgram(c *gin.Context) {
	id := c.Param("id")

	var degreeProgram models.DegreeProgram

	err := db.Db.Where("id = ?", id).First(&degreeProgram).Error
	if err != nil {
		slog.Error("Program not found", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Program not found"})
		return
	}

	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	user := u.(models.User)

	remainingProgramIDs := make([]string, 0, len(user.DegreePrograms))
	wasEnrolled := false
	for _, dp := range user.DegreePrograms {
		if dp.ID == id {
			wasEnrolled = true
			continue
		}
		remainingProgramIDs = append(remainingProgramIDs, dp.ID)
	}

	if !wasEnrolled {
		c.IndentedJSON(http.StatusConflict, gin.H{"ok": false, "error": "Not enrolled"})
		return
	}

	dto := models.UserUpdateDTO{DegreeProgramsID: &remainingProgramIDs}
	if _, err := services.UpdateUser(user.ID, dto); err != nil {
		slog.Error("Error unenrolling user from program", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error unenrolling user"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}
