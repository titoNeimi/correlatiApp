package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"log/slog"
	"net/http"
  "github.com/google/uuid"
	"github.com/gin-gonic/gin"
	"correlatiApp/internal/utils"
)

func CreateUser (c *gin.Context){
	var newUser *models.User
		if err := c.BindJSON(&newUser); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("error", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error":"invalid JSON"})
		return
	}
	newUser.ID = uuid.New().String()
	//Todo: Search the user by email, if the email is allready in use return an error
	newPassword, err := utils.HashPassword(newUser.Password)
	if err != nil{
		slog.Error("Error hashing the password", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error creating the user"})
		return
	}
	newUser.Password = newPassword

	result := db.Db.Create(newUser)
	if result.Error != nil {
		slog.Error("Error creating the user", slog.Any("Error: ", result.Error))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error creating the user"})
		return
	}
	c.IndentedJSON(http.StatusCreated, newUser)
}

func GetUser (c *gin.Context){
	id := c.Param("id")
	var user *models.User
	result := db.Db.First(&user).Where("id = ?", id)
	if result.Error != nil{
		slog.Info("Error finding user by ID in db", slog.Any("Error: ", result.Error))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"Error": "Error getting the user by ID"})
		return
	}
	c.IndentedJSON(http.StatusAccepted, user)

}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var updates map[string]interface{}
	if err := c.BindJSON(&updates); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("Error: ", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	//Todo: If the user wants to change the password, hash it again.

	var updatedUser models.User
	if err := db.Db.First(&updatedUser).Where("id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := db.Db.Model(&updatedUser).Updates(updates).Error; err != nil {
		slog.Error("Error updating the user from db", "userId", id, slog.Any("Error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error updating the user"})
		return
	}

	if err := db.Db.First(&updatedUser).Where("id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error getting the updated user"})
		return
	}

	c.IndentedJSON(http.StatusOK, updatedUser)
}

func DeleteUser(c *gin.Context){
	var user *models.User
	id := c.Param("id")

	if err := db.Db.First(&user).Where("id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	
	result := db.Db.Delete(&user)

	if result.Error != nil {
		slog.Error("Error deleting the user from db", "userId", id, slog.Any("Error: ", result.Error))
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "An error has ocurred while deleting the user"})
		return
	}
		c.IndentedJSON(http.StatusOK, "User deleted")
		slog.Info("An user has been deleted", slog.Any("User: ", user))
}

func GetAllUsers (c *gin.Context){
	var users *[]models.User
	result := db.Db.Find(&users)
	if result.Error != nil{
		slog.Error("An error occurred while getting users from the database.", slog.Any("Error: ", result.Error))
		c.IndentedJSON(http.StatusInternalServerError, "An error occurred while getting users")
		return
	}

	c.IndentedJSON(http.StatusOK, users)
}