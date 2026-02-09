package handlers

import (
	"acadifyapp/internal/models"
	"acadifyapp/internal/services"
	"errors"
	"github.com/gin-gonic/gin"
	"log/slog"
	"net/http"
)

func CreateUser(c *gin.Context) {
	var newUser models.User
	if err := c.BindJSON(&newUser); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("error", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}
	createdUser, err := services.CreateUserWithValidation(&newUser)
	if err != nil {
		if errors.Is(err, services.ErrEmailExists) {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		}
		slog.Error("Error creating the user", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error creating the user"})
		return
	}
	c.IndentedJSON(http.StatusCreated, createdUser)
}

func GetUser(c *gin.Context) {
	id := c.Param("id")
	user, err := services.GetUserByID(id)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		slog.Info("Error finding user by ID in db", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error getting the user by ID"})
		return
	}
	c.IndentedJSON(http.StatusOK, user)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var dto models.UserUpdateDTO
	if err := c.BindJSON(&dto); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("Error: ", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	updatedUser, err := services.UpdateUser(id, dto)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		if errors.Is(err, services.ErrInvalidDegreePrograms) {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Some DegreeProgram IDs are invalid"})
			return
		}
		slog.Error("Error updating the user from db", "userId", id, slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error updating the user"})
		return
	}

	c.IndentedJSON(http.StatusOK, updatedUser)
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	user, err := services.DeleteUser(id)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		slog.Error("Error deleting the user from db", "userId", id, slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "An error has ocurred while deleting the user"})
		return
	}
	c.IndentedJSON(http.StatusOK, "User deleted")
	slog.Info("An user has been deleted", slog.Any("User: ", user))
}

func GetAllUsers(c *gin.Context) {
	users, err := services.GetAllUsers()
	if err != nil {
		slog.Error("An error occurred while getting users from the database.", slog.Any("error", err))
		c.IndentedJSON(http.StatusInternalServerError, "An error occurred while getting users")
		return
	}

	c.IndentedJSON(http.StatusOK, users)
}
