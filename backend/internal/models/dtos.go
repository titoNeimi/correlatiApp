package models

type SubjectUpdateDTO struct {
	Name            *string   `json:"name,omitempty"`
	Year            *int      `json:"year,omitempty"`
	Term            *string   `json:"term,omitempty"`
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
	Name                  *string                     `json:"name,omitempty"`
	Location              *string                     `json:"location,omitempty"`
	Website               *string                     `json:"website,omitempty"`
	InstitutionType       *InstitutionType            `json:"institution_type,omitempty"`
	Summary               *string                     `json:"summary,omitempty"`
	LogoURL               *string                     `json:"logo_url,omitempty"`
	PrimaryFocus          *string                     `json:"primary_focus,omitempty"`
	FocusTags             *[]string                   `json:"focus_tags,omitempty"`
	QuickLinks            *[]QuickLinkDTO             `json:"quick_links,omitempty"`
	AdditionalInformation *[]AdditionalInformationDTO `json:"additional_information,omitempty"`
}

type QuickLinkDTO struct {
	ID    *string `json:"id,omitempty"`
	Label *string `json:"label,omitempty"`
	URL   *string `json:"url,omitempty"`
}

type AdditionalInformationDTO struct {
	ID          *string `json:"id,omitempty"`
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	URL         *string `json:"url,omitempty"`
	Status      *string `json:"status,omitempty"`
}
