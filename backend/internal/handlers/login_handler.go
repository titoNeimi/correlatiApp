package handlers

import (
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

func GetUserInfo(c *gin.Context) {
	
}