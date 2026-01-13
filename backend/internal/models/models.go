package models

import (
	"time"

	"gorm.io/gorm"
)

type SubjectStatus string

const (
	StatusAvailable      SubjectStatus = "available"
	StatusInProgress     SubjectStatus = "in_progress"
	StatusPassedWithDist SubjectStatus = "passed_with_distinction"
	StatusFinalPending   SubjectStatus = "final_pending"
	StatusPassed         SubjectStatus = "passed"
)

type DegreeProgramApprovalStatus string

const (
	DegreeProgramPending  DegreeProgramApprovalStatus = "pending"
	DegreeProgramApproved DegreeProgramApprovalStatus = "approved"
	DegreeProgramRejected DegreeProgramApprovalStatus = "rejected"
)

type RequirementMinStatus string

const (
	ReqPassed       RequirementMinStatus = "passed"
	ReqFinalPending RequirementMinStatus = "final_pending"
)

type User struct {
	ID               string           `json:"id" gorm:"primaryKey;size:191"`
	Email            string           `json:"email" gorm:"unique;not null;size:191"`
	Password         string           `json:"password" gorm:"not null"`
	DegreePrograms   []*DegreeProgram `json:"degreePrograms" gorm:"many2many:user_degree_programs"`
	FavoritePrograms []*DegreeProgram `json:"favoritePrograms" gorm:"many2many:user_favorite_programs"`
	Subjects         []Subject        `json:"subjects" gorm:"many2many:user_subjects"`
	Role             string           `json:"role" gorm:"type:enum('admin', 'user', 'staff');default:'user'"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

type University struct {
	ID             string          `json:"id" gorm:"primaryKey;size:191"`
	Name           string          `json:"name" gorm:"unique;not null;size:191"`
	Location       string          `json:"location,omitempty" gorm:"size:191"`
	Website        string          `json:"website,omitempty" gorm:"size:191"`
	DegreePrograms []DegreeProgram `json:"degreePrograms,omitempty" gorm:"constraint:OnDelete:CASCADE;"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type DegreeProgram struct {
	ID              string                      `json:"id" gorm:"primaryKey;size:191"`
	Name            string                      `json:"name" gorm:"not null;size:191"`
	UniversityID    string                      `json:"universityID" gorm:"not null;size:191;index"`
	University      University                  `json:"university" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Subjects        []Subject                   `json:"subjects" gorm:"foreignKey:DegreeProgramID;constraint:OnDelete:CASCADE"`
	ElectiveRules   []ElectiveRule              `json:"electiveRules,omitempty" gorm:"foreignKey:DegreeProgramID;constraint:OnDelete:CASCADE"`
	ElectivePools   []ElectivePool              `json:"electivePools,omitempty" gorm:"foreignKey:DegreeProgramID;constraint:OnDelete:CASCADE"`
	Users           []*User                     `json:"users" gorm:"many2many:user_degree_programs"`
	FavoritedBy     []*User                     `json:"favoritedBy,omitempty" gorm:"many2many:user_favorite_programs"`
	ApprovalStatus  DegreeProgramApprovalStatus `json:"approvalStatus" gorm:"type:enum('pending','approved','rejected');default:'pending'"`
	PublicRequested bool                        `json:"publicRequested" gorm:"default:false"`
	CreatedAt       time.Time                   `json:"created_at"`
	UpdatedAt       time.Time                   `json:"updated_at"`
}

type Subject struct {
	ID              string         `json:"id" gorm:"primaryKey;size:191"`
	Name            string         `json:"name" gorm:"not null;size:191"`
	Year            *int           `json:"year,omitempty" gorm:"column:subject_year"`
	Requirements    []*Subject     `json:"requirements" gorm:"many2many:subject_requirements;joinForeignKey:SubjectID;joinReferences:RequirementID"`
	DegreeProgramID string         `json:"degreeProgramID" gorm:"not null;size:191;index"`
	Credits         float64        `json:"credits,omitempty"`
	Hours           float64        `json:"hours,omitempty"`
	IsElective      bool           `json:"is_elective" gorm:"default:false"`
	ElectivePools   []ElectivePool `json:"electivePools,omitempty" gorm:"many2many:elective_pool_subjects"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

type UserSubject struct {
	UserID    string        `gorm:"primaryKey;size:191;index:user_subject_unique,unique"`
	SubjectID string        `gorm:"primaryKey;size:191;index:user_subject_unique,unique"`
	Status    SubjectStatus `gorm:"type:enum('available','in_progress','passed_with_distinction','final_pending','passed');default:'available'"`
	UpdatedAt time.Time
	User      User    `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE"`
	Subject   Subject `gorm:"foreignKey:SubjectID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE"`
}

func (UserSubject) TableName() string { return "user_subjects" }

type SubjectRequirement struct {
	SubjectID     string               `gorm:"primaryKey;size:191;index:uniq_subject_req,unique"`
	RequirementID string               `gorm:"primaryKey;size:191;index:uniq_subject_req,unique"`
	MinStatus     RequirementMinStatus `gorm:"type:enum('passed','final_pending');not null;default:'passed'"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (SubjectRequirement) TableName() string { return "subject_requirements" }

type Session struct {
	ID        string    `gorm:"type:char(36);primaryKey"`
	UserID    string    `gorm:"not null;index"`
	ExpiresAt time.Time `gorm:"index;not null"`
	Revoked   bool      `gorm:"default:false;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type ElectivePool struct {
	ID              string        `json:"id" gorm:"primaryKey;size:191"`
	DegreeProgramID string        `json:"degree_program_id" gorm:"not null;size:191;index"`
	DegreeProgram   DegreeProgram `json:"degree_program,omitempty" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Name            string        `json:"name" gorm:"not null;size:191"`
	Description     string        `json:"description,omitempty" gorm:"size:191"`
	Subjects        []Subject     `json:"subjects,omitempty" gorm:"many2many:elective_pool_subjects"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}

type ElectivePoolSubject struct {
	ElectivePoolID string       `json:"pool_id" gorm:"primaryKey;size:191;index:uniq_pool_subject,unique"`
	SubjectID      string       `json:"subject_id" gorm:"primaryKey;size:191;index:uniq_pool_subject,unique"`
	Pool           ElectivePool `json:"pool,omitempty" gorm:"foreignKey:ElectivePoolID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE"`
	Subject        Subject      `json:"subject,omitempty" gorm:"foreignKey:SubjectID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE"`
}

func (ElectivePoolSubject) TableName() string { return "elective_pool_subjects" }

type ElectiveRequirementType string

const (
	RequirementHours        ElectiveRequirementType = "hours"
	RequirementCredits      ElectiveRequirementType = "credits"
	RequirementSubjectCount ElectiveRequirementType = "subject_count"
)

type ElectiveRule struct {
	ID              string                  `json:"id" gorm:"primaryKey;size:191"`
	DegreeProgramID string                  `json:"degree_program_id" gorm:"not null;size:191;index"`
	DegreeProgram   DegreeProgram           `json:"degree_program,omitempty" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	PoolID          string                  `json:"pool_id" gorm:"not null;size:191;index"`
	Pool            ElectivePool            `json:"pool,omitempty" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	AppliesFromYear int                     `json:"applies_from_year" gorm:"not null"`
	AppliesToYear   *int                    `json:"applies_to_year,omitempty"`
	RequirementType ElectiveRequirementType `json:"requirement_type" gorm:"type:enum('hours','credits','subject_count');not null"`
	MinimumValue    float64                 `json:"minimum_value" gorm:"not null"`
	CreatedAt       time.Time               `json:"created_at"`
	UpdatedAt       time.Time               `json:"updated_at"`
}
