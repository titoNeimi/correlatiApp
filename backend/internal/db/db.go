package db

import (
	"correlatiApp/internal/models"
	"log/slog"
	"os"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

)

var Db *gorm.DB
func Connect() {

	err := godotenv.Load(".env")
  if err != nil {
    slog.Any("Error al cargar el archivo .env:", err)
  } else {
    slog.Info("Archivo .env cargado exitosamente.")
  }
	
	dsn := os.Getenv("MYSQL_DSN")
	slog.Any("dsn :", dsn)
	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		slog.Error("failed to connect database", slog.Any("error", err))
	}
	Db = database
	Db.SetupJoinTable(&models.Subject{}, "Requirements", &models.SubjectRequirement{})
	Db.AutoMigrate(
    &models.User{},
    &models.DegreeProgram{},
    &models.Subject{},
    &models.SubjectRequirement{},
	)


}