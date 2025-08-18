package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetAllSubjectsFromProgram (c *gin.Context){
	programID := c.Param("programId")

	var subjects *[]models.Subject

	result := db.Db.Preload("Requirements").Where("degree_program_id = ?", programID).Find(&subjects)

	if result.Error != nil {
			c.IndentedJSON(http.StatusNotFound, gin.H{"error":"Program not found"})
			return
	}

	c.IndentedJSON(http.StatusOK, subjects)
}
func DeleteSubject (c *gin.Context){
	id := c.Param("id")

	var subject *models.Subject

	if err := db.Db.Where("id = ?", id).Find(&subject).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Subject not found"})
		return
	}

	if err := db.Db.Delete(&subject).Error; err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "An error has ocurred while deleting the subject"})
		slog.Error("An error has ocurred while deleting the subject, ID: ", id , slog.Any("Error: ", err))
		return
	}

	c.IndentedJSON(http.StatusOK, "The subject was deleted")
}
func UpdateSubject(c *gin.Context) {
  id := c.Param("id")

  var dto models.SubjectUpdateDTO
  if err := c.BindJSON(&dto); err != nil {
    c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
      return
  }

  var subject models.Subject
  if err := db.Db.Where("id = ?", id).First(&subject).Error; err != nil {
      c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Subject not found"})
      return
  }

  if err := db.Db.Model(&subject).Updates(dto).Error; err != nil {
    c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error updating the subject"})
    return
  }

  if dto.RequirementIDs != nil {
    if len(*dto.RequirementIDs) == 0 {
      if err := db.Db.Model(&subject).Association("Requirements").Clear(); err != nil {
        c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error clearing requirements"})
        return
        }
      } else {
					var reqs []models.Subject
          if err := db.Db.Where("id IN ?", *dto.RequirementIDs).Find(&reqs).Error; err != nil {
            c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Some requirement IDs are invalid"})
            return
          }
          if err := db.Db.Model(&subject).Association("Requirements").Replace(&reqs); err != nil {
            c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error updating requirements"})
            return
          }
      }
	}

    if err := db.Db.Preload("Requirements").Where("id = ?", id).First(&subject).Error; err != nil {
      c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Updated subject not found"})
      return
    }
    c.IndentedJSON(http.StatusOK, subject)
}

func CreateSubject (c *gin.Context){
	var subject *models.Subject
	
		if err := c.BindJSON(&subject); err != nil {
			slog.Error("Error getting the json from the body", slog.Any("error", err))
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error":"invalid JSON"})
		return
	}
	subject.ID = uuid.New().String()

	result := db.Db.Create(&subject)
	if result.Error != nil {
			slog.Error("Error creating the subject", slog.Any("error", result.Error))
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error":"Error creating the subject"})
			return
	}
	c.IndentedJSON(http.StatusCreated, subject)
}