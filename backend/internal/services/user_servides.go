package services

import (
	
	"correlatiApp/internal/models"
	"log/slog"
	"correlatiApp/internal/db"

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