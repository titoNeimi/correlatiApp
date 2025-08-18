package models


type SubjectUpdateDTO struct {
    Name            *string   `json:"name,omitempty"`
    SubjectYear     *int      `json:"subjectYear,omitempty"`
    Status          *string   `json:"subjectStatus,omitempty"`
    DegreeProgramID *string   `json:"degreeProgramID,omitempty"`
    RequirementIDs  *[]string `json:"requirements,omitempty" gorm:"-"`
}

type UserUpdateDTO struct {
	Email             *string        `json:"email,omitempty"`
	Password          *string        `json:"password,omitempty"`
	DegreeProgramsID  *[]string      `json:"degreePrograms,omitempty" gorm:"-"`
}