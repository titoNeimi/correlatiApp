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
	if err := Db.SetupJoinTable(&models.Subject{}, "ElectivePools", &models.ElectivePoolSubject{}); err != nil {
		slog.Error("SetupJoinTable elective_pool_subjects failed", slog.Any("error", err))
		panic(err)
	}

	if Db.Migrator().HasColumn(&models.DegreeProgram{}, "university") {
		_ = Db.Migrator().DropColumn(&models.DegreeProgram{}, "university")
	}

	// Para  desde emigracionessquemas previos (ej. degree_programs sin university_id) desactivamos
	// FK checks en MySQL y los reactivamos después, evitando fallar por datos huérfanos previos.
	if Db.Dialector.Name() == "mysql" {
		_ = Db.Exec("SET FOREIGN_KEY_CHECKS=0;")
		defer Db.Exec("SET FOREIGN_KEY_CHECKS=1;")
	}

	if err := Db.AutoMigrate(
		&models.University{},
		&models.User{},
		&models.DegreeProgram{},
		&models.Subject{},
		&models.UserSubject{},
		&models.SubjectRequirement{},
		&models.ElectivePool{},
		&models.ElectivePoolSubject{},
		&models.ElectiveRule{},
		&models.Session{},
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
