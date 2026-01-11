package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type requirementInput struct {
	ID        string `json:"id"`
	MinStatus string `json:"minStatus"` // "passed" | "final_pending"
}

type createSubjectDTO struct {
	Name            string             `json:"name" binding:"required"`
	Year            *int               `json:"year,omitempty"`
	DegreeProgramID string             `json:"degreeProgramID" binding:"required"`
	Requirements    []requirementInput `json:"requirements"`
}

type updateSubjectDTO struct {
	Name            *string             `json:"name,omitempty"`
	Year            *int                `json:"year,omitempty"`
	DegreeProgramID *string             `json:"degreeProgramID,omitempty"`
	Requirements    *[]requirementInput `json:"requirements,omitempty"`
}

func GetAllSubjectsFromProgram(c *gin.Context) {
	programID := c.Param("programId")

	var subjects []models.Subject
	result := db.Db.Preload("Requirements").Where("degree_program_id = ?", programID).Find(&subjects) // :contentReference[oaicite:2]{index=2}
	if result.Error != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	type requirementWithStatus struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		MinStatus string `json:"minStatus"`
	}

	type subjectWithRequirements struct {
		ID              string                  `json:"id"`
		Name            string                  `json:"name"`
		Year            *int                    `json:"year,omitempty"`
		DegreeProgramID string                  `json:"degreeProgramID"`
		Requirements    []requirementWithStatus `json:"requirements"`
		CreatedAt       time.Time               `json:"created_at"`
		UpdatedAt       time.Time               `json:"updated_at"`
	}

	subjectIDs := make([]string, 0, len(subjects))
	for _, subject := range subjects {
		subjectIDs = append(subjectIDs, subject.ID)
	}

	reqStatusBySubject := make(map[string]map[string]models.RequirementMinStatus)
	if len(subjectIDs) > 0 {
		var requirementRows []models.SubjectRequirement
		if err := db.Db.Where("subject_id IN ?", subjectIDs).Find(&requirementRows).Error; err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error loading subject requirements"})
			return
		}
		for _, row := range requirementRows {
			if _, ok := reqStatusBySubject[row.SubjectID]; !ok {
				reqStatusBySubject[row.SubjectID] = make(map[string]models.RequirementMinStatus)
			}
			reqStatusBySubject[row.SubjectID][row.RequirementID] = row.MinStatus
		}
	}

	response := make([]subjectWithRequirements, 0, len(subjects))
	for _, subject := range subjects {
		requirements := make([]requirementWithStatus, 0, len(subject.Requirements))
		for _, req := range subject.Requirements {
			status := reqStatusBySubject[subject.ID][req.ID]
			if status == "" {
				status = models.ReqPassed
			}
			requirements = append(requirements, requirementWithStatus{
				ID:        req.ID,
				Name:      req.Name,
				MinStatus: string(status),
			})
		}
		response = append(response, subjectWithRequirements{
			ID:              subject.ID,
			Name:            subject.Name,
			Year:            subject.Year,
			DegreeProgramID: subject.DegreeProgramID,
			Requirements:    requirements,
			CreatedAt:       subject.CreatedAt,
			UpdatedAt:       subject.UpdatedAt,
		})
	}

	c.IndentedJSON(http.StatusOK, response)
}

func CreateSubject(c *gin.Context) {
	var dto createSubjectDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("error", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	// Validación FK: degree_program_id no puede venir vacío (tu error 1452 venía de eso)
	if dto.DegreeProgramID == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "degreeProgramID is required"})
		return
	}

	subject := models.Subject{
		ID:              uuid.New().String(),
		Name:            dto.Name,
		Year:            dto.Year,
		DegreeProgramID: dto.DegreeProgramID,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	err := db.Db.Transaction(func(tx *gorm.DB) error {
		// 1) Crear materia
		if err := tx.Create(&subject).Error; err != nil {
			return err
		}

		// 2) Insertar correlativas con regla en subject_requirements
		if len(dto.Requirements) > 0 {
			// Validar que existan las materias requeridas
			ids := make([]string, 0, len(dto.Requirements))
			for _, r := range dto.Requirements {
				if r.ID != "" {
					ids = append(ids, r.ID)
				}
			}

			var reqSubjects []models.Subject
			if err := tx.Where("id IN ?", ids).Find(&reqSubjects).Error; err != nil {
				return err
			}
			if len(reqSubjects) != len(ids) {
				return gorm.ErrRecordNotFound
			}

			rows := make([]models.SubjectRequirement, 0, len(dto.Requirements))
			for _, r := range dto.Requirements {
				min := r.MinStatus
				if min == "" {
					min = "passed"
				}
				rows = append(rows, models.SubjectRequirement{
					SubjectID:     subject.ID,
					RequirementID: r.ID,
					MinStatus:     models.RequirementMinStatus(min), // <-- requiere que el modelo tenga este campo
				})
			}

			if err := tx.Create(&rows).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		slog.Error("Error creating the subject", slog.Any("error", err))
		if err == gorm.ErrRecordNotFound {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Some requirement IDs are invalid"})
			return
		}
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error creating the subject"})
		return
	}

	// devolver con requirements preloaded
	if err := db.Db.Preload("Requirements").Where("id = ?", subject.ID).First(&subject).Error; err != nil {
		c.IndentedJSON(http.StatusCreated, subject)
		return
	}
	c.IndentedJSON(http.StatusCreated, subject)
}

func UpdateSubject(c *gin.Context) {
	id := c.Param("id")

	var dto updateSubjectDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	var subject models.Subject
	if err := db.Db.Where("id = ?", id).First(&subject).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Subject not found"})
		return
	}

	err := db.Db.Transaction(func(tx *gorm.DB) error {
		updates := map[string]interface{}{}
		if dto.Name != nil {
			updates["name"] = *dto.Name
		}
		if dto.Year != nil {
			updates["year"] = *dto.Year
		}
		if dto.DegreeProgramID != nil {
			if *dto.DegreeProgramID == "" {
				return gorm.ErrInvalidData
			}
			updates["degree_program_id"] = *dto.DegreeProgramID
		}

		if len(updates) > 0 {
			if err := tx.Model(&subject).Updates(updates).Error; err != nil {
				return err
			}
		}

		// requirements update (nuevo modelo)
		if dto.Requirements != nil {
			// si mandan [] => limpiar correlativas
			if len(*dto.Requirements) == 0 {
				if err := tx.Where("subject_id = ?", subject.ID).Delete(&models.SubjectRequirement{}).Error; err != nil {
					return err
				}
				return nil
			}

			// validar IDs existen
			ids := make([]string, 0, len(*dto.Requirements))
			for _, r := range *dto.Requirements {
				if r.ID != "" {
					ids = append(ids, r.ID)
				}
			}
			var reqSubjects []models.Subject
			if err := tx.Where("id IN ?", ids).Find(&reqSubjects).Error; err != nil {
				return err
			}
			if len(reqSubjects) != len(ids) {
				return gorm.ErrRecordNotFound
			}

			// estrategia simple y segura: borrar y recrear rows (como tu Replace anterior, pero con MinStatus)
			if err := tx.Where("subject_id = ?", subject.ID).Delete(&models.SubjectRequirement{}).Error; err != nil {
				return err
			}

			rows := make([]models.SubjectRequirement, 0, len(*dto.Requirements))
			for _, r := range *dto.Requirements {
				min := r.MinStatus
				if min == "" {
					min = "passed"
				}
				rows = append(rows, models.SubjectRequirement{
					SubjectID:     subject.ID,
					RequirementID: r.ID,
					MinStatus:     models.RequirementMinStatus(min),
				})
			}
			if err := tx.Create(&rows).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Some requirement IDs are invalid"})
			return
		}
		if err == gorm.ErrInvalidData {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "degreeProgramID cannot be empty"})
			return
		}
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error updating the subject"})
		return
	}

	// devolver actualizado con requirements preloaded
	if err := db.Db.Preload("Requirements").Where("id = ?", id).First(&subject).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Updated subject not found"})
		return
	}
	c.IndentedJSON(http.StatusOK, subject)
}

func DeleteSubject(c *gin.Context) {
	id := c.Param("id")

	var subject models.Subject
	if err := db.Db.Where("id = ?", id).First(&subject).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Subject not found"})
		return
	}

	if err := db.Db.Delete(&subject).Error; err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "An error has ocurred while deleting the subject"})
		slog.Error("An error has ocurred while deleting the subject, ID: ", id, slog.Any("Error: ", err))
		return
	}

	c.IndentedJSON(http.StatusOK, "The subject was deleted")
}
