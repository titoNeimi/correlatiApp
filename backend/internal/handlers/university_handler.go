package handlers

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/models"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type createUniversityRequest struct {
	Name                  string                            `json:"name" binding:"required"`
	Location              string                            `json:"location"`
	Website               string                            `json:"website"`
	InstitutionType       *models.InstitutionType           `json:"institution_type"`
	Summary               string                            `json:"summary"`
	LogoURL               string                            `json:"logo_url"`
	PrimaryFocus          string                            `json:"primary_focus"`
	FocusTags             []string                          `json:"focus_tags"`
	QuickLinks            []models.QuickLinkDTO             `json:"quick_links"`
	AdditionalInformation []models.AdditionalInformationDTO `json:"additional_information"`
}

func CreateUniversity(c *gin.Context) {
	var req createUniversityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	var exists int64
	if err := db.Db.Model(&models.University{}).Where("name = ?", name).Count(&exists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error checking university"})
		return
	}
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "university already exists"})
		return
	}

	if req.InstitutionType != nil && !isValidInstitutionType(*req.InstitutionType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid institution_type"})
		return
	}

	quickLinks, err := buildQuickLinks(req.QuickLinks)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	additionalInfo, err := buildAdditionalInformation(req.AdditionalInformation)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	tags := normalizeTags(req.FocusTags)

	university := models.University{
		ID:           uuid.NewString(),
		Name:         name,
		Location:     strings.TrimSpace(req.Location),
		Website:      strings.TrimSpace(req.Website),
		Summary:      strings.TrimSpace(req.Summary),
		LogoURL:      strings.TrimSpace(req.LogoURL),
		PrimaryFocus: strings.TrimSpace(req.PrimaryFocus),
	}

	if req.InstitutionType != nil {
		university.InstitutionType = *req.InstitutionType
	}

	tx := db.Db.Begin()
	if tx.Error != nil {
		slog.Error("Error starting transaction", slog.Any("error", tx.Error))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create university"})
		return
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	createTx := tx
	if req.InstitutionType == nil {
		createTx = createTx.Omit("InstitutionType")
	}

	if err := createTx.Create(&university).Error; err != nil {
		tx.Rollback()
		slog.Error("Error creating university", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create university"})
		return
	}

	if len(tags) > 0 {
		for i := range tags {
			tags[i].UniversityID = university.ID
		}
		if err := tx.Create(&tags).Error; err != nil {
			tx.Rollback()
			slog.Error("Error creating university tags", slog.Any("error", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create university"})
			return
		}
	}
	if len(quickLinks) > 0 {
		for i := range quickLinks {
			quickLinks[i].UniversityID = university.ID
		}
		if err := tx.Create(&quickLinks).Error; err != nil {
			tx.Rollback()
			slog.Error("Error creating university quick links", slog.Any("error", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create university"})
			return
		}
	}
	if len(additionalInfo) > 0 {
		for i := range additionalInfo {
			additionalInfo[i].UniversityID = university.ID
		}
		if err := tx.Create(&additionalInfo).Error; err != nil {
			tx.Rollback()
			slog.Error("Error creating university additional information", slog.Any("error", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create university"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		slog.Error("Error committing university create", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create university"})
		return
	}

	if err := db.Db.
		Preload("DegreePrograms").
		Preload("FocusTags").
		Preload("QuickLinks").
		Preload("AdditionalInformation").
		First(&university, "id = ?", university.ID).Error; err != nil {
		slog.Error("Error loading created university", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create university"})
		return
	}

	c.JSON(http.StatusCreated, university)
}

func GetAllUniversities(c *gin.Context) {
	var universities []models.University

	page, limit, offset := parsePagination(c)
	query := db.Db.Model(&models.University{})
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error loading universities"})
		return
	}

	if err := query.
		Preload("DegreePrograms").
		Preload("FocusTags").
		Preload("QuickLinks").
		Preload("AdditionalInformation").
		Limit(limit).Offset(offset).Find(&universities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error loading universities"})
		return
	}
	if !isAdminOrStaffForUniversities(c) {
		for i := range universities {
			universities[i].DegreePrograms = filterPublicPrograms(universities[i].DegreePrograms)
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"count": total,
		"page":  page,
		"limit": limit,
		"data":  universities,
	})
}

func GetUniversityByID(c *gin.Context) {
	id := c.Param("id")
	var university models.University
	if err := db.Db.
		Preload("DegreePrograms").
		Preload("FocusTags").
		Preload("QuickLinks").
		Preload("AdditionalInformation").
		First(&university, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "university not found"})
		return
	}
	if !isAdminOrStaffForUniversities(c) {
		university.DegreePrograms = filterPublicPrograms(university.DegreePrograms)
	}
	c.JSON(http.StatusOK, university)
}

func UpdateUniversity(c *gin.Context) {
	id := c.Param("id")
	var payload models.UniversityUpdateDTO
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	updates := make(map[string]interface{})
	hasRelationUpdates := false
	if payload.Name != nil {
		name := strings.TrimSpace(*payload.Name)
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name cannot be empty"})
			return
		}
		updates["name"] = name
	}
	if payload.Location != nil {
		updates["location"] = strings.TrimSpace(*payload.Location)
	}
	if payload.Website != nil {
		updates["website"] = strings.TrimSpace(*payload.Website)
	}
	if payload.InstitutionType != nil {
		if !isValidInstitutionType(*payload.InstitutionType) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid institution_type"})
			return
		}
		updates["institution_type"] = *payload.InstitutionType
	}
	if payload.Summary != nil {
		updates["summary"] = strings.TrimSpace(*payload.Summary)
	}
	if payload.LogoURL != nil {
		updates["logo_url"] = strings.TrimSpace(*payload.LogoURL)
	}
	if payload.PrimaryFocus != nil {
		updates["primary_focus"] = strings.TrimSpace(*payload.PrimaryFocus)
	}
	if payload.FocusTags != nil || payload.QuickLinks != nil || payload.AdditionalInformation != nil {
		hasRelationUpdates = true
	}

	if len(updates) == 0 && !hasRelationUpdates {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	tx := db.Db.Begin()
	if tx.Error != nil {
		slog.Error("Error starting transaction", slog.Any("error", tx.Error))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
		return
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	if err := tx.First(&models.University{}, "id = ?", id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "university not found"})
			return
		}
		slog.Error("Error loading university", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
		return
	}

	if len(updates) > 0 {
		if err := tx.Model(&models.University{}).Where("id = ?", id).Updates(updates).Error; err != nil {
			tx.Rollback()
			slog.Error("Error updating university", slog.Any("error", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
			return
		}
	}

	if payload.FocusTags != nil {
		tags := normalizeTags(*payload.FocusTags)
		if err := tx.Where("university_id = ?", id).Delete(&models.UniversityTag{}).Error; err != nil {
			tx.Rollback()
			slog.Error("Error clearing university tags", slog.Any("error", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
			return
		}
		if len(tags) > 0 {
			for i := range tags {
				tags[i].UniversityID = id
			}
			if err := tx.Create(&tags).Error; err != nil {
				tx.Rollback()
				slog.Error("Error creating university tags", slog.Any("error", err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
				return
			}
		}
	}

	if payload.QuickLinks != nil {
		quickLinks, err := buildQuickLinks(*payload.QuickLinks)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := tx.Where("university_id = ?", id).Delete(&models.QuickLink{}).Error; err != nil {
			tx.Rollback()
			slog.Error("Error clearing university quick links", slog.Any("error", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
			return
		}
		if len(quickLinks) > 0 {
			for i := range quickLinks {
				quickLinks[i].UniversityID = id
			}
			if err := tx.Create(&quickLinks).Error; err != nil {
				tx.Rollback()
				slog.Error("Error creating university quick links", slog.Any("error", err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
				return
			}
		}
	}

	if payload.AdditionalInformation != nil {
		additionalInfo, err := buildAdditionalInformation(*payload.AdditionalInformation)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := tx.Where("university_id = ?", id).Delete(&models.AdditionalInformation{}).Error; err != nil {
			tx.Rollback()
			slog.Error("Error clearing university additional information", slog.Any("error", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
			return
		}
		if len(additionalInfo) > 0 {
			for i := range additionalInfo {
				additionalInfo[i].UniversityID = id
			}
			if err := tx.Create(&additionalInfo).Error; err != nil {
				tx.Rollback()
				slog.Error("Error creating university additional information", slog.Any("error", err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		slog.Error("Error committing university update", slog.Any("error", err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update university"})
		return
	}

	var university models.University
	if err := db.Db.
		Preload("DegreePrograms").
		Preload("FocusTags").
		Preload("QuickLinks").
		Preload("AdditionalInformation").
		First(&university, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error loading updated university"})
		return
	}

	c.JSON(http.StatusOK, university)
}

func DeleteUniversity(c *gin.Context) {
	id := c.Param("id")
	tx := db.Db.Delete(&models.University{}, "id = ?", id)
	if tx.Error != nil {
		slog.Error("Error deleting university", slog.Any("error", tx.Error))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete university"})
		return
	}
	if tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "university not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func isAdminOrStaffForUniversities(c *gin.Context) bool {
	u, ok := c.Get("user")
	if !ok {
		return false
	}
	user, ok := u.(models.User)
	if !ok {
		return false
	}
	return user.Role == "admin" || user.Role == "staff"
}

func filterPublicPrograms(programs []models.DegreeProgram) []models.DegreeProgram {
	filtered := make([]models.DegreeProgram, 0, len(programs))
	for _, program := range programs {
		if program.ApprovalStatus == models.DegreeProgramApproved && program.PublicRequested {
			filtered = append(filtered, program)
		}
	}
	return filtered
}

func isValidInstitutionType(value models.InstitutionType) bool {
	switch value {
	case models.InstitutionPublic, models.InstitutionPrivate, models.InstitutionMixed:
		return true
	default:
		return false
	}
}

func normalizeTags(tags []string) []models.UniversityTag {
	normalized := make([]models.UniversityTag, 0, len(tags))
	seen := make(map[string]struct{}, len(tags))
	for _, tag := range tags {
		clean := strings.TrimSpace(tag)
		if clean == "" {
			continue
		}
		key := strings.ToLower(clean)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, models.UniversityTag{Tag: clean})
	}
	return normalized
}

func buildQuickLinks(items []models.QuickLinkDTO) ([]models.QuickLink, error) {
	if len(items) == 0 {
		return nil, nil
	}
	links := make([]models.QuickLink, 0, len(items))
	for _, item := range items {
		label := strings.TrimSpace(ptrValue(item.Label))
		url := strings.TrimSpace(ptrValue(item.URL))
		if label == "" || url == "" {
			return nil, errors.New("quick_links requires label and url")
		}
		id := strings.TrimSpace(ptrValue(item.ID))
		if id == "" {
			id = uuid.NewString()
		}
		links = append(links, models.QuickLink{
			ID:    id,
			Label: label,
			URL:   url,
		})
	}
	return links, nil
}

func buildAdditionalInformation(items []models.AdditionalInformationDTO) ([]models.AdditionalInformation, error) {
	if len(items) == 0 {
		return nil, nil
	}
	info := make([]models.AdditionalInformation, 0, len(items))
	for _, item := range items {
		title := strings.TrimSpace(ptrValue(item.Title))
		if title == "" {
			return nil, errors.New("additional_information requires title")
		}
		id := strings.TrimSpace(ptrValue(item.ID))
		if id == "" {
			id = uuid.NewString()
		}
		info = append(info, models.AdditionalInformation{
			ID:          id,
			Title:       title,
			Description: strings.TrimSpace(ptrValue(item.Description)),
			URL:         strings.TrimSpace(ptrValue(item.URL)),
			Status:      strings.TrimSpace(ptrValue(item.Status)),
		})
	}
	return info, nil
}

func ptrValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
