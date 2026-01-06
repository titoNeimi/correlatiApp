package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type createUniversityRequest struct {
	Name     string `json:"name" binding:"required"`
	Location string `json:"location"`
	Website  string `json:"website"`
}

func CreateUniversity(c *gin.Context) {
	var req createUniversityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	var exists int64
	if err := db.Db.Model(&models.University{}).Where("name = ?", name).Count(&exists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error checking university"})
		return
	}
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "university already exists"})
		return
	}

	university := models.University{
		ID:       uuid.NewString(),
		Name:     name,
		Location: strings.TrimSpace(req.Location),
		Website:  strings.TrimSpace(req.Website),
	}

	if err := db.Db.Create(&university).Error; err != nil {
		slog.Error("Error creating university", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create university"})
		return
	}

	c.JSON(http.StatusCreated, university)
}

func GetAllUniversities(c *gin.Context) {
	var universities []models.University
	if err := db.Db.Preload("DegreePrograms").Find(&universities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error loading universities"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": len(universities), "data": universities})
}

func GetUniversityByID(c *gin.Context) {
	id := c.Param("id")
	var university models.University
	if err := db.Db.Preload("DegreePrograms").First(&university, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "university not found"})
		return
	}
	c.JSON(http.StatusOK, university)
}

func UpdateUniversity(c *gin.Context) {
	id := c.Param("id")
	var payload models.UniversityUpdateDTO
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	updates := make(map[string]interface{})
	if payload.Name != nil {
		name := strings.TrimSpace(*payload.Name)
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name cannot be empty"})
			return
		}
		updates["name"] = name
	}
	if payload.Location != nil {
		updates["location"] = strings.TrimSpace(*payload.Location)
	}
	if payload.Website != nil {
		updates["website"] = strings.TrimSpace(*payload.Website)
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	tx := db.Db.Model(&models.University{}).Where("id = ?", id).Updates(updates)
	if tx.Error != nil {
		slog.Error("Error updating university", slog.Any("error", tx.Error))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
		return
	}
	if tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "university not found"})
		return
	}

	var university models.University
	if err := db.Db.Preload("DegreePrograms").First(&university, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error loading updated university"})
		return
	}

	c.JSON(http.StatusOK, university)
}

func DeleteUniversity(c *gin.Context) {
	id := c.Param("id")
	tx := db.Db.Delete(&models.University{}, "id = ?", id)
	if tx.Error != nil {
		slog.Error("Error deleting university", slog.Any("error", tx.Error))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete university"})
		return
	}
	if tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "university not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": true})
}
