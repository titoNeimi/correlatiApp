package httpx

import (
	"net/http"
	"time"
)

type CookieCfg struct {
	Name     string
	Domain   string
	Path     string
	Secure   bool
	SameSite http.SameSite
}

func SetSessionCookie(w http.ResponseWriter, cfg CookieCfg, value string, expires time.Time) {
	c := &http.Cookie{
		Name:     cfg.Name,
		Value:    value,
		Path:     cfg.Path,
		Domain:   cfg.Domain,
		Expires:  expires,
		HttpOnly: true,
		Secure:   cfg.Secure,
		SameSite: cfg.SameSite,
	}
	http.SetCookie(w, c)
}

func ClearSessionCookie(w http.ResponseWriter, cfg CookieCfg) {
	c := &http.Cookie{
		Name:     cfg.Name,
		Value:    "",
		Path:     cfg.Path,
		Domain:   cfg.Domain,
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   cfg.Secure,
		SameSite: cfg.SameSite,
	}
	http.SetCookie(w, c)
}

