package handlers

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetAllPrograms (c *gin.Context){
	var programs *[]models.DegreeProgram
	
	result := db.Db.Find(&programs)
	if result.Error != nil{
		slog.Error("Error getting all the programs from db", slog.Any("error: ", result.Error))
		c.IndentedJSON(http.StatusInternalServerError, "An error ocurred while getting the programs")
		return
	}
	c.IndentedJSON(http.StatusAccepted, programs)
}

func CreateProgram (c *gin.Context){
	var newProgram *models.DegreeProgram

	if err := c.BindJSON(&newProgram); err != nil {
		slog.Error("Error getting the json from the body", slog.Any("error", err))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error":"invalid JSON"})
		return
	}

	newProgram.ID = uuid.New().String()

	result := db.Db.Create(&newProgram)
	if result.Error != nil{
		slog.Error("Error creating the degree program", slog.Any("error", result.Error))
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error":"Error creating the degree program"})
		return
	}
	slog.Info("Degree program created", "id", newProgram.ID)
	c.IndentedJSON(http.StatusCreated, newProgram)
}

func GetProgramById (c *gin.Context){
	id := c.Param("id")
	var program *models.DegreeProgram

	if err := db.Db.First(&program).Where("id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	c.IndentedJSON(http.StatusAccepted, program)

}

func UpdateProgram (c *gin.Context) {
	id := c.Param("id")

	var updates *map[string]interface{}
	var updatedProgram *models.DegreeProgram

		if err := c.BindJSON(&updates); err != nil {
			slog.Error("Error getting the json from the body", slog.Any("Error: ", err))
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	if err := db.Db.First(&updatedProgram).Where("id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	if err := db.Db.Model(&updatedProgram).Updates(updates).Error; err != nil {
		slog.Error("Error updating the program from db", "programID", id, slog.Any("Error: ", err))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error updating the program"})
		return
	}

	if err := db.Db.First(&updatedProgram).Where("id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Error getting the program after the update"})
		return
	}

	c.IndentedJSON(http.StatusAccepted, updatedProgram)

}

func DeleteProgram (c *gin.Context){
	id := c.Param("id")

	var program *models.DegreeProgram

	
	if err := db.Db.First(&program).Where("id = ?", id).Error; err != nil {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Program not found"})
		return
	}

	result := db.Db.Delete(program)

	if result.Error != nil{
		slog.Error("Error deleting the program from db", "programID", id, slog.Any("Error: ", result.Error))
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Error deleting the program"})
		return
	}

	slog.Info("A program has been deleted ", "id: ", id)
	c.IndentedJSON(http.StatusAccepted, "Program deleted")
}