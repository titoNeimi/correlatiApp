package main

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/models"
	"acadifyapp/internal/utils"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

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

		// 2) University
		utnFrba := models.University{
			ID:              "utn-frba",
			Name:            "Universidad Tecnológica Nacional - Facultad Regional Buenos Aires",
			Location:        "CABA, Argentina",
			Website:         "https://www.frba.utn.edu.ar",
			InstitutionType: models.InstitutionPublic,
			Summary:         "Facultad regional de la UTN con foco en ingeniería y tecnología aplicada.",
			LogoURL:         "https://www.frba.utn.edu.ar/wp-content/uploads/2017/10/logo-utn-frba.png",
			PrimaryFocus:    "Ingeniería aplicada y tecnología",
		}
		if err := tx.Create(&utnFrba).Error; err != nil {
			return err
		}

		tags := []models.UniversityTag{
			{UniversityID: utnFrba.ID, Tag: "Ingeniería"},
			{UniversityID: utnFrba.ID, Tag: "Tecnología"},
			{UniversityID: utnFrba.ID, Tag: "Investigación"},
			{UniversityID: utnFrba.ID, Tag: "Extensión"},
		}
		if err := tx.Create(&tags).Error; err != nil {
			return err
		}

		quickLinks := []models.QuickLink{
			{
				ID:           uuid.NewString(),
				UniversityID: utnFrba.ID,
				Label:        "Sitio oficial",
				URL:          "https://www.frba.utn.edu.ar",
			},
			{
				ID:           uuid.NewString(),
				UniversityID: utnFrba.ID,
				Label:        "Calendario académico",
				URL:          "https://www.frba.utn.edu.ar/academica/",
			},
			{
				ID:           uuid.NewString(),
				UniversityID: utnFrba.ID,
				Label:        "Admisiones",
				URL:          "https://www.frba.utn.edu.ar/ingreso/",
			},
		}
		if err := tx.Create(&quickLinks).Error; err != nil {
			return err
		}

		additionalInfo := []models.AdditionalInformation{
			{
				ID:           uuid.NewString(),
				UniversityID: utnFrba.ID,
				Title:        "Admisiones",
				Description:  "Información general sobre inscripciones, requisitos y fechas clave.",
				URL:          "https://www.frba.utn.edu.ar/ingreso/",
				Status:       "Disponible",
			},
			{
				ID:           uuid.NewString(),
				UniversityID: utnFrba.ID,
				Title:        "Becas y apoyos",
				Description:  "Programas de ayuda para estudiantes y beneficios disponibles.",
				Status:       "Disponible",
			},
			{
				ID:           uuid.NewString(),
				UniversityID: utnFrba.ID,
				Title:        "Vida universitaria",
				Description:  "Clubes, actividades y comunidad estudiantil.",
				Status:       "Pendiente",
			},
		}
		if err := tx.Create(&additionalInfo).Error; err != nil {
			return err
		}

		// 3) Degree Program
		dpISI := models.DegreeProgram{
			ID:           "utnfrba-isi-plan2023",
			Name:         "Ingeniería en Sistemas de Información",
			UniversityID: utnFrba.ID,
		}
		if err := tx.Create(&dpISI).Error; err != nil {
			return err
		}

		type seedSubject struct {
			Number     int
			ID         string
			Name       string
			Year       int
			Hours      float64
			Credits    float64
			IsElective bool
		}

		seedSubjects := []seedSubject{
			{Number: 1, ID: "utnfrba-isi-plan2023-sub-01", Name: "Análisis Matemático I", Year: 1, Hours: 120, Credits: 10, IsElective: false},
			{Number: 2, ID: "utnfrba-isi-plan2023-sub-02", Name: "Álgebra y Geometría Analítica", Year: 1, Hours: 120, Credits: 10, IsElective: false},
			{Number: 3, ID: "utnfrba-isi-plan2023-sub-03", Name: "Física I", Year: 1, Hours: 120, Credits: 10, IsElective: false},
			{Number: 4, ID: "utnfrba-isi-plan2023-sub-04", Name: "Inglés I", Year: 1, Hours: 48, Credits: 3, IsElective: false},
			{Number: 5, ID: "utnfrba-isi-plan2023-sub-05", Name: "Lógica y Estructuras Discretas", Year: 1, Hours: 72, Credits: 6, IsElective: false},
			{Number: 6, ID: "utnfrba-isi-plan2023-sub-06", Name: "Algoritmos y Estructuras de Datos", Year: 1, Hours: 120, Credits: 10, IsElective: false},
			{Number: 7, ID: "utnfrba-isi-plan2023-sub-07", Name: "Arquitectura de Computadoras", Year: 1, Hours: 96, Credits: 6, IsElective: false},
			{Number: 8, ID: "utnfrba-isi-plan2023-sub-08", Name: "Sistemas y Procesos de Negocio", Year: 1, Hours: 72, Credits: 5, IsElective: false},

			{Number: 9, ID: "utnfrba-isi-plan2023-sub-09", Name: "Análisis Matemático II", Year: 2, Hours: 120, Credits: 10, IsElective: false},
			{Number: 10, ID: "utnfrba-isi-plan2023-sub-10", Name: "Física II", Year: 2, Hours: 120, Credits: 10, IsElective: false},
			{Number: 11, ID: "utnfrba-isi-plan2023-sub-11", Name: "Ingeniería y Sociedad", Year: 2, Hours: 48, Credits: 3, IsElective: false},
			{Number: 12, ID: "utnfrba-isi-plan2023-sub-12", Name: "Inglés II", Year: 2, Hours: 48, Credits: 3, IsElective: false},
			{Number: 13, ID: "utnfrba-isi-plan2023-sub-13", Name: "Sintaxis y Semántica de los Lenguajes", Year: 2, Hours: 96, Credits: 8, IsElective: false},
			{Number: 14, ID: "utnfrba-isi-plan2023-sub-14", Name: "Paradigmas de Programación", Year: 2, Hours: 96, Credits: 8, IsElective: false},
			{Number: 15, ID: "utnfrba-isi-plan2023-sub-15", Name: "Sistemas Operativos", Year: 2, Hours: 96, Credits: 8, IsElective: false},
			{Number: 16, ID: "utnfrba-isi-plan2023-sub-16", Name: "Análisis de Sistemas de Información (integradora)", Year: 2, Hours: 144, Credits: 10, IsElective: false},

			{Number: 17, ID: "utnfrba-isi-plan2023-sub-17", Name: "Probabilidad y Estadística", Year: 3, Hours: 72, Credits: 6, IsElective: false},
			{Number: 18, ID: "utnfrba-isi-plan2023-sub-18", Name: "Economía", Year: 3, Hours: 72, Credits: 6, IsElective: false},
			{Number: 19, ID: "utnfrba-isi-plan2023-sub-19", Name: "Bases de Datos", Year: 3, Hours: 96, Credits: 8, IsElective: false},
			{Number: 20, ID: "utnfrba-isi-plan2023-sub-20", Name: "Desarrollo de Software", Year: 3, Hours: 96, Credits: 8, IsElective: false},
			{Number: 21, ID: "utnfrba-isi-plan2023-sub-21", Name: "Comunicación de Datos", Year: 3, Hours: 96, Credits: 8, IsElective: false},
			{Number: 22, ID: "utnfrba-isi-plan2023-sub-22", Name: "Análisis Numérico", Year: 3, Hours: 72, Credits: 6, IsElective: false},
			{Number: 23, ID: "utnfrba-isi-plan2023-sub-23", Name: "Diseño de Sistemas de Información (integradora)", Year: 3, Hours: 144, Credits: 10, IsElective: false},

			{Number: 24, ID: "utnfrba-isi-plan2023-sub-24", Name: "Legislación", Year: 4, Hours: 48, Credits: 3, IsElective: false},
			{Number: 25, ID: "utnfrba-isi-plan2023-sub-25", Name: "Ingeniería y Calidad de Software", Year: 4, Hours: 72, Credits: 6, IsElective: false},
			{Number: 26, ID: "utnfrba-isi-plan2023-sub-26", Name: "Redes de Datos", Year: 4, Hours: 96, Credits: 8, IsElective: false},
			{Number: 27, ID: "utnfrba-isi-plan2023-sub-27", Name: "Investigación Operativa", Year: 4, Hours: 96, Credits: 6, IsElective: false},
			{Number: 28, ID: "utnfrba-isi-plan2023-sub-28", Name: "Simulación", Year: 4, Hours: 72, Credits: 5, IsElective: false},
			{Number: 29, ID: "utnfrba-isi-plan2023-sub-29", Name: "Tecnologías para la automatización", Year: 4, Hours: 72, Credits: 6, IsElective: false},
			{Number: 30, ID: "utnfrba-isi-plan2023-sub-30", Name: "Administración de Sistemas de Información (integradora)", Year: 4, Hours: 144, Credits: 10, IsElective: false},

			{Number: 31, ID: "utnfrba-isi-plan2023-sub-31", Name: "Inteligencia Artificial", Year: 5, Hours: 72, Credits: 6, IsElective: false},
			{Number: 32, ID: "utnfrba-isi-plan2023-sub-32", Name: "Ciencia de Datos", Year: 5, Hours: 72, Credits: 6, IsElective: false},
			{Number: 33, ID: "utnfrba-isi-plan2023-sub-33", Name: "Sistemas de Gestión", Year: 5, Hours: 96, Credits: 8, IsElective: false},
			{Number: 34, ID: "utnfrba-isi-plan2023-sub-34", Name: "Gestión Gerencial", Year: 5, Hours: 72, Credits: 6, IsElective: false},
			{Number: 35, ID: "utnfrba-isi-plan2023-sub-35", Name: "Seguridad en los Sistemas de Información", Year: 5, Hours: 72, Credits: 6, IsElective: false},
			{Number: 36, ID: "utnfrba-isi-plan2023-sub-36", Name: "Proyecto Final (integradora)", Year: 5, Hours: 144, Credits: 15, IsElective: false},
		}

		subjects := make([]*models.Subject, 0, len(seedSubjects))
		subjectIDsByNumber := make(map[int]string, len(seedSubjects))
		for _, s := range seedSubjects {
			year := s.Year
			subjects = append(subjects, &models.Subject{
				ID:              s.ID,
				Name:            s.Name,
				Year:            &year,
				Term:            "annual",
				DegreeProgramID: dpISI.ID,
				Credits:         s.Credits,
				Hours:           s.Hours,
				IsElective:      s.IsElective,
			})
			subjectIDsByNumber[s.Number] = s.ID
		}
		if err := tx.Create(&subjects).Error; err != nil {
			return err
		}

		addReq := func(subjectNumber, requirementNumber int, min models.RequirementMinStatus) error {
			subjectID, ok := subjectIDsByNumber[subjectNumber]
			if !ok {
				return fmt.Errorf("subject number %d not found", subjectNumber)
			}
			requirementID, ok := subjectIDsByNumber[requirementNumber]
			if !ok {
				return fmt.Errorf("requirement number %d not found", requirementNumber)
			}
			return tx.Create(&models.SubjectRequirement{
				SubjectID:     subjectID,
				RequirementID: requirementID,
				MinStatus:     min,
			}).Error
		}

		requirements := []struct {
			SubjectNumber     int
			RequirementNumber int
			MinStatus         models.RequirementMinStatus
		}{
			{9, 1, models.ReqFinalPending},
			{9, 2, models.ReqFinalPending},
			{10, 1, models.ReqFinalPending},
			{10, 3, models.ReqFinalPending},
			{12, 4, models.ReqFinalPending},
			{13, 5, models.ReqFinalPending},
			{13, 6, models.ReqFinalPending},
			{14, 5, models.ReqFinalPending},
			{14, 6, models.ReqFinalPending},
			{15, 7, models.ReqFinalPending},
			{16, 6, models.ReqFinalPending},
			{16, 8, models.ReqFinalPending},
			{17, 1, models.ReqFinalPending},
			{17, 2, models.ReqFinalPending},
			{18, 1, models.ReqPassed},
			{18, 2, models.ReqPassed},
			{19, 13, models.ReqFinalPending},
			{19, 16, models.ReqFinalPending},
			{19, 5, models.ReqPassed},
			{19, 6, models.ReqPassed},
			{20, 14, models.ReqFinalPending},
			{20, 16, models.ReqFinalPending},
			{20, 5, models.ReqPassed},
			{20, 6, models.ReqPassed},
			{21, 3, models.ReqPassed},
			{21, 7, models.ReqPassed},
			{22, 9, models.ReqFinalPending},
			{22, 1, models.ReqPassed},
			{22, 2, models.ReqPassed},
			{23, 14, models.ReqFinalPending},
			{23, 16, models.ReqFinalPending},
			{23, 4, models.ReqPassed},
			{23, 6, models.ReqPassed},
			{23, 8, models.ReqPassed},
			{24, 11, models.ReqFinalPending},
			{25, 19, models.ReqFinalPending},
			{25, 20, models.ReqFinalPending},
			{25, 23, models.ReqFinalPending},
			{25, 13, models.ReqPassed},
			{25, 14, models.ReqPassed},
			{26, 15, models.ReqFinalPending},
			{26, 21, models.ReqFinalPending},
			{27, 17, models.ReqFinalPending},
			{27, 22, models.ReqFinalPending},
			{28, 17, models.ReqFinalPending},
			{28, 9, models.ReqPassed},
			{29, 10, models.ReqFinalPending},
			{29, 22, models.ReqFinalPending},
			{29, 9, models.ReqPassed},
			{30, 18, models.ReqFinalPending},
			{30, 23, models.ReqFinalPending},
			{30, 16, models.ReqPassed},
			{31, 28, models.ReqFinalPending},
			{31, 17, models.ReqPassed},
			{31, 22, models.ReqPassed},
			{32, 28, models.ReqFinalPending},
			{32, 17, models.ReqPassed},
			{32, 19, models.ReqPassed},
			{33, 18, models.ReqFinalPending},
			{33, 27, models.ReqFinalPending},
			{33, 23, models.ReqPassed},
			{34, 24, models.ReqFinalPending},
			{34, 30, models.ReqFinalPending},
			{34, 18, models.ReqPassed},
			{35, 26, models.ReqFinalPending},
			{35, 30, models.ReqFinalPending},
			{35, 20, models.ReqPassed},
			{35, 21, models.ReqPassed},
			{36, 25, models.ReqFinalPending},
			{36, 26, models.ReqFinalPending},
			{36, 30, models.ReqFinalPending},
			{36, 12, models.ReqPassed},
			{36, 20, models.ReqPassed},
			{36, 23, models.ReqPassed},
		}
		for _, req := range requirements {
			if err := addReq(req.SubjectNumber, req.RequirementNumber, req.MinStatus); err != nil {
				return err
			}
		}

		pools := []models.ElectivePool{
			{
				ID:              "utnfrba-isi-plan2023-pool-electivas-y3",
				DegreeProgramID: dpISI.ID,
				Name:            "Electivas 3º nivel",
				Description:     "Espacio de materias electivas del 3º nivel (plan 2023). (Materias electivas específicas no listadas en los PDFs provistos).",
			},
			{
				ID:              "utnfrba-isi-plan2023-pool-electivas-y4",
				DegreeProgramID: dpISI.ID,
				Name:            "Electivas 4º nivel",
				Description:     "Espacio de materias electivas del 4º nivel (plan 2023). (Materias electivas específicas no listadas en los PDFs provistos).",
			},
			{
				ID:              "utnfrba-isi-plan2023-pool-electivas-y5",
				DegreeProgramID: dpISI.ID,
				Name:            "Electivas 5º nivel",
				Description:     "Espacio de materias electivas del 5º nivel (plan 2023). (Materias electivas específicas no listadas en los PDFs provistos).",
			},
		}
		if err := tx.Create(&pools).Error; err != nil {
			return err
		}

		electiveSubjects := []struct {
			ID      string
			Name    string
			Level   int
			Hours   float64
			Credits float64
		}{
			{ID: "utnfrba-isi2023-elect-adm-capital-humano", Name: "Administración Estratégica del Capital Humano", Level: 3, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-ciberseguridad", Name: "Ciberseguridad", Level: 3, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-com-grav", Name: "Comunicación Gráfica y Visual", Level: 3, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-creatividad", Name: "Creatividad e Innovación", Level: 3, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-criptografia", Name: "Criptografía", Level: 3, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-ux", Name: "Experiencia de Usuario y Accesibilidad", Level: 4, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-ger-proy-sis", Name: "Gerenciamiento de Proyectos de Sistemas de Información", Level: 4, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-gest-talento", Name: "Gestión del Talento Humano", Level: 4, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-ing-req", Name: "Ingeniería de Requisitos", Level: 4, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-met-invest-cy-t", Name: "Metodología de Investigación Científico-Tecnológica", Level: 4, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-met-condu-equip", Name: "Metodología de la Conducción de Equipos de Trabajo", Level: 4, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-patrones-algo", Name: "Patrones Algorítmicos", Level: 5, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-pln", Name: "Procesamiento del Lenguaje Natural", Level: 5, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-quim-ambi", Name: "Química Ambiental", Level: 5, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-tec-avanz-prog", Name: "Técnicas Avanzadas de Programación", Level: 5, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-tec-graph-comp", Name: "Técnicas de Gráficos por Computadora", Level: 5, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-tec-avanz-soft", Name: "Tecnologías Avanzadas en la Construcción de Software", Level: 5, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-tend-escenarios", Name: "Tendencias y Escenarios Tecnológicos", Level: 5, Hours: 48, Credits: 3},
			{ID: "utnfrba-isi2023-elect-transform-dig", Name: "Transformación Digital", Level: 5, Hours: 48, Credits: 3},
		}

		poolByLevel := map[int]string{
			3: "utnfrba-isi-plan2023-pool-electivas-y3",
			4: "utnfrba-isi-plan2023-pool-electivas-y4",
			5: "utnfrba-isi-plan2023-pool-electivas-y5",
		}

		electiveModels := make([]*models.Subject, 0, len(electiveSubjects))
		electivePoolSubjects := make([]models.ElectivePoolSubject, 0, len(electiveSubjects))
		for _, subject := range electiveSubjects {
			year := subject.Level
			electiveModels = append(electiveModels, &models.Subject{
				ID:              subject.ID,
				Name:            subject.Name,
				Year:            &year,
				Term:            "annual",
				DegreeProgramID: dpISI.ID,
				Hours:           subject.Hours,
				Credits:         subject.Credits,
				IsElective:      true,
			})
			if poolID, ok := poolByLevel[subject.Level]; ok {
				electivePoolSubjects = append(electivePoolSubjects, models.ElectivePoolSubject{
					ElectivePoolID: poolID,
					SubjectID:      subject.ID,
				})
			}
		}

		if err := tx.Create(&electiveModels).Error; err != nil {
			return err
		}
		if len(electivePoolSubjects) > 0 {
			if err := tx.Create(&electivePoolSubjects).Error; err != nil {
				return err
			}
		}

		year3 := 3
		year4 := 4
		year5 := 5
		rules := []models.ElectiveRule{
			{
				ID:              "utnfrba-isi-plan2023-pool-electivas-y3-rule-hours",
				DegreeProgramID: dpISI.ID,
				PoolID:          "utnfrba-isi-plan2023-pool-electivas-y3",
				AppliesFromYear: 3,
				AppliesToYear:   &year3,
				RequirementType: models.RequirementHours,
				MinimumValue:    96,
			},
			{
				ID:              "utnfrba-isi-plan2023-pool-electivas-y4-rule-hours",
				DegreeProgramID: dpISI.ID,
				PoolID:          "utnfrba-isi-plan2023-pool-electivas-y4",
				AppliesFromYear: 4,
				AppliesToYear:   &year4,
				RequirementType: models.RequirementHours,
				MinimumValue:    144,
			},
			{
				ID:              "utnfrba-isi-plan2023-pool-electivas-y5-rule-hours",
				DegreeProgramID: dpISI.ID,
				PoolID:          "utnfrba-isi-plan2023-pool-electivas-y5",
				AppliesFromYear: 5,
				AppliesToYear:   &year5,
				RequirementType: models.RequirementHours,
				MinimumValue:    240,
			},
		}
		if err := tx.Create(&rules).Error; err != nil {
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
		if err := tx.Model(&admin).Association("DegreePrograms").Replace([]*models.DegreeProgram{&dpISI}); err != nil {
			return err
		}
		if err := tx.Model(&alumno).Association("DegreePrograms").Replace([]*models.DegreeProgram{&dpISI}); err != nil {
			return err
		}
		if err := tx.Model(&staff).Association("DegreePrograms").Replace([]*models.DegreeProgram{&dpISI}); err != nil {
			return err
		}

		// 5) user_subjects (join con Status)
		// Cargamos estados variados para probar el sistema
		now := time.Now().UTC()

		entries := []models.UserSubject{
			{UserID: alumno.ID, SubjectID: subjectIDsByNumber[1], Status: models.StatusPassed, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: subjectIDsByNumber[2], Status: models.StatusPassed, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: subjectIDsByNumber[6], Status: models.StatusInProgress, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: subjectIDsByNumber[17], Status: models.StatusFinalPending, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: subjectIDsByNumber[13], Status: models.StatusAvailable, UpdatedAt: now},
			{UserID: alumno.ID, SubjectID: subjectIDsByNumber[15], Status: models.StatusAvailable, UpdatedAt: now},

			{UserID: admin.ID, SubjectID: subjectIDsByNumber[1], Status: models.StatusPassedWithDist, UpdatedAt: now},
			{UserID: staff.ID, SubjectID: subjectIDsByNumber[4], Status: models.StatusInProgress, UpdatedAt: now},
			{UserID: staff.ID, SubjectID: subjectIDsByNumber[8], Status: models.StatusAvailable, UpdatedAt: now},
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
			university_additional_information,
			university_quick_links,
			university_tags,
			subject_requirements,
			elective_pool_subjects,
			elective_rules,
			elective_pools,
			user_subjects,
			user_degree_programs,
			user_favorite_programs,
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
			"university_additional_information",
			"university_quick_links",
			"university_tags",
			"subject_requirements",
			"elective_pool_subjects",
			"elective_rules",
			"elective_pools",
			"user_subjects",
			"user_degree_programs",
			"user_favorite_programs",
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
