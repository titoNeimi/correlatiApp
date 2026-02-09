package handlers

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/models"
	"acadifyapp/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
	"log/slog"
	"net/http"
	"strings"
)

type SubjectsFromProgram struct {
	Id           string
	Name         string
	University   string
	UniversityID string
	Subjects     []models.SubjectWithUserStatusDTO
}

func GetMySubjectsFromProgram(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	u, ok := user.(models.User)
	if !ok {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Invalid user type"})
		return
	}

	var userWithPrograms models.User
	if err := db.Db.Preload("DegreePrograms").First(&userWithPrograms, "id = ?", u.ID).Error; err != nil {
		slog.Error("Error loading user programs", slog.Any("error", err))
		c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	rawProgramID := c.Param("programId")
	programId := rawProgramID
	if strings.TrimSpace(rawProgramID) == "" {
		if len(userWithPrograms.DegreePrograms) == 0 {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "User has no degree programs"})
			return
		}
		programId = userWithPrograms.DegreePrograms[0].ID
	} else {
		var err error
		programId, err = validateID(rawProgramID, "program_id")
		if err != nil {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	registered := false
	for _, dp := range userWithPrograms.DegreePrograms {
		if dp.ID == programId {
			registered = true
			break
		}
	}
	if !registered {
		c.IndentedJSON(http.StatusForbidden, gin.H{"error": "You are not registered in this program"})
		return
	}

	var program models.DegreeProgram
	if err := db.Db.Preload("University").Where("id = ?", programId).First(&program).Error; err != nil {
		slog.Error("Program not found", slog.Any("error", err))
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}
	universityName := program.University.Name

	var subjects []models.Subject
	if err := db.Db.
		Where("degree_program_id = ?", programId).
		Find(&subjects).Error; err != nil {
		slog.Error("Error loading subjects", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error loading subjects"})
		return
	}

	if len(subjects) == 0 {
		c.IndentedJSON(http.StatusOK, gin.H{
			"id":           program.ID,
			"name":         program.Name,
			"university":   universityName,
			"universityID": program.UniversityID,
			"subjects":     []any{},
		})
		return
	}

	// estados del usuario
	userSubjects, err := services.GetAllUserSubjects(u.ID, programId)
	if err != nil {
		slog.Info("Error getting the user subjects", "err", err)
	}

	statusBySubject := make(map[string]models.SubjectStatus, len(userSubjects))
	finalCalificationBySubject := make(map[string]float64, len(userSubjects))
	for _, us := range userSubjects {
		statusBySubject[us.SubjectID] = us.Status
		finalCalificationBySubject[us.SubjectID] = us.FianlCalification
	}

	// Traer reglas de requirements (join table)
	subjectIDs := make([]string, 0, len(subjects))
	for _, s := range subjects {
		subjectIDs = append(subjectIDs, s.ID)
	}

	type ReqRuleDTO struct {
		ID        string `json:"id"`
		MinStatus string `json:"minStatus"`
	}

	var links []models.SubjectRequirement
	if err := db.Db.Where("subject_id IN ?", subjectIDs).Find(&links).Error; err != nil {
		slog.Error("Error loading subject requirements", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error loading subject requirements"})
		return
	}

	reqRulesBySubject := make(map[string][]ReqRuleDTO, len(subjectIDs))
	for _, l := range links {
		reqRulesBySubject[l.SubjectID] = append(reqRulesBySubject[l.SubjectID], ReqRuleDTO{
			ID:        l.RequirementID,
			MinStatus: string(l.MinStatus),
		})
	}

	out := make([]any, 0, len(subjects))
	for _, s := range subjects {
		st, found := statusBySubject[s.ID]
		if !found {
			st = models.StatusAvailable
		}
		finalCalification, hasFinalCalification := finalCalificationBySubject[s.ID]

		subjectJSON := gin.H{
			"id":              s.ID,
			"name":            s.Name,
			"year":            s.Year,
			"subjectYear":     s.Year,
			"term":            s.Term,
			"degreeProgramID": s.DegreeProgramID,
			"is_elective":     s.IsElective,
			"status":          st,
			"requirements":    reqRulesBySubject[s.ID], // [{id, minStatus}]
		}
		if hasFinalCalification {
			subjectJSON["final_calification"] = finalCalification
		}
		out = append(out, subjectJSON)
	}

	c.IndentedJSON(http.StatusOK, gin.H{
		"id":           program.ID,
		"name":         program.Name,
		"university":   universityName,
		"universityID": program.UniversityID,
		"subjects":     out,
	})
}

type SaveUserSubjectsRequest struct {
	Subjects []struct {
		ID                string               `json:"id"`
		Status            models.SubjectStatus `json:"status"`
		FinalCalification *float64             `json:"final_calification,omitempty"`
	} `json:"subjects"`
}

func SaveMySubjectsFromProgram(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	u, ok := user.(models.User)
	if !ok {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Invalid user type"})
		return
	}

	var userWithPrograms models.User
	if err := db.Db.Preload("DegreePrograms").First(&userWithPrograms, "id = ?", u.ID).Error; err != nil {
		slog.Error("Error loading user programs", slog.Any("error", err))
		c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	programId, err := validateID(c.Param("programId"), "program_id")
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	registered := false
	for _, dp := range userWithPrograms.DegreePrograms {
		if dp.ID == programId {
			registered = true
			break
		}
	}
	if !registered {
		c.IndentedJSON(http.StatusForbidden, gin.H{"error": "You are not registered in this program"})
		return
	}

	var subjects []models.Subject
	if err := db.Db.Where("degree_program_id = ?", programId).Find(&subjects).Error; err != nil {
		slog.Error("Error loading subjects", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error loading subjects"})
		return
	}

	subjectIDs := make([]string, 0, len(subjects))
	subjectIDSet := make(map[string]struct{}, len(subjects))
	for _, s := range subjects {
		subjectIDs = append(subjectIDs, s.ID)
		subjectIDSet[s.ID] = struct{}{}
	}

	var payload SaveUserSubjectsRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		slog.Error("Invalid subjects payload", slog.Any("error", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}
	if len(payload.Subjects) > maxSubjectsPayload {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Demasiadas materias en el payload"})
		return
	}

	allowedStatus := map[models.SubjectStatus]struct{}{
		models.StatusAvailable:      {},
		models.StatusInProgress:     {},
		models.StatusFinalPending:   {},
		models.StatusPassed:         {},
		models.StatusPassedWithDist: {},
	}

	records := make([]models.UserSubject, 0, len(payload.Subjects))
	payloadIDs := make([]string, 0, len(payload.Subjects))
	payloadIDSet := make(map[string]struct{}, len(payload.Subjects))
	missingCalificationSubjectIDs := make([]string, 0, len(payload.Subjects))
	recordIndexBySubjectID := make(map[string]int, len(payload.Subjects))

	for _, item := range payload.Subjects {
		subjectID, err := validateID(item.ID, "subject_id")
		if err != nil {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if _, ok := subjectIDSet[subjectID]; !ok {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Subject not in program"})
			return
		}
		if _, ok := allowedStatus[item.Status]; !ok {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid subject status"})
			return
		}
		if _, exists := payloadIDSet[subjectID]; exists {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Duplicate subject in payload"})
			return
		}
		if item.FinalCalification != nil && (*item.FinalCalification < 0 || *item.FinalCalification > 10) {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "final_calification must be between 0 and 10"})
			return
		}
		payloadIDs = append(payloadIDs, subjectID)
		payloadIDSet[subjectID] = struct{}{}

		record := models.UserSubject{
			UserID:    u.ID,
			SubjectID: subjectID,
			Status:    item.Status,
		}
		if item.FinalCalification != nil {
			record.FianlCalification = *item.FinalCalification
		} else {
			missingCalificationSubjectIDs = append(missingCalificationSubjectIDs, subjectID)
		}
		recordIndexBySubjectID[subjectID] = len(records)
		records = append(records, record)
	}

	if len(missingCalificationSubjectIDs) > 0 {
		var existingRows []models.UserSubject
		if err := db.Db.
			Where("user_id = ? AND subject_id IN ?", u.ID, missingCalificationSubjectIDs).
			Find(&existingRows).Error; err != nil {
			slog.Error("Error loading existing user subject grades", slog.Any("error", err))
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
			return
		}
		for _, row := range existingRows {
			if idx, ok := recordIndexBySubjectID[row.SubjectID]; ok {
				records[idx].FianlCalification = row.FianlCalification
			}
		}
	}

	tx := db.Db.Begin()
	if tx.Error != nil {
		slog.Error("Error starting transaction", slog.Any("error", tx.Error))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
		return
	}

	if len(subjectIDs) > 0 {
		if len(payloadIDs) == 0 {
			if err := tx.Where("user_id = ? AND subject_id IN ?", u.ID, subjectIDs).Delete(&models.UserSubject{}).Error; err != nil {
				slog.Error("Error deleting user subjects", slog.Any("error", err))
				tx.Rollback()
				c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
				return
			}
		} else {
			if err := tx.Where("user_id = ? AND subject_id IN ? AND subject_id NOT IN ?", u.ID, subjectIDs, payloadIDs).Delete(&models.UserSubject{}).Error; err != nil {
				slog.Error("Error pruning user subjects", slog.Any("error", err))
				tx.Rollback()
				c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
				return
			}
		}
	}

	if len(records) > 0 {
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "subject_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"status", "fianl_calification", "updated_at"}),
		}).Create(&records).Error; err != nil {
			slog.Error("Error upserting user subjects", slog.Any("error", err))
			tx.Rollback()
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		slog.Error("Error committing user subjects transaction", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}
