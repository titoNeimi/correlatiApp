package models

type SubjectUpdateDTO struct {
	Name            *string   `json:"name,omitempty"`
	Year            *int      `json:"year,omitempty"`
	Status          *string   `json:"subjectStatus,omitempty"`
	DegreeProgramID *string   `json:"degreeProgramID,omitempty"`
	RequirementIDs  *[]string `json:"requirements,omitempty" gorm:"-"`
}

type UserUpdateDTO struct {
	Email            *string   `json:"email,omitempty"`
	Password         *string   `json:"password,omitempty"`
	DegreeProgramsID *[]string `json:"degreePrograms,omitempty" gorm:"-"`
	Role             *string   `json:"role,omitempty"`
}

type SubjectWithUserStatusDTO struct {
	ID              string        `json:"id"`
	Name            string        `json:"name"`
	Year            *int          `json:"year,omitempty"`
	DegreeProgramID string        `json:"degreeProgramID"`
	Status          SubjectStatus `json:"status"`
	RequirementsIDs []string      `json:"requirements,omitempty"`
}

type UniversityUpdateDTO struct {
	Name     *string `json:"name,omitempty"`
	Location *string `json:"location,omitempty"`
	Website  *string `json:"website,omitempty"`
}
