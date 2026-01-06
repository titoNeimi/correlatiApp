package utils

import (
	"correlatiApp/internal/models"
	"log/slog"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func CreateToken (user models.User) (string, error) {
	secretKey := os.Getenv("JWT_KEY")
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": user.Email,
		"id": user.ID,
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(),
		"iss": "correlatiApp-backend",
		"aud": "correlatiApp-frontend",
		"iat": time.Now().Unix(),
		"nbf": time.Now().Unix(),
	})
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		slog.Error("Error creando el token", slog.Any("Error: ", err))
		return "", err
	}
	slog.Info(tokenString)
	return tokenString, nil
}

func VerifyToken (tokenString string) error {
	secretKey := os.Getenv("JWT_KEY")
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(secretKey), nil
	})

	if err != nil {
    return err
  }
  
  if !token.Valid {
		slog.Info("invalid token")
		return jwt.ErrTokenInvalidId
  }
  
  return nil

}