package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreateElectivePoolDTO struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type UpdateElectivePoolDTO struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}

type PoolSubjectDTO struct {
	SubjectID string `json:"subject_id"`
}

func CreateElectivePool(c *gin.Context) {
	programID := c.Param("id")

	var degreeProgram models.DegreeProgram
	if err := db.Db.Where("id = ?", programID).First(&degreeProgram).Error; err != nil {
		slog.Error("Program not found", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Program not found"})
		return
	}

	var req CreateElectivePoolDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros inválidos"})
		return
	}
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name es requerido"})
		return
	}

	pool := models.ElectivePool{
		ID:              uuid.NewString(),
		DegreeProgramID: degreeProgram.ID,
		Name:            req.Name,
	}
	if req.Description != nil {
		pool.Description = *req.Description
	}

	if err := db.Db.Create(&pool).Error; err != nil {
		slog.Error("Error creating elective pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error creating elective pool"})
		return
	}

	c.IndentedJSON(http.StatusCreated, pool)
}

func GetElectivePoolsByProgram(c *gin.Context) {
	programID := c.Param("id")

	var degreeProgram models.DegreeProgram
	if err := db.Db.Where("id = ?", programID).First(&degreeProgram).Error; err != nil {
		slog.Error("Program not found", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Program not found"})
		return
	}

	var pools []models.ElectivePool
	if err := db.Db.Where("degree_program_id = ?", degreeProgram.ID).Preload("Subjects").Find(&pools).Error; err != nil {
		slog.Error("Error fetching elective pools", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective pools"})
		return
	}

	c.IndentedJSON(http.StatusOK, pools)
}

func GetElectivePoolByID(c *gin.Context) {
	programID := c.Param("id")
	poolID := c.Param("poolId")

	var pool models.ElectivePool
	if err := db.Db.Where("id = ? AND degree_program_id = ?", poolID, programID).Preload("Subjects").First(&pool).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Pool not found"})
			return
		}
		slog.Error("Error fetching elective pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective pool"})
		return
	}

	c.IndentedJSON(http.StatusOK, pool)
}

func UpdateElectivePool(c *gin.Context) {
	programID := c.Param("id")
	poolID := c.Param("poolId")

	var pool models.ElectivePool
	if err := db.Db.Where("id = ? AND degree_program_id = ?", poolID, programID).First(&pool).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Pool not found"})
			return
		}
		slog.Error("Error fetching elective pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective pool"})
		return
	}

	var req UpdateElectivePoolDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros inválidos"})
		return
	}

	if req.Name != nil && *req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name no puede ser vacío"})
		return
	}

	if req.Name != nil {
		pool.Name = *req.Name
	}
	if req.Description != nil {
		pool.Description = *req.Description
	}

	if err := db.Db.Save(&pool).Error; err != nil {
		slog.Error("Error updating elective pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error updating elective pool"})
		return
	}

	c.IndentedJSON(http.StatusOK, pool)
}

func DeleteElectivePool(c *gin.Context) {
	programID := c.Param("id")
	poolID := c.Param("poolId")

	var pool models.ElectivePool
	if err := db.Db.Where("id = ? AND degree_program_id = ?", poolID, programID).First(&pool).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Pool not found"})
			return
		}
		slog.Error("Error fetching elective pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective pool"})
		return
	}

	if err := db.Db.Delete(&pool).Error; err != nil {
		slog.Error("Error deleting elective pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error deleting elective pool"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}

func AddSubjectToElectivePool(c *gin.Context) {
	programID := c.Param("id")
	poolID := c.Param("poolId")

	var pool models.ElectivePool
	if err := db.Db.Where("id = ? AND degree_program_id = ?", poolID, programID).First(&pool).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Pool not found"})
			return
		}
		slog.Error("Error fetching elective pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective pool"})
		return
	}

	var req PoolSubjectDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros inválidos"})
		return
	}
	if req.SubjectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "subject_id es requerido"})
		return
	}

	var subject models.Subject
	if err := db.Db.Where("id = ?", req.SubjectID).First(&subject).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Subject not found"})
			return
		}
		slog.Error("Error fetching subject", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching subject"})
		return
	}
	if subject.DegreeProgramID != programID {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": "Subject no pertenece al degreeProgram"})
		return
	}

	var link models.ElectivePoolSubject
	if err := db.Db.Where("elective_pool_id = ? AND subject_id = ?", pool.ID, subject.ID).First(&link).Error; err == nil {
		c.IndentedJSON(http.StatusConflict, gin.H{"ok": false, "error": "Subject ya está en el pool"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		slog.Error("Error checking pool subject", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error checking pool subject"})
		return
	}

	newLink := models.ElectivePoolSubject{
		ElectivePoolID: pool.ID,
		SubjectID:      subject.ID,
	}
	if err := db.Db.Create(&newLink).Error; err != nil {
		slog.Error("Error adding subject to pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error adding subject to pool"})
		return
	}

	c.IndentedJSON(http.StatusCreated, newLink)
}

func RemoveSubjectFromElectivePool(c *gin.Context) {
	programID := c.Param("id")
	poolID := c.Param("poolId")
	subjectID := c.Param("subjectId")

	var pool models.ElectivePool
	if err := db.Db.Where("id = ? AND degree_program_id = ?", poolID, programID).First(&pool).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Pool not found"})
			return
		}
		slog.Error("Error fetching elective pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective pool"})
		return
	}

	var link models.ElectivePoolSubject
	if err := db.Db.Where("elective_pool_id = ? AND subject_id = ?", pool.ID, subjectID).First(&link).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Subject no está en el pool"})
			return
		}
		slog.Error("Error fetching pool subject", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching pool subject"})
		return
	}

	if err := db.Db.Delete(&link).Error; err != nil {
		slog.Error("Error removing subject from pool", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error removing subject from pool"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}
