package handlers

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	maxIDLen           = 191
	maxNameLen         = 191
	maxDescriptionLen  = 500
	maxSubjectsPayload = 500
	defaultPage        = 1
	defaultLimit       = 20
	maxLimit           = 100
)

func validateID(value string, field string) (string, error) {
	id := strings.TrimSpace(value)
	if id == "" {
		return "", errors.New(field + " es requerido")
	}
	if len(id) > maxIDLen {
		return "", errors.New(field + " es demasiado largo")
	}
	return id, nil
}

func validateRequiredString(value string, field string, maxLen int) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", errors.New(field + " es requerido")
	}
	if len(trimmed) > maxLen {
		return "", errors.New(field + " es demasiado largo")
	}
	return trimmed, nil
}

func validateOptionalString(value *string, field string, maxLen int) (*string, error) {
	if value == nil {
		return nil, nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, errors.New(field + " no puede ser vacío")
	}
	if len(trimmed) > maxLen {
		return nil, errors.New(field + " es demasiado largo")
	}
	return &trimmed, nil
}

func parsePagination(c *gin.Context) (page int, limit int, offset int) {
	page = defaultPage
	limit = defaultLimit

	if raw := strings.TrimSpace(c.Query("page")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			page = parsed
		}
	}
	if raw := strings.TrimSpace(c.Query("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			switch {
			case parsed <= 0:
				limit = defaultLimit
			case parsed > maxLimit:
				limit = maxLimit
			default:
				limit = parsed
			}
		}
	}
	offset = (page - 1) * limit
	return page, limit, offset
}
