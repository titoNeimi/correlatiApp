package services

import (
	"acadifyapp/internal/db"
	"acadifyapp/internal/models"
	"acadifyapp/internal/utils"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log/slog"
	"strings"
)

var (
	ErrEmailExists           = errors.New("email already in use")
	ErrUserNotFound          = errors.New("user not found")
	ErrInvalidDegreePrograms = errors.New("invalid degree program IDs")
)

func GetUserByEmail(email string) models.User {
	email = strings.TrimSpace(strings.ToLower(email))
	var user *models.User
	result := db.Db.Where("email = ?", email).Preload("DegreePrograms").First(&user)
	if result.Error != nil {
		slog.Info("Error finding user by email in db", slog.Any("Error: ", result.Error))
		return models.User{}
	}
	return *user
}

func CreateUserWithValidation(user *models.User) (*models.User, error) {
	if user == nil {
		return nil, errors.New("user is nil")
	}

	var existing int64
	if err := db.Db.Model(&models.User{}).Where("email = ?", user.Email).Count(&existing).Error; err != nil {
		slog.Info("Error checking user email", slog.Any("error", err))
		return nil, err
	}
	if existing > 0 {
		return nil, ErrEmailExists
	}

	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		slog.Info("Error hashing password", slog.Any("error", err))
		return nil, err
	}
	user.Password = hashedPassword

	user.ID = uuid.New().String()
	if err := db.Db.Create(user).Error; err != nil {
		slog.Info("Error creating user in db", slog.Any("error", err))
		return nil, err
	}

	return user, nil
}

func GetUserByID(id string) (*models.User, error) {
	var user models.User
	if err := db.Db.Where("id = ?", id).Preload("DegreePrograms").First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func GetAllUsers() ([]models.User, error) {
	var users []models.User
	if err := db.Db.Model(&users).Preload("DegreePrograms").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func UpdateUser(id string, dto models.UserUpdateDTO) (*models.User, error) {
	var updatedUser models.User
	if err := db.Db.Where("id = ?", id).First(&updatedUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	if dto.Password != nil && *dto.Password != "" {
		hashedPassword, err := utils.HashPassword(*dto.Password)
		if err != nil {
			slog.Info("Error hashing password", slog.Any("error", err))
			return nil, err
		}
		dto.Password = &hashedPassword
	}

	if err := db.Db.Model(&updatedUser).Updates(dto).Error; err != nil {
		return nil, err
	}

	if dto.DegreeProgramsID != nil {
		if len(*dto.DegreeProgramsID) == 0 {
			if err := db.Db.Model(&updatedUser).Association("DegreePrograms").Clear(); err != nil {
				return nil, err
			}
		} else {
			var reqs []models.DegreeProgram
			if err := db.Db.Where("id IN ?", *dto.DegreeProgramsID).Find(&reqs).Error; err != nil {
				return nil, err
			}
			if len(reqs) != len(*dto.DegreeProgramsID) {
				return nil, ErrInvalidDegreePrograms
			}
			if err := db.Db.Model(&updatedUser).Association("DegreePrograms").Replace(reqs); err != nil {
				return nil, err
			}
		}
	}

	if err := db.Db.Where("id = ?", id).Preload("DegreePrograms").First(&updatedUser).Error; err != nil {
		return nil, err
	}

	return &updatedUser, nil
}

func DeleteUser(id string) (*models.User, error) {
	var user models.User
	if err := db.Db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	if err := db.Db.Delete(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
