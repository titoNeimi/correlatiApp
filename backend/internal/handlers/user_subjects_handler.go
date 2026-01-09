package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"correlatiApp/internal/services"
	"github.com/gin-gonic/gin"
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
			"subjectYear":     s.SubjectYear,
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
