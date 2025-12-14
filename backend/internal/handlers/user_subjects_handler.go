package handlers

import (
	"correlatiApp/internal/models"
	"correlatiApp/internal/services"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SubjectsFromProgram struct {
	Id         string
	Name       string
	University string
	Subjects   []models.SubjectWithUserStatusDTO
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

	programId := c.Param("programId")

	// Si no vino por param, usar el primero (si existe)
	if programId == "" {
		if len(u.DegreePrograms) == 0 {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "User has no degree programs"})
			return
		}
		programId = u.DegreePrograms[0].ID
	}

	// Validar que el usuario esté inscripto a ese programa
	registered := false
	for _, dp := range u.DegreePrograms {
		if dp.ID == programId {
			registered = true
			break
		}
	}
	if !registered {
		c.IndentedJSON(http.StatusForbidden, gin.H{"error": "You are not registered in this program"})
		return
	}

	program, err := services.GetAllSubjectsFromProgram(programId)
	if err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	if len(program.Subjects) == 0 {
		programOut := SubjectsFromProgram{
			Id:         program.ID,
			Name:       program.Name,
			University: program.University,
			Subjects:   []models.SubjectWithUserStatusDTO{},
		}
		c.IndentedJSON(http.StatusOK, programOut)
		return
	}

	userSubjects, err := services.GetAllUserSubjects(u.ID, programId)
	if err != nil {
		slog.Info("Error getting the user subjects", "err", err)
		// No necesariamente es fatal: seguimos y asumimos AVAILABLE
	}

	statusBySubject := make(map[string]models.SubjectStatus, len(userSubjects))
	for _, us := range userSubjects {
		statusBySubject[us.SubjectID] = us.Status
	}

	out := make([]models.SubjectWithUserStatusDTO, 0, len(program.Subjects))
	for _, s := range program.Subjects {
		st, found := statusBySubject[s.ID]
		if !found {
			st = models.StatusAvailable
		}

		// Con el modelo nuevo: s.Requirements es []SubjectRequirement
		requirementIds := make([]string, 0, len(s.Requirements))
		for _, req := range s.Requirements {
			requirementIds = append(requirementIds, req.ID)
		}

		out = append(out, models.SubjectWithUserStatusDTO{
			ID:              s.ID,
			Name:            s.Name,
			SubjectYear:     s.SubjectYear,
			DegreeProgramID: s.DegreeProgramID,
			Status:          st,
			RequirementsIDs: requirementIds,
		})
	}

	programOut := SubjectsFromProgram{
		Id:         program.ID,
		Name:       program.Name,
		University: program.University,
		Subjects:   out,
	}
	c.IndentedJSON(http.StatusOK, programOut)
}
