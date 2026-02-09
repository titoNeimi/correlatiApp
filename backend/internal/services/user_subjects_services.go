package services

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/models"
)

func GetAllUserSubjects(userId string, programId string) ([]models.UserSubject, error) {
	var userSubjects []models.UserSubject

	tx := db.Db.Model(&models.UserSubject{}).
		Joins("JOIN subjects ON subjects.id = user_subjects.subject_id").
		Where("user_subjects.user_id = ?", userId)

	if programId != "" {
		tx = tx.Where("subjects.degree_program_id = ?", programId)
	}

	if err := tx.Find(&userSubjects).Error; err != nil {
		return nil, err
	}

	return userSubjects, nil
}
