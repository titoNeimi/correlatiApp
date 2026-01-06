package services

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"log/slog"
	"github.com/google/uuid"
)

func GetUserByEmail(email string) (models.User){
	var user *models.User
	result := db.Db.Where("email = ?", email).Preload("DegreePrograms").First(&user)
	if result.Error != nil{
		slog.Info("Error finding user by email in db", slog.Any("Error: ", result.Error))
		return models.User{}
	}
	return *user
}

func CreateUser(user models.User) (models.User, error){
	user.ID = uuid.New().String()
	result := db.Db.Create(&user)
	if result.Error != nil {
		slog.Info("Error creating user in db", slog.Any("Error: ", result.Error))
		return models.User{}, result.Error
	}
	return user, nil
}