package db

import (
	"log/slog"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"correlatiApp/internal/models" 
	"github.com/joho/godotenv"
)

var Db *gorm.DB

func Connect() {

	err := godotenv.Load()
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
		panic(err)
	}

	Db = database

	if err := Db.SetupJoinTable(&models.Subject{}, "Requirements", &models.SubjectRequirement{}); err != nil {
		slog.Error("SetupJoinTable subject_requirements failed", slog.Any("error", err))
		panic(err)
	}
	if err := Db.SetupJoinTable(&models.User{}, "Subjects", &models.UserSubject{}); err != nil {
		slog.Error("SetupJoinTable user_subjects failed", slog.Any("error", err))
		panic(err)
	}

	if err := Db.AutoMigrate(
		&models.User{},
		&models.DegreeProgram{},
		&models.Subject{},
		&models.UserSubject{},
		&models.SubjectRequirement{},
	); err != nil {
		slog.Error("automigrate failed", slog.Any("error", err))
		panic(err)
	}

	sqlDB, err := Db.DB()
	if err == nil {
		if err := sqlDB.Ping(); err != nil {
			slog.Error("database ping failed", slog.Any("error", err))
		}
	}

}
