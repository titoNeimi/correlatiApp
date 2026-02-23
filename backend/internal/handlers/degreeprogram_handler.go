package handlers

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/models"
	"errors"
	"fmt"
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
	var updatedProgram models.DegreeProgram

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
	if !ensureProgramWriteAccessForProgram(c, &updatedProgram) {
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

	var program models.DegreeProgram

	if err := db.Db.Where("id = ?", id).First(&program).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}
	if !ensureProgramWriteAccessForProgram(c, &program) {
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

func ensureProgramWriteAccess(c *gin.Context, programID string) bool {
	var program models.DegreeProgram
	if err := db.Db.Select("id", "approval_status", "public_requested").Where("id = ?", programID).First(&program).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
			return false
		}
		slog.Error("Error loading program permissions", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error validating permissions"})
		return false
	}
	return ensureProgramWriteAccessForProgram(c, &program)
}

func ensureProgramWriteAccessForProgram(c *gin.Context, program *models.DegreeProgram) bool {
	if isAdminOrStaff(c) {
		return true
	}

	u, ok := c.Get("user")
	if !ok {
		c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return false
	}
	user, ok := u.(models.User)
	if !ok {
		c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return false
	}

	if program.ApprovalStatus == models.DegreeProgramApproved && program.PublicRequested {
		c.IndentedJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return false
	}

	var count int64
	if err := db.Db.Table("user_degree_programs").
		Where("user_id = ? AND degree_program_id = ?", user.ID, program.ID).
		Count(&count).Error; err != nil {
		slog.Error("Error validating program permissions", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error validating permissions"})
		return false
	}
	if count == 0 {
		c.IndentedJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return false
	}

	return true
}

func UploadSeed(c *gin.Context) {
	var payload models.JsonToDegreeProgram

	if err := c.BindJSON(&payload); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("error", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	payload.DegreeProgram.Name = strings.TrimSpace(payload.DegreeProgram.Name)
	if payload.DegreeProgram.Name == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "degree program name is required"})
		return
	}
	if payload.DegreeProgram.UniversityID == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "universityID is required"})
		return
	}
	if err := db.Db.First(&models.University{}, "id = ?", payload.DegreeProgram.UniversityID).Error; err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "University not found"})
		return
	}

	validTerms := map[models.SubjectTerm]struct{}{
		models.TermAnnual:    {},
		models.TermSemester:  {},
		models.TermQuarterly: {},
		models.TermBimonthly: {},
	}
	codeMap := make(map[string]struct{}, len(payload.Subjects))
	for i := range payload.Subjects {
		payload.Subjects[i].Code = strings.TrimSpace(payload.Subjects[i].Code)
		payload.Subjects[i].Name = strings.TrimSpace(payload.Subjects[i].Name)
		s := payload.Subjects[i]

		if s.Code == "" {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("subject at index %d is missing a code", i)})
			return
		}
		if s.Name == "" {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("subject %q is missing a name", s.Code)})
			return
		}
		if _, valid := validTerms[s.Term]; !valid {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("subject %q has invalid term %q", s.Code, s.Term)})
			return
		}
		if _, exists := codeMap[s.Code]; exists {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("duplicate subject code %q", s.Code)})
			return
		}
		codeMap[s.Code] = struct{}{}
	}

	for _, s := range payload.Subjects {
		for _, req := range s.Requirements {
			if _, exists := codeMap[req.SubjectCode]; !exists {
				c.IndentedJSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("subject %q references unknown requirement code %q", s.Code, req.SubjectCode)})
				return
			}
			if req.Type != models.SeedRequirementApproved && req.Type != models.SeedRequirementRegularize {
				c.IndentedJSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("subject %q has invalid requirement type %q", s.Code, req.Type)})
				return
			}
		}
	}

	if err := detectCircularDeps(payload.Subjects); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	degreeProgramID := uuid.NewString()

	if err := db.Db.Transaction(func(tx *gorm.DB) error {
		newDegreeProgram := models.DegreeProgram{
			ID:              degreeProgramID,
			Name:            payload.DegreeProgram.Name,
			UniversityID:    payload.DegreeProgram.UniversityID,
			ApprovalStatus:  models.DegreeProgramPending,
			PublicRequested: false,
		}

		if err := tx.Create(&newDegreeProgram).Error; err != nil {
			slog.Error("Error creating the degree program", slog.Any("error", err))
			return err
		}

		if u, ok := c.Get("user"); ok {
			if user, ok := u.(models.User); ok {
				if err := tx.Model(&user).Association("DegreePrograms").Append(&newDegreeProgram); err != nil {
					slog.Error("Error associating user with degree program", slog.Any("error", err))
					return err
				}
			}
		}

		subjectCodeID := make(map[string]string, len(payload.Subjects))

		for _, sub := range payload.Subjects {
			year := sub.SubjectYear
			newSubject := models.Subject{
				ID:              uuid.NewString(),
				Name:            sub.Name,
				Term:            string(sub.Term),
				Year:            &year,
				IsElective:      sub.IsElective,
				DegreeProgramID: newDegreeProgram.ID,
			}

			if err := tx.Create(&newSubject).Error; err != nil {
				slog.Error("Error creating subject", slog.String("name", sub.Name), slog.Any("error", err))
				return err
			}
			subjectCodeID[sub.Code] = newSubject.ID
		}

		for _, sub := range payload.Subjects {
			for _, req := range sub.Requirements {
				var minStatus models.RequirementMinStatus
				if req.Type == models.SeedRequirementApproved {
					minStatus = models.ReqPassed
				} else {
					minStatus = models.ReqFinalPending
				}

				subjReq := models.SubjectRequirement{
					SubjectID:     subjectCodeID[sub.Code],
					RequirementID: subjectCodeID[req.SubjectCode],
					MinStatus:     minStatus,
				}
				if err := tx.Create(&subjReq).Error; err != nil {
					slog.Error("Error creating subject requirement", slog.String("subject", sub.Code), slog.String("requirement", req.SubjectCode), slog.Any("error", err))
					return err
				}
			}
		}

		return nil
	}); err != nil {
		slog.Error("Seed transaction failed, rolled back", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "failed to seed degree program"})
		return
	}

	var result models.DegreeProgram
	db.Db.Preload("Subjects").Preload("University").First(&result, "id = ?", degreeProgramID)
	c.IndentedJSON(http.StatusCreated, result)
}

func detectCircularDeps(subjects []models.SeedSubject) error {
	graph := make(map[string][]string, len(subjects))
	for _, s := range subjects {
		deps := make([]string, 0, len(s.Requirements))
		for _, r := range s.Requirements {
			deps = append(deps, r.SubjectCode)
		}
		graph[s.Code] = deps
	}

	// 0 = unvisited, 1 = in stack, 2 = done
	state := make(map[string]int, len(subjects))
	var dfs func(code string) error
	dfs = func(code string) error {
		state[code] = 1
		for _, dep := range graph[code] {
			if state[dep] == 1 {
				return fmt.Errorf("circular dependency detected involving subject %q", dep)
			}
			if state[dep] == 0 {
				if err := dfs(dep); err != nil {
					return err
				}
			}
		}
		state[code] = 2
		return nil
	}

	for _, s := range subjects {
		if state[s.Code] == 0 {
			if err := dfs(s.Code); err != nil {
				return err
			}
		}
	}
	return nil
}
