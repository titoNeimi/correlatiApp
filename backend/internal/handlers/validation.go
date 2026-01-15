package handlers

import (
	"errors"
	"strings"
)

const (
	maxIDLen           = 191
	maxNameLen         = 191
	maxDescriptionLen  = 500
	maxSubjectsPayload = 500
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
