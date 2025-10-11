package services

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
)

func GetAllSubjectsFromProgram (id string) (models.DegreeProgram, error){
	var degreeProgram *models.DegreeProgram

	result := db.Db.Preload("Subjects.Requirements").Find(&degreeProgram)
	if result.Error != nil {
		return models.DegreeProgram{}, result.Error
	}
	return *degreeProgram, nil
}