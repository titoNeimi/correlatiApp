package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetAllPrograms(c *gin.Context) {
	var programs *[]models.DegreeProgram

	err := db.Db.Model(&models.DegreeProgram{}).Preload("Subjects").Preload("University").Find(&programs).Error
	if err != nil {
		slog.Error("Error getting all the programs from db", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, "An error ocurred while getting the programs")
		return
	}
	c.IndentedJSON(http.StatusOK, programs)
}

func CreateProgram(c *gin.Context) {
	var payload struct {
		Name            string `json:"name"`
		UniversityID    string `json:"universityID"`
		PublicRequested bool   `json:"publicRequested"`
	}

	if err := c.BindJSON(&payload); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("error", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	if payload.UniversityID == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "UniversityID is required"})
		return
	}
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Name == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	if err := db.Db.First(&models.University{}, "id = ?", payload.UniversityID).Error; err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "University not found"})
		return
	}

	newProgram := &models.DegreeProgram{
		ID:              uuid.New().String(),
		Name:            payload.Name,
		UniversityID:    payload.UniversityID,
		ApprovalStatus:  models.DegreeProgramPending,
		PublicRequested: payload.PublicRequested,
	}

	result := db.Db.Create(newProgram)
	if result.Error != nil {
		slog.Error("Error creating the degree program", slog.Any("error", result.Error))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Error creating the degree program"})
		return
	}

	if u, ok := c.Get("user"); ok {
		if user, ok := u.(models.User); ok {
			_ = db.Db.Model(&user).Association("DegreePrograms").Append(newProgram)
		}
	}
	slog.Info("Degree program created", "id", newProgram.ID)
	c.IndentedJSON(http.StatusCreated, newProgram)
}

func GetProgramById(c *gin.Context) {
	id := c.Param("id")
	var program *models.DegreeProgram

	if err := db.Db.Preload("Subjects").Preload("University").Where("id = ?", id).First(&program).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	if !canViewProgram(c, program) {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	c.IndentedJSON(http.StatusOK, program)

}

func UpdateProgram(c *gin.Context) {
	id := c.Param("id")

	updates := map[string]interface{}{}
	var updatedProgram *models.DegreeProgram

	if err := c.BindJSON(&updates); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("Error: ", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	delete(updates, "approvalStatus")
	delete(updates, "publicRequested")

	if err := db.Db.Where("id = ?", id).First(&updatedProgram).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	if raw, ok := updates["universityID"]; ok {
		if uid, ok := raw.(string); ok && uid != "" {
			if err := db.Db.First(&models.University{}, "id = ?", uid).Error; err != nil {
				c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "University not found"})
				return
			}
		} else {
			delete(updates, "universityID")
		}
	}

	if err := db.Db.Model(&updatedProgram).Updates(updates).Error; err != nil {
		slog.Error("Error updating the program from db", "programID", id, slog.Any("Error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error updating the program"})
		return
	}

	if err := db.Db.Preload("Subjects").Preload("University").Where("id = ?", id).First(&updatedProgram).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Error getting the program after the update"})
		return
	}

	c.IndentedJSON(http.StatusOK, updatedProgram)

}

func DeleteProgram(c *gin.Context) {
	id := c.Param("id")

	var program *models.DegreeProgram

	if err := db.Db.Where("id = ?", id).First(&program).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	if err := db.Db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM user_degree_programs WHERE degree_program_id = ?", id).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM user_favorite_programs WHERE degree_program_id = ?", id).Error; err != nil {
			return err
		}
		if err := tx.Exec(
			"DELETE FROM elective_pool_subjects WHERE elective_pool_id IN (SELECT id FROM elective_pools WHERE degree_program_id = ?)",
			id,
		).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM elective_rules WHERE degree_program_id = ?", id).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM elective_pools WHERE degree_program_id = ?", id).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM subjects WHERE degree_program_id = ?", id).Error; err != nil {
			return err
		}
		if err := tx.Delete(&models.DegreeProgram{}, "id = ?", id).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		slog.Error("Error deleting the program from db", "programID", id, slog.Any("Error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error deleting the program"})
		return
	}

	slog.Info("A program has been deleted ", "id: ", id)
	c.IndentedJSON(http.StatusOK, "Program deleted")
}

func GetAllDegreeProgramsWithSubjects(c *gin.Context) {
	var degreePrograms []models.DegreeProgram

	page, limit, offset := parsePagination(c)

	// Preload incluye las materias relacionadas
	query := db.Db.Model(&models.DegreeProgram{})
	if !isAdminOrStaff(c) {
		query = query.Where("approval_status = ? AND public_requested = TRUE", models.DegreeProgramApproved)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error getting all the degrees",
			"message": err.Error(),
		})
		return
	}

	result := query.Preload("Subjects").Preload("University").Limit(limit).Offset(offset).Find(&degreePrograms)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error getting all the degrees",
			"message": result.Error.Error(),
		})
		return
	}

	// requirements de cada materia
	/*
		result = db.Db.Preload("Subjects.Requirements").Find(&degreePrograms)
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Error getting al the dregrees programs with their requirements",
				"message": result.Error.Error(),
			})
			return
		}
	*/

	c.JSON(http.StatusOK, gin.H{
		"count": total,
		"page":  page,
		"limit": limit,
		"data":  degreePrograms,
	})
}

func ApproveProgram(c *gin.Context) {
	id := c.Param("id")

	tx := db.Db.Model(&models.DegreeProgram{}).
		Where("id = ?", id).
		Update("approval_status", models.DegreeProgramApproved)
	if tx.Error != nil {
		slog.Error("Error approving the program", "programID", id, slog.Any("error", tx.Error))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error approving the program"})
		return
	}
	if tx.RowsAffected == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	var program models.DegreeProgram
	if err := db.Db.Preload("Subjects").Preload("University").First(&program, "id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error loading approved program"})
		return
	}

	c.IndentedJSON(http.StatusOK, program)
}

func PublishProgram(c *gin.Context) {
	id := c.Param("id")

	tx := db.Db.Model(&models.DegreeProgram{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"approval_status":  models.DegreeProgramApproved,
			"public_requested": true,
		})
	if tx.Error != nil {
		slog.Error("Error publishing the program", "programID", id, slog.Any("error", tx.Error))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error publishing the program"})
		return
	}
	if tx.RowsAffected == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	var program models.DegreeProgram
	if err := db.Db.Preload("Subjects").Preload("University").First(&program, "id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error loading published program"})
		return
	}

	c.IndentedJSON(http.StatusOK, program)
}

func UnapproveProgram(c *gin.Context) {
	id := c.Param("id")

	tx := db.Db.Model(&models.DegreeProgram{}).
		Where("id = ?", id).
		Update("approval_status", models.DegreeProgramPending)
	if tx.Error != nil {
		slog.Error("Error unapproving the program", "programID", id, slog.Any("error", tx.Error))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error unapproving the program"})
		return
	}
	if tx.RowsAffected == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	var program models.DegreeProgram
	if err := db.Db.Preload("Subjects").Preload("University").First(&program, "id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error loading unapproved program"})
		return
	}

	c.IndentedJSON(http.StatusOK, program)
}

func UnpublishProgram(c *gin.Context) {
	id := c.Param("id")

	tx := db.Db.Model(&models.DegreeProgram{}).
		Where("id = ?", id).
		Update("public_requested", false)
	if tx.Error != nil {
		slog.Error("Error unpublishing the program", "programID", id, slog.Any("error", tx.Error))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error unpublishing the program"})
		return
	}
	if tx.RowsAffected == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	var program models.DegreeProgram
	if err := db.Db.Preload("Subjects").Preload("University").First(&program, "id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error loading unpublished program"})
		return
	}

	c.IndentedJSON(http.StatusOK, program)
}

func isAdminOrStaff(c *gin.Context) bool {
	u, ok := c.Get("user")
	if !ok {
		return false
	}
	user, ok := u.(models.User)
	if !ok {
		return false
	}
	return user.Role == "admin" || user.Role == "staff"
}

func canViewProgram(c *gin.Context, program *models.DegreeProgram) bool {
	if program.ApprovalStatus == models.DegreeProgramApproved && program.PublicRequested {
		return true
	}
	if isAdminOrStaff(c) {
		return true
	}
	u, ok := c.Get("user")
	if !ok {
		return false
	}
	user, ok := u.(models.User)
	if !ok {
		return false
	}
	var count int64
	_ = db.Db.Table("user_degree_programs").
		Where("user_id = ? AND degree_program_id = ?", user.ID, program.ID).
		Count(&count).Error
	return count > 0
}
