package handlers

import (
	"correlatiApp/internal/models"
	"correlatiApp/internal/services"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SubjectsFromProgram struct {
	Id string
	Name       string
	University string
	Subjects   []models.SubjectWithUserStatusDTO
}

func GetMySubjectsFromProgram (c *gin.Context){
	user, exists := c.Get("user")

	if !exists {
		c.IndentedJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	
	u, ok := user.(models.User)
	if !ok {
		c.IndentedJSON(500, gin.H{"error": "Invalid user type"})
		return
	}
	//TODO: Validar programId para que el usuario tenga estar inscripto
	programId := c.Param("programId")
	if !ok {
		c.IndentedJSON(300, gin.H{"error": "You are not registered"})
	}

	if programId == "" {programId = u.DegreePrograms[0].ID}
	program, err := services.GetAllSubjectsFromProgram(programId)
	
	subjects := program.Subjects

	if err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
	}
	if len(program.Subjects) == 0 {
		c.IndentedJSON(http.StatusOK, []models.SubjectWithUserStatusDTO{})

	}

	userSubjects, err := services.GetAllUserSubjects(u.ID, programId)

	if err != nil {
		slog.Info("Error getting the user subjects")
	}


	statusBySubject := make(map[string]models.SubjectStatus, len(userSubjects))
	for _, us := range userSubjects {
		statusBySubject[us.SubjectID] = us.Status
	}

	out := make([]models.SubjectWithUserStatusDTO, 0, len(subjects))
	for _, s := range subjects {
		st, ok := statusBySubject[s.ID]
		if !ok {
			st = models.StatusAvailable
		}

		dto := models.SubjectWithUserStatusDTO{
			ID:              s.ID,
			Name:            s.Name,
			SubjectYear:     s.SubjectYear,
			DegreeProgramID: s.DegreeProgramID,
			Status:          st,
		}
		out = append(out, dto)
	}
	programOut := SubjectsFromProgram{
		Id: program.ID,
		Name: program.Name,
		University: program.University,
		Subjects: out,
	}
	c.IndentedJSON(http.StatusOK, programOut)

}