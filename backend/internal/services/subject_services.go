package services

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
)

func GetAllSubjectsFromProgram (id string) (models.DegreeProgram, error){
	var degreeProgram models.DegreeProgram

	if err := db.Db.
		Preload("Subjects.Requirements").
		Where("id = ?", id).
		First(&degreeProgram).Error; err != nil {
		return models.DegreeProgram{}, err
	}
	return degreeProgram, nil
}
