package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"correlatiApp/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
	"log/slog"
	"net/http"
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
		c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	programId := c.Param("programId")
	if programId == "" {
		if len(userWithPrograms.DegreePrograms) == 0 {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "User has no degree programs"})
			return
		}
		programId = userWithPrograms.DegreePrograms[0].ID
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
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}
	universityName := program.University.Name

	var subjects []models.Subject
	if err := db.Db.
		Where("degree_program_id = ?", programId).
		Find(&subjects).Error; err != nil {
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
	for _, us := range userSubjects {
		statusBySubject[us.SubjectID] = us.Status
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

		out = append(out, gin.H{
			"id":              s.ID,
			"name":            s.Name,
			"year":            s.Year,
			"degreeProgramID": s.DegreeProgramID,
			"status":          st,
			"requirements":    reqRulesBySubject[s.ID], // [{id, minStatus}]
		})
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
		ID     string               `json:"id"`
		Status models.SubjectStatus `json:"status"`
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
		c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	programId := c.Param("programId")
	if programId == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Program ID is required"})
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
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
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

	for _, item := range payload.Subjects {
		if item.ID == "" {
			continue
		}
		if _, ok := subjectIDSet[item.ID]; !ok {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Subject not in program"})
			return
		}
		if _, ok := allowedStatus[item.Status]; !ok {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid subject status"})
			return
		}
		payloadIDs = append(payloadIDs, item.ID)
		payloadIDSet[item.ID] = struct{}{}
		records = append(records, models.UserSubject{
			UserID:    u.ID,
			SubjectID: item.ID,
			Status:    item.Status,
		})
	}

	tx := db.Db.Begin()
	if tx.Error != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
		return
	}

	if len(subjectIDs) > 0 {
		if len(payloadIDs) == 0 {
			if err := tx.Where("user_id = ? AND subject_id IN ?", u.ID, subjectIDs).Delete(&models.UserSubject{}).Error; err != nil {
				tx.Rollback()
				c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
				return
			}
		} else {
			if err := tx.Where("user_id = ? AND subject_id IN ? AND subject_id NOT IN ?", u.ID, subjectIDs, payloadIDs).Delete(&models.UserSubject{}).Error; err != nil {
				tx.Rollback()
				c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
				return
			}
		}
	}

	if len(records) > 0 {
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "subject_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"status", "updated_at"}),
		}).Create(&records).Error; err != nil {
			tx.Rollback()
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error saving subjects"})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"ok": true})
}
