package db

import (
	"correlatiApp/internal/models"
	"log/slog"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var Db *gorm.DB
func Connect() {
	dsn := "root:dolores230236@tcp(127.0.0.1:3306)/correlatiApp?charset=utf8mb4&parseTime=True&loc=Local"
  database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		slog.Error("failed to connect database", slog.Any("error", err))
	}
	Db = database
	Db.AutoMigrate(&models.User{})
	Db.AutoMigrate(&models.DegreeProgram{})
	Db.AutoMigrate(&models.Subject{})
}