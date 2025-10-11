package services

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
)

func GetAllUserSubjects (userId string, subjectId string) ([]models.UserSubject, error){
	var userSubjects *[]models.UserSubject

	result := db.Db.Find(&userSubjects).Where("id = ?", userId)
	if result.Error != nil {
		return []models.UserSubject{}, result.Error
	}

	return *userSubjects, nil

}