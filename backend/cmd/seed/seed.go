package main

import (
	"correlatiApp/internal/db"
	"correlatiApp/internal/models"
	"correlatiApp/internal/utils"
	"fmt"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/google/uuid"
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

	// Permite migrar aunque existan datos antiguos sin FK válidas (MySQL)
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

func main() {

	db.Connect()

	if err := Seed(db.Db); err != nil {
		log.Fatalf("seed failed: %v", err)
	}

	fmt.Println("✅ Seed OK")
}

func Seed(gdb *gorm.DB) error {
	return gdb.Transaction(func(tx *gorm.DB) error {
		// 1) Limpieza en orden seguro (por FKs / join tables)
		if err := resetAll(tx); err != nil {
			return err
		}

		// 2) Universities
		utn := models.University{
			ID:       uuid.NewString(),
			Name:     "UTN",
			Location: "Argentina",
			Website:  "https://utn.edu.ar",
		}
		uba := models.University{
			ID:       uuid.NewString(),
			Name:     "UBA",
			Location: "Argentina",
			Website:  "https://uba.ar",
		}
		if err := tx.Create(&[]models.University{utn, uba}).Error; err != nil {
			return err
		}

		// 3) Degree Programs
		dpSistemas := models.DegreeProgram{
			ID:           uuid.NewString(),
			Name:         "Ingeniería en Sistemas de Información",
			UniversityID: utn.ID,
		}
		dpAnalista := models.DegreeProgram{
			ID:           uuid.NewString(),
			Name:         "Analista de Sistemas",
			UniversityID: utn.ID,
		}
		if err := tx.Create(&[]models.DegreeProgram{dpSistemas, dpAnalista}).Error; err != nil {
			return err
		}

		// 4) Subjects (por programa) + correlativas (Requirements many2many)
		// --- Sistemas (ejemplo razonable)
		ams := newSubject("Análisis Matemático I", 1, dpSistemas.ID)
		algebra := newSubject("Álgebra y Geometría Analítica", 1, dpSistemas.ID)
		logica := newSubject("Lógica y Estructuras Discretas", 1, dpSistemas.ID)
		algo1 := newSubject("Algoritmos y Estructuras de Datos", 1, dpSistemas.ID)
		nego := newSubject("Sistemas y procesos de Negocios", 1, dpSistemas.ID)
		arq := newSubject("Arquitectura de Computadoras", 1, dpSistemas.ID)
		fi1 := newSubject("Física I", 1, dpSistemas.ID)

		fi2 := newSubject("Física II", 2, dpSistemas.ID)
		am2 := newSubject("Análisis Matemático II", 2, dpSistemas.ID)
		proba := newSubject("Probabilidad y Estadística", 2, dpSistemas.ID)
		sintaxis := newSubject("Sintaxis y Semántica de los Lenguajes", 2, dpSistemas.ID)
		so := newSubject("Sistemas Operativos", 2, dpSistemas.ID)
		asi := newSubject("Análisis de Sistemas de Información", 2, dpSistemas.ID)
		para := newSubject("Paradigmas de Programación", 2, dpSistemas.ID)

		bd := newSubject("Bases de Datos", 3, dpSistemas.ID)
		ingsoft := newSubject("Diseño de Sistemas de Información", 3, dpSistemas.ID)
		desa := newSubject("Desarrollo de Software", 3, dpSistemas.ID)

		sisSubjects := []*models.Subject{
			ams, algebra, logica, algo1, am2, proba, arq, sintaxis, so, bd, ingsoft, nego, fi1, fi2, asi, para, desa,
		}
		if err := tx.Create(&sisSubjects).Error; err != nil {
			return err
		}

		// Helper para insertar requirements con MinStatus
		addReq := func(subjectID, requirementID string, min models.RequirementMinStatus) error {
			return tx.Create(&models.SubjectRequirement{
				SubjectID:     subjectID,
				RequirementID: requirementID,
				MinStatus:     min,
			}).Error
		}

		if err := addReq(fi2.ID, fi1.ID, models.ReqFinalPending); err != nil {
			return err
		}

		if err := addReq(asi.ID, nego.ID, models.ReqFinalPending); err != nil {
			return err
		}

		if err := addReq(am2.ID, ams.ID, models.ReqFinalPending); err != nil {
			return err
		}

		if err := addReq(proba.ID, ams.ID, models.ReqFinalPending); err != nil {
			return err
		}
		if err := addReq(proba.ID, algebra.ID, models.ReqFinalPending); err != nil {
			return err
		}

		if err := addReq(sintaxis.ID, algo1.ID, models.ReqFinalPending); err != nil {
			return err
		}
		if err := addReq(sintaxis.ID, logica.ID, models.ReqFinalPending); err != nil {
			return err
		}

		if err := addReq(para.ID, algo1.ID, models.ReqFinalPending); err != nil {
			return err
		}
		if err := addReq(para.ID, logica.ID, models.ReqFinalPending); err != nil {
			return err
		}

		if err := addReq(so.ID, arq.ID, models.ReqFinalPending); err != nil {
			return err
		}

		// 3ro: BD requiere (1ro passed) + (2do final_pending)
		if err := addReq(bd.ID, algo1.ID, models.ReqPassed); err != nil {
			return err
		}
		if err := addReq(bd.ID, logica.ID, models.ReqPassed); err != nil {
			return err
		}
		if err := addReq(bd.ID, sintaxis.ID, models.ReqFinalPending); err != nil {
			return err
		}
		if err := addReq(bd.ID, asi.ID, models.ReqFinalPending); err != nil {
			return err
		}

		if err := addReq(desa.ID, algo1.ID, models.ReqPassed); err != nil { // 1ro
			return err
		}
		if err := addReq(desa.ID, logica.ID, models.ReqPassed); err != nil { // 2do
			return err
		}
		if err := addReq(desa.ID, para.ID, models.ReqFinalPending); err != nil { // 2do
			return err
		}
		if err := addReq(desa.ID, asi.ID, models.ReqFinalPending); err != nil { // 2do
			return err
		}

		if err := addReq(ingsoft.ID, algo1.ID, models.ReqPassed); err != nil { // 1ro
			return err
		}
		if err := addReq(ingsoft.ID, nego.ID, models.ReqPassed); err != nil { // 2do
			return err
		}
		if err := addReq(ingsoft.ID, para.ID, models.ReqFinalPending); err != nil { // 2do
			return err
		}
		if err := addReq(ingsoft.ID, asi.ID, models.ReqFinalPending); err != nil { // 2do
			return err
		}

		// --- Analista (más cortito, pero consistente)
		intro := newSubject("Introducción a la Programación", 1, dpAnalista.ID)
		algoA := newSubject("Algoritmos I", 1, dpAnalista.ID)
		bdA := newSubject("Bases de Datos I", 2, dpAnalista.ID)
		webA := newSubject("Desarrollo Web", 2, dpAnalista.ID)

		anaSubjects := []*models.Subject{intro, algoA, bdA, webA}
		if err := tx.Create(&anaSubjects).Error; err != nil {
			return err
		}
		if err := tx.Model(bdA).Association("Requirements").Replace([]*models.Subject{algoA}); err != nil {
			return err
		}
		if err := tx.Model(webA).Association("Requirements").Replace([]*models.Subject{intro}); err != nil {
			return err
		}

		// 4) Users (con roles) + relación a DegreePrograms
		usersPas, err := utils.HashPassword("dolores")
		if err != nil {
			return err
		}

		admin := models.User{
			ID:       uuid.NewString(),
			Email:    "admin@example.com",
			Password: usersPas,
			Role:     "admin",
		}
		alumno := models.User{
			ID:       uuid.NewString(),
			Email:    "alumno@example.com",
			Password: usersPas,
			Role:     "user",
		}
		staff := models.User{
			ID:       uuid.NewString(),
			Email:    "staff@example.com",
			Password: usersPas,
			Role:     "staff",
		}

		if err := tx.Create(&[]models.User{admin, alumno, staff}).Error; err != nil {
			return err
		}

		// user_degree_programs (many2many)
		if err := tx.Model(&admin).Association("DegreePrograms").Replace([]*models.DegreeProgram{&dpSistemas, &dpAnalista}); err != nil {
			return err
		}
		if err := tx.Model(&alumno).Association("DegreePrograms").Replace([]*models.DegreeProgram{&dpSistemas}); err != nil {
			return err
		}
		if err := tx.Model(&staff).Association("DegreePrograms").Replace([]*models.DegreeProgram{&dpAnalista}); err != nil {
			return err
		}

		// 5) user_subjects (join con Status)
		// Cargamos estados variados para probar el sistema
		now := time.Now().UTC()

		entries := []models.UserSubject{
			{UserID: alumno.ID, SubjectID: ams.ID, Status: models.StatusPassed, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: algebra.ID, Status: models.StatusPassed, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: algo1.ID, Status: models.StatusInProgress, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: proba.ID, Status: models.StatusFinalPending, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: sintaxis.ID, Status: models.StatusAvailable, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: so.ID, Status: models.StatusAvailable, UpdatedAt: now},

			{UserID: admin.ID, SubjectID: ams.ID, Status: models.StatusPassedWithDist, UpdatedAt: now},
			{UserID: staff.ID, SubjectID: intro.ID, Status: models.StatusInProgress, UpdatedAt: now},
			{UserID: staff.ID, SubjectID: webA.ID, Status: models.StatusAvailable, UpdatedAt: now},
		}

		// Insert directo a la tabla join (porque tiene Status y UpdatedAt)
		if err := tx.Create(&entries).Error; err != nil {
			return err
		}

		// 6) Sessions (para testear auth rápido)
		sessions := []models.Session{
			{
				ID:        uuid.NewString(),
				UserID:    admin.ID,
				ExpiresAt: time.Now().UTC().Add(7 * 24 * time.Hour),
				Revoked:   false,
			},
			{
				ID:        uuid.NewString(),
				UserID:    alumno.ID,
				ExpiresAt: time.Now().UTC().Add(7 * 24 * time.Hour),
				Revoked:   false,
			},
		}
		if err := tx.Create(&sessions).Error; err != nil {
			return err
		}

		return nil
	})
}

func newSubject(name string, year int, programID string) *models.Subject {
	return &models.Subject{
		ID:              uuid.NewString(),
		Name:            name,
		Year:            &year,
		DegreeProgramID: programID,
	}
}

// resetAll intenta ser agnóstico del motor.
// - Para Postgres usa TRUNCATE ... RESTART IDENTITY CASCADE.
// - Para MySQL/MariaDB hace DELETE + limpia tablas intermedias.
func resetAll(tx *gorm.DB) error {
	d := tx.Dialector.Name()

	switch d {
	case "postgres":
		// OJO: incluye tablas join explícitas
		sql := `
		TRUNCATE TABLE
			subject_requirements,
			user_subjects,
			user_degree_programs,
			sessions,
			subjects,
			degree_programs,
			users,
			universities
		RESTART IDENTITY CASCADE;`
		return tx.Exec(sql).Error

	default:
		// Orden: primero joins / dependientes
		tables := []string{
			"subject_requirements",
			"user_subjects",
			"user_degree_programs",
			"sessions",
			"subjects",
			"degree_programs",
			"universities",
			"users",
		}
		for _, t := range tables {
			if err := tx.Exec("DELETE FROM " + t).Error; err != nil {
				return err
			}
		}
		return nil
	}
}
