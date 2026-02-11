package db

import (
	"acadifyapp/internal/models"
	"log/slog"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var Db *gorm.DB

func Connect() {

	// If DB env vars are already present (e.g. Railway), do not load local .env.
	if os.Getenv("MYSQL_DSN") == "" && os.Getenv("MYSQL_URL") == "" && os.Getenv("MYSQL_PUBLIC_URL") == "" {
		err := godotenv.Load(".env")
		if err != nil {
			slog.Any("Error al cargar el archivo .env:", err)
		} else {
			slog.Info("Archivo .env cargado exitosamente.")
		}
	} else {
		slog.Info("DB env vars found in process; skipping .env load")
	}

	dsn, err := ResolveMySQLDSN()
	if err != nil {
		slog.Error("database DSN resolution failed", slog.Any("error", err))
		panic(err)
	}

	logMode := logger.Info
	if strings.EqualFold(strings.TrimSpace(os.Getenv("GIN_MODE")), "release") {
		logMode = logger.Warn
	}

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logMode),
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
		&models.UniversityTag{},
		&models.QuickLink{},
		&models.AdditionalInformation{},
		&models.User{},
		&models.DegreeProgram{},
		&models.Subject{},
		&models.UserSubject{},
		&models.SubjectRequirement{},
		&models.ElectivePool{},
		&models.ElectivePoolSubject{},
		&models.ElectiveRule{},
		&models.Session{},
		&models.PasswordResetToken{},
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
