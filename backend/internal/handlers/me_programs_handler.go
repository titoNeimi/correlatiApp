package handlers

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/models"
	"acadifyapp/internal/services"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

type meProgramsResponse struct {
	EnrolledProgramIds []string               `json:"enrolledProgramIds"`
	FavoriteProgramIds []string               `json:"favoriteProgramIds"`
	EnrolledPrograms   []models.DegreeProgram `json:"enrolledPrograms"`
	FavoritePrograms   []models.DegreeProgram `json:"favoritePrograms"`
}

func GetMyPrograms(c *gin.Context) {
	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	user := u.(models.User)

	var userWithPrograms models.User
	if err := db.Db.Where("id = ?", user.ID).
		Preload("DegreePrograms.University").
		Preload("FavoritePrograms.University").
		First(&userWithPrograms).Error; err != nil {
		slog.Error("Error loading user favorites", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error loading favorites"})
		return
	}

	enrolledIds := make([]string, 0, len(userWithPrograms.DegreePrograms))
	enrolledPrograms := make([]models.DegreeProgram, 0, len(userWithPrograms.DegreePrograms))
	for _, dp := range userWithPrograms.DegreePrograms {
		enrolledIds = append(enrolledIds, dp.ID)
		enrolledPrograms = append(enrolledPrograms, *dp)
	}

	favoriteIds := make([]string, 0, len(userWithPrograms.FavoritePrograms))
	favoritePrograms := make([]models.DegreeProgram, 0, len(userWithPrograms.FavoritePrograms))
	for _, dp := range userWithPrograms.FavoritePrograms {
		favoriteIds = append(favoriteIds, dp.ID)
		favoritePrograms = append(favoritePrograms, *dp)
	}

	c.IndentedJSON(http.StatusOK, meProgramsResponse{
		EnrolledProgramIds: enrolledIds,
		FavoriteProgramIds: favoriteIds,
		EnrolledPrograms:   enrolledPrograms,
		FavoritePrograms:   favoritePrograms,
	})
}

func EnrollProgram(c *gin.Context) {
	id, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var degreeProgram models.DegreeProgram

	err = db.Db.Where("id = ?", id).First(&degreeProgram).Error
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

	var userWithPrograms models.User
	if err := db.Db.Where("id = ?", user.ID).Preload("DegreePrograms").First(&userWithPrograms).Error; err != nil {
		slog.Error("Error loading user programs", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error loading user programs"})
		return
	}

	for _, dp := range userWithPrograms.DegreePrograms {
		if dp.ID == id {
			c.IndentedJSON(http.StatusConflict, gin.H{"ok": false, "error": "Already enrolled"})
			return
		}
	}

	degreeProgramIDs := make([]string, 0, len(userWithPrograms.DegreePrograms)+1)
	for _, dp := range userWithPrograms.DegreePrograms {
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
	id, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var degreeProgram models.DegreeProgram

	err = db.Db.Where("id = ?", id).First(&degreeProgram).Error
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

	var userWithPrograms models.User
	if err := db.Db.Where("id = ?", user.ID).Preload("DegreePrograms").First(&userWithPrograms).Error; err != nil {
		slog.Error("Error loading user programs", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error loading user programs"})
		return
	}

	remainingProgramIDs := make([]string, 0, len(userWithPrograms.DegreePrograms))
	wasEnrolled := false
	for _, dp := range userWithPrograms.DegreePrograms {
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

func FavoriteProgram(c *gin.Context) {
	id, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var degreeProgram models.DegreeProgram
	if err := db.Db.Where("id = ?", id).First(&degreeProgram).Error; err != nil {
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

	var userWithFavorites models.User
	if err := db.Db.Where("id = ?", user.ID).Preload("FavoritePrograms").First(&userWithFavorites).Error; err != nil {
		slog.Error("Error loading user favorites", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error loading favorites"})
		return
	}

	for _, dp := range userWithFavorites.FavoritePrograms {
		if dp.ID == id {
			c.IndentedJSON(http.StatusConflict, gin.H{"ok": false, "error": "Already favorited"})
			return
		}
	}

	if err := db.Db.Model(&userWithFavorites).Association("FavoritePrograms").Append(&degreeProgram); err != nil {
		slog.Error("Error favoriting program", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error favoriting program"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}

func UnfavoriteProgram(c *gin.Context) {
	id, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var degreeProgram models.DegreeProgram
	if err := db.Db.Where("id = ?", id).First(&degreeProgram).Error; err != nil {
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

	var userWithFavorites models.User
	if err := db.Db.Where("id = ?", user.ID).Preload("FavoritePrograms").First(&userWithFavorites).Error; err != nil {
		slog.Error("Error loading user favorites", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error loading favorites"})
		return
	}

	found := false
	for _, dp := range userWithFavorites.FavoritePrograms {
		if dp.ID == id {
			found = true
			break
		}
	}
	if !found {
		c.IndentedJSON(http.StatusConflict, gin.H{"ok": false, "error": "Not favorited"})
		return
	}

	if err := db.Db.Model(&userWithFavorites).Association("FavoritePrograms").Delete(&degreeProgram); err != nil {
		slog.Error("Error removing favorite", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error removing favorite"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}
