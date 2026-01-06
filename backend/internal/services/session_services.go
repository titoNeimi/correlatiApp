package services

import (
	"correlatiApp/internal/models"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Service struct {
	DB        *gorm.DB
	SessionTT time.Duration
}

func New(db *gorm.DB, ttl time.Duration) *Service {
	if ttl <= 0 {
		ttl = 7 * 24 * time.Hour
	}
	return &Service{DB: db, SessionTT: ttl}
}

func GenerateSessionID() string { return uuid.NewString() }

func (s *Service) Create(userID string) (*models.Session, error) {
	id := GenerateSessionID()
	expires := time.Now().UTC().Add(s.SessionTT)
	sess := &models.Session{
		ID:        id,
		UserID:    userID,
		ExpiresAt: expires,
	}
	if err := s.DB.Create(sess).Error; err != nil {
		return nil, err
	}
	return sess, nil
}

func (s *Service) FindActive(id string) (*models.Session, error) {
	if id == "" {
		return nil, errors.New("empty session id")
	}
	var sess models.Session
	err := s.DB.
		Where("id = ? AND revoked = FALSE AND expires_at > ?", id, time.Now().UTC()).
		First(&sess).Error
	if err != nil {
		return nil, err
	}
	return &sess, nil
}

func (s *Service) Revoke(id string) error {
	if id == "" {
		return errors.New("empty session id")
	}
	return s.DB.
		Model(&models.Session{}).
		Where("id = ? AND revoked = FALSE", id).
		Update("revoked", true).Error
}

func (s *Service) DeleteExpired() (int64, error) {
	tx := s.DB.
		Where("expires_at <= ?", time.Now().UTC()).
		Delete(&models.Session{})
	return tx.RowsAffected, tx.Error
}

func (s *Service) DeleteSessionByUserId(userID string) (int64, *models.User, error) {
	if userID == "" {
		return 0, nil, errors.New("empty user id")
	}

	var user models.User
	if err := s.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		return 0, nil, err
	}

	tx := s.DB.Where("user_id = ?", user.ID).Delete(&models.Session{})
	return tx.RowsAffected, &user, tx.Error
}
