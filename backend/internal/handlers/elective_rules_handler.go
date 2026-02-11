package handlers

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/models"
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreateElectiveRuleDTO struct {
	PoolID          string                         `json:"pool_id"`
	AppliesFromYear int                            `json:"applies_from_year" gorm:"not null"`
	AppliesToYear   *int                           `json:"applies_to_year,omitempty"`
	RequirementType models.ElectiveRequirementType `json:"requirement_type" gorm:"type:enum('hours','credits','subject_count');not null"`
	MinimumValue    float64                        `json:"minimum_value" gorm:"not null"`
}

type UpdateElectiveRuleDTO struct {
	PoolID          *string                         `json:"pool_id,omitempty"`
	AppliesFromYear *int                            `json:"applies_from_year,omitempty"`
	AppliesToYear   *int                            `json:"applies_to_year,omitempty"`
	RequirementType *models.ElectiveRequirementType `json:"requirement_type,omitempty"`
	MinimumValue    *float64                        `json:"minimum_value,omitempty"`
}

func CreateElectiveRule(c *gin.Context) {
	id, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}
	if !ensureProgramWriteAccess(c, id) {
		return
	}

	var degreeProgram models.DegreeProgram
	var req CreateElectiveRuleDTO

	err = db.Db.Where("id = ?", id).First(&degreeProgram).Error
	if err != nil {
		slog.Error("Program not found", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Program not found"})
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros inválidos"})
		return
	}

	poolID, err := validateID(req.PoolID, "pool_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.AppliesFromYear <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "applies_from_year debe ser mayor que 0"})
		return
	}
	if req.AppliesToYear != nil && *req.AppliesToYear < req.AppliesFromYear {
		c.JSON(http.StatusBadRequest, gin.H{"error": "applies_to_year no puede ser menor que applies_from_year"})
		return
	}
	if req.MinimumValue <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "minimum_value debe ser mayor que 0"})
		return
	}
	switch req.RequirementType {
	case models.RequirementHours, models.RequirementCredits, models.RequirementSubjectCount:
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "requirement_type inválido"})
		return
	}

	var pool models.ElectivePool
	if err := db.Db.Where("id = ?", poolID).First(&pool).Error; err != nil {
		slog.Error("Pool not found", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Pool not found"})
		return
	}
	if pool.DegreeProgramID != degreeProgram.ID {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": "Pool no pertenece al degreeProgram"})
		return
	}

	rule := models.ElectiveRule{
		ID:              uuid.NewString(),
		DegreeProgramID: degreeProgram.ID,
		PoolID:          poolID,
		AppliesFromYear: req.AppliesFromYear,
		AppliesToYear:   req.AppliesToYear,
		RequirementType: req.RequirementType,
		MinimumValue:    req.MinimumValue,
	}

	if err := db.Db.Create(&rule).Error; err != nil {
		slog.Error("Error creating elective rule", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error creating elective rule"})
		return
	}

	c.IndentedJSON(http.StatusCreated, rule)
}

func GetElectiveRulesByProgram(c *gin.Context) {
	programID, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var degreeProgram models.DegreeProgram
	if err := db.Db.Where("id = ?", programID).First(&degreeProgram).Error; err != nil {
		slog.Error("Program not found", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Program not found"})
		return
	}

	var rules []models.ElectiveRule
	if err := db.Db.Where("degree_program_id = ?", degreeProgram.ID).Preload("Pool").Find(&rules).Error; err != nil {
		slog.Error("Error fetching elective rules", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective rules"})
		return
	}

	c.IndentedJSON(http.StatusOK, rules)
}

func GetElectiveRuleByID(c *gin.Context) {
	programID, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}
	ruleID, err := validateID(c.Param("ruleId"), "rule_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var rule models.ElectiveRule
	if err := db.Db.Where("id = ? AND degree_program_id = ?", ruleID, programID).Preload("Pool").First(&rule).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Rule not found"})
			return
		}
		slog.Error("Error fetching elective rule", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective rule"})
		return
	}

	c.IndentedJSON(http.StatusOK, rule)
}

func UpdateElectiveRule(c *gin.Context) {
	programID, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}
	if !ensureProgramWriteAccess(c, programID) {
		return
	}
	ruleID, err := validateID(c.Param("ruleId"), "rule_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var rule models.ElectiveRule
	if err := db.Db.Where("id = ? AND degree_program_id = ?", ruleID, programID).First(&rule).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Rule not found"})
			return
		}
		slog.Error("Error fetching elective rule", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective rule"})
		return
	}

	var req UpdateElectiveRuleDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros inválidos"})
		return
	}

	if req.PoolID != nil {
		poolID, err := validateRequiredString(*req.PoolID, "pool_id", maxIDLen)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		req.PoolID = &poolID
	}
	if req.MinimumValue != nil && *req.MinimumValue <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "minimum_value debe ser mayor que 0"})
		return
	}
	if req.RequirementType != nil {
		switch *req.RequirementType {
		case models.RequirementHours, models.RequirementCredits, models.RequirementSubjectCount:
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "requirement_type inválido"})
			return
		}
	}

	nextAppliesFrom := rule.AppliesFromYear
	nextAppliesTo := rule.AppliesToYear
	if req.AppliesFromYear != nil {
		if *req.AppliesFromYear <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "applies_from_year debe ser mayor que 0"})
			return
		}
		nextAppliesFrom = *req.AppliesFromYear
	}
	if req.AppliesToYear != nil {
		nextAppliesTo = req.AppliesToYear
	}
	if nextAppliesTo != nil && *nextAppliesTo < nextAppliesFrom {
		c.JSON(http.StatusBadRequest, gin.H{"error": "applies_to_year no puede ser menor que applies_from_year"})
		return
	}

	if req.PoolID != nil {
		var pool models.ElectivePool
		if err := db.Db.Where("id = ?", *req.PoolID).First(&pool).Error; err != nil {
			slog.Error("Pool not found", slog.Any("error: ", err))
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Pool not found"})
			return
		}
		if pool.DegreeProgramID != rule.DegreeProgramID {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": "Pool no pertenece al degreeProgram"})
			return
		}
		rule.PoolID = *req.PoolID
	}
	if req.AppliesFromYear != nil {
		rule.AppliesFromYear = *req.AppliesFromYear
	}
	if req.AppliesToYear != nil {
		rule.AppliesToYear = req.AppliesToYear
	}
	if req.RequirementType != nil {
		rule.RequirementType = *req.RequirementType
	}
	if req.MinimumValue != nil {
		rule.MinimumValue = *req.MinimumValue
	}

	if err := db.Db.Save(&rule).Error; err != nil {
		slog.Error("Error updating elective rule", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error updating elective rule"})
		return
	}

	c.IndentedJSON(http.StatusOK, rule)
}

func DeleteElectiveRule(c *gin.Context) {
	programID, err := validateID(c.Param("id"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}
	if !ensureProgramWriteAccess(c, programID) {
		return
	}
	ruleID, err := validateID(c.Param("ruleId"), "rule_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var rule models.ElectiveRule
	if err := db.Db.Where("id = ? AND degree_program_id = ?", ruleID, programID).First(&rule).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"ok": false, "error": "Rule not found"})
			return
		}
		slog.Error("Error fetching elective rule", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error fetching elective rule"})
		return
	}

	if err := db.Db.Delete(&rule).Error; err != nil {
		slog.Error("Error deleting elective rule", slog.Any("error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "Error deleting elective rule"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}
