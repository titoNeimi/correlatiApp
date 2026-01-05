package services

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
)

func GetAllUserSubjects (userId string, subjectId string) ([]models.UserSubject, error){
	var userSubjects []models.UserSubject

	tx := db.Db.Model(&models.UserSubject{}).
		Where("user_id = ?", userId)

	if subjectId != "" {
		tx = tx.Where("subject_id = ?", subjectId)
	}

	if err := tx.Find(&userSubjects).Error; err != nil {
		return nil, err
	}

	return userSubjects, nil
}
