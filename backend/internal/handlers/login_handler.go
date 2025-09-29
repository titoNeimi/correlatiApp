package handlers

import (
	"correlatiApp/internal/models"
	"correlatiApp/internal/services"
	"correlatiApp/internal/utils"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

type loginData struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}


func LoginHandler(c *gin.Context) {
	var data loginData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.IndentedJSON(http.StatusBadRequest, "Invalid request data")
		return
	}
	user := services.GetUserByEmail(data.Email)
	if user.ID == "" {
		c.IndentedJSON(http.StatusBadRequest, "Incorrect data")
		return
	}
	isValidPassword := utils.CheckPasswordHash(data.Password, user.Password)
	if !isValidPassword {
		c.IndentedJSON(http.StatusBadRequest, "Incorrect data")
		slog.Info("No se a podido iniciar sesion, contrasenia incorrecta")
		return
	}

	token, err := utils.CreateToken(user)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, "Failed to create token")
		return
	}
	c.Header("Authorization", "Bearer " + token)
	c.IndentedJSON(http.StatusAccepted, gin.H{
    "message": "Logged in successfully",
})
}

func Logout (c *gin.Context) {
  token := c.GetHeader("Authorization")
	if token == "" {
    c.JSON(http.StatusBadRequest, gin.H{"error": "You are not loged in"})
    return
  }
	c.Writer.Header().Del("Authorization")
	c.IndentedJSON(http.StatusOK, "Logged out successfully")
} 

func Register(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.IndentedJSON(http.StatusBadRequest, "Invalid request data")
		return
	}
	if user.Email == "" || user.Password == "" {
		c.IndentedJSON(http.StatusBadRequest, "Email and password are required")
		return
	}

	existingUser := services.GetUserByEmail(user.Email)
	if existingUser.ID != "" {
		c.IndentedJSON(http.StatusBadRequest, "User already exists")
		return
	}

	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, "Failed to hash password")
		return
	}
	user.Password = hashedPassword

	createdUser, err := services.CreateUser(user)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, "Failed to create user")
		return
	}
	c.IndentedJSON(http.StatusCreated, createdUser)
}

func GetUserInfo(c *gin.Context) {
	
}