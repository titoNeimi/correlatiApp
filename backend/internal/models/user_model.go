package models

import "time"


type User struct {
	ID             string          		`json:"id" gorm:"primaryKey;size:191"`
	Email          string          		`json:"email" gorm:"unique;not null;size:191"`
	Password       string          		`json:"password" gorm:"not null"`
	DegreePrograms []*DegreeProgram 	`json:"degreePrograms" gorm:"many2many:user_degree_programs;"`
	CreatedAt      time.Time					`json:"created_at"`
	UpdatedAt      time.Time					`json:"updated_at"`
}

type DegreeProgram struct {
	ID         		string     			`json:"id" gorm:"primaryKey;size:191"`
	Name       		string     			`json:"name" gorm:"not null;size:191"`
	University 		string     			`json:"university" gorm:"not null;size:191"`
	Subjects   		[]Subject  			`json:"subjects" gorm:"foreignKey:DegreeProgramID"`
	Users      		[]*User     		`json:"users" gorm:"many2many:user_degree_programs;"`
	CreatedAt  		time.Time				`json:"created_at"`
	UpdatedAt  		time.Time				`json:"updated_at"`

}

type Subject struct {
	ID              string     		`json:"id" gorm:"primaryKey;size:191"`
	Name            string     		`json:"name" gorm:"not null;size:191"`
	SubjectYear     int        		`json:"subjectYear" gorm:"not null"`
	Requirements    []*Subject 		`json:"requirements" gorm:"many2many:subject_requirements;"`
	Status          string     		`json:"subjectStatus" gorm:"type:enum('available','in_progress','passed_with_distinction','final_pending','passed');default:'available'"`
	DegreeProgramID string     		`json:"degreeProgramID" gorm:"not null;size:191"`
	CreatedAt      time.Time			`json:"created_at"`
	UpdatedAt      time.Time			`json:"updated_at"`

}