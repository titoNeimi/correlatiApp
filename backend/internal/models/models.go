package models

import (
	"time"
	"gorm.io/gorm"
)
type SubjectStatus string

const (
	StatusAvailable           SubjectStatus = "available"
	StatusInProgress          SubjectStatus = "in_progress"
	StatusPassedWithDist      SubjectStatus = "passed_with_distinction"
	StatusFinalPending        SubjectStatus = "final_pending"
	StatusPassed              SubjectStatus = "passed"
)


type User struct {
	ID             string           `json:"id" gorm:"primaryKey;size:191"`
	Email          string           `json:"email" gorm:"unique;not null;size:191"`
	Password       string           `json:"password" gorm:"not null"`
	DegreePrograms []*DegreeProgram `json:"degreePrograms" gorm:"many2many:user_degree_programs"`
	Subjects       []Subject        `json:"subjects" gorm:"many2many:user_subjects"`
	Role					 string           `json:"role" gorm:"type:enum('admin', 'user', 'staff');default:'user'"`
	CreatedAt      time.Time        `json:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at"`
}

type DegreeProgram struct {
	ID         string    `json:"id" gorm:"primaryKey;size:191"`
	Name       string    `json:"name" gorm:"not null;size:191"`
	University string    `json:"university" gorm:"not null;size:191"`
	Subjects   []Subject `json:"subjects" gorm:"foreignKey:DegreeProgramID;constraint:OnDelete:CASCADE"`
	Users      []*User   `json:"users" gorm:"many2many:user_degree_programs"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Subject struct {
	ID              string     `json:"id" gorm:"primaryKey;size:191"`
	Name            string     `json:"name" gorm:"not null;size:191"`
	SubjectYear     int        `json:"subjectYear" gorm:"not null"`
	Requirements    []*Subject `json:"requirements" gorm:"many2many:subject_requirements;joinForeignKey:SubjectID;joinReferences:RequirementID"`
	DegreeProgramID string     `json:"degreeProgramID" gorm:"not null;size:191;index"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	UserSubject *UserSubject   `json:"-" gorm:"-:all"`
}


type UserSubject struct {
	UserID    string        `gorm:"primaryKey;size:191;index:user_subject_unique,unique"`
	SubjectID string        `gorm:"primaryKey;size:191;index:user_subject_unique,unique"`
	Status    SubjectStatus `gorm:"type:enum('available','in_progress','passed_with_distinction','final_pending','passed');default:'available'"`
	UpdatedAt time.Time
	User    User    `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE"`
	Subject Subject `gorm:"foreignKey:SubjectID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE"`
}

func (UserSubject) TableName() string { return "user_subjects" }

type SubjectRequirement struct {
	SubjectID     string  `gorm:"primaryKey;size:191;index:uniq_subject_req,unique"`
	RequirementID string  `gorm:"primaryKey;size:191;index:uniq_subject_req,unique"`
	Subject       Subject `gorm:"foreignKey:SubjectID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE"`
	Requirement   Subject `gorm:"foreignKey:RequirementID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE"`
}

func (SubjectRequirement) TableName() string { return "subject_requirements" }


type Session struct {
	ID        string         `gorm:"type:char(36);primaryKey"`
	UserID    string          `gorm:"not null;index"`
	ExpiresAt time.Time      `gorm:"index;not null"`
	Revoked   bool           `gorm:"default:false;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}