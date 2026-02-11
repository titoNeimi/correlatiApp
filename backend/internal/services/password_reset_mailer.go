package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"time"
)

type PasswordResetMailer interface {
	SendPasswordReset(toEmail, resetURL string) error
}

type BrevoSMTPConfig struct {
	Host      string
	Port      int
	Username  string
	Password  string
	FromEmail string
	FromName  string
}

type BrevoAPIConfig struct {
	APIKey    string
	APIURL    string
	FromEmail string
	FromName  string
	Timeout   time.Duration
}

type BrevoSMTPMailer struct {
	host      string
	port      int
	username  string
	password  string
	fromEmail string
	fromName  string
}

type BrevoAPIMailer struct {
	apiURL    string
	apiKey    string
	fromEmail string
	fromName  string
	client    *http.Client
}

func BrevoSMTPConfigFromEnv() BrevoSMTPConfig {
	port := 587
	if rawPort := strings.TrimSpace(os.Getenv("BREVO_SMTP_PORT")); rawPort != "" {
		if parsed, err := strconv.Atoi(rawPort); err == nil && parsed > 0 {
			port = parsed
		}
	}

	return BrevoSMTPConfig{
		Host:      strings.TrimSpace(os.Getenv("BREVO_SMTP_HOST")),
		Port:      port,
		Username:  strings.TrimSpace(os.Getenv("BREVO_SMTP_USER")),
		Password:  strings.TrimSpace(os.Getenv("BREVO_SMTP_PASS")),
		FromEmail: strings.TrimSpace(os.Getenv("MAIL_FROM_EMAIL")),
		FromName:  strings.TrimSpace(os.Getenv("MAIL_FROM_NAME")),
	}
}

func BrevoAPIConfigFromEnv() BrevoAPIConfig {
	timeout := 10 * time.Second
	if rawTimeout := strings.TrimSpace(os.Getenv("BREVO_API_TIMEOUT")); rawTimeout != "" {
		if parsed, err := time.ParseDuration(rawTimeout); err == nil && parsed > 0 {
			timeout = parsed
		}
	}

	return BrevoAPIConfig{
		APIKey:    strings.TrimSpace(os.Getenv("BREVO_API_KEY")),
		APIURL:    strings.TrimSpace(os.Getenv("BREVO_API_URL")),
		FromEmail: strings.TrimSpace(os.Getenv("MAIL_FROM_EMAIL")),
		FromName:  strings.TrimSpace(os.Getenv("MAIL_FROM_NAME")),
		Timeout:   timeout,
	}
}

func NewBrevoSMTPMailer(cfg BrevoSMTPConfig) (*BrevoSMTPMailer, error) {
	if cfg.Host == "" {
		cfg.Host = "smtp-relay.brevo.com"
	}
	if cfg.Port <= 0 {
		cfg.Port = 587
	}
	if cfg.Username == "" || cfg.Password == "" || cfg.FromEmail == "" {
		return nil, errors.New("missing brevo smtp config")
	}

	return &BrevoSMTPMailer{
		host:      cfg.Host,
		port:      cfg.Port,
		username:  cfg.Username,
		password:  cfg.Password,
		fromEmail: cfg.FromEmail,
		fromName:  cfg.FromName,
	}, nil
}

func NewBrevoAPIMailer(cfg BrevoAPIConfig) (*BrevoAPIMailer, error) {
	if cfg.APIURL == "" {
		cfg.APIURL = "https://api.brevo.com/v3/smtp/email"
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 10 * time.Second
	}
	if cfg.APIKey == "" || cfg.FromEmail == "" {
		return nil, errors.New("missing brevo api config")
	}

	return &BrevoAPIMailer{
		apiURL:    cfg.APIURL,
		apiKey:    cfg.APIKey,
		fromEmail: cfg.FromEmail,
		fromName:  cfg.FromName,
		client:    &http.Client{Timeout: cfg.Timeout},
	}, nil
}

func (m *BrevoSMTPMailer) SendPasswordReset(toEmail, resetURL string) error {
	if strings.TrimSpace(toEmail) == "" {
		return errors.New("empty recipient")
	}
	if strings.TrimSpace(resetURL) == "" {
		return errors.New("empty reset URL")
	}

	fromHeader := m.fromEmail
	if m.fromName != "" {
		fromHeader = fmt.Sprintf("%s <%s>", m.fromName, m.fromEmail)
	}

	subject := "Recuperar contrasena - AcadifyApp"
	body := fmt.Sprintf(
		"Recibimos una solicitud para restablecer tu contrasena.\r\n\r\n"+
			"Hace click en este enlace para continuar:\r\n%s\r\n\r\n"+
			"Si no hiciste esta solicitud, ignora este correo.\r\n",
		resetURL,
	)

	message := strings.Builder{}
	message.WriteString("From: " + fromHeader + "\r\n")
	message.WriteString("To: " + toEmail + "\r\n")
	message.WriteString("Subject: " + subject + "\r\n")
	message.WriteString("MIME-Version: 1.0\r\n")
	message.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	message.WriteString("\r\n")
	message.WriteString(body)

	addr := net.JoinHostPort(m.host, strconv.Itoa(m.port))
	auth := smtp.PlainAuth("", m.username, m.password, m.host)

	if err := smtp.SendMail(addr, auth, m.fromEmail, []string{toEmail}, []byte(message.String())); err != nil {
		return fmt.Errorf("smtp send failed via %s: %w", addr, err)
	}
	return nil
}

func (m *BrevoAPIMailer) SendPasswordReset(toEmail, resetURL string) error {
	if strings.TrimSpace(toEmail) == "" {
		return errors.New("empty recipient")
	}
	if strings.TrimSpace(resetURL) == "" {
		return errors.New("empty reset URL")
	}

	payload := struct {
		Sender struct {
			Name  string `json:"name,omitempty"`
			Email string `json:"email"`
		} `json:"sender"`
		To []struct {
			Email string `json:"email"`
		} `json:"to"`
		Subject     string `json:"subject"`
		TextContent string `json:"textContent"`
	}{}
	payload.Sender.Name = m.fromName
	payload.Sender.Email = m.fromEmail
	payload.To = []struct {
		Email string `json:"email"`
	}{{Email: toEmail}}
	payload.Subject = "Recuperar contrasena - AcadifyApp"
	payload.TextContent = fmt.Sprintf(
		"Recibimos una solicitud para restablecer tu contrasena.\n\n"+
			"Hace click en este enlace para continuar:\n%s\n\n"+
			"Si no hiciste esta solicitud, ignora este correo.\n",
		resetURL,
	)

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, m.apiURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("accept", "application/json")
	req.Header.Set("content-type", "application/json")
	req.Header.Set("api-key", m.apiKey)

	res, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("brevo api request failed to %s: %w", m.apiURL, err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 200 && res.StatusCode < 300 {
		return nil
	}

	rawBody, _ := io.ReadAll(io.LimitReader(res.Body, 2048))
	if len(rawBody) == 0 {
		return fmt.Errorf("brevo api returned status %d", res.StatusCode)
	}
	return fmt.Errorf("brevo api returned status %d: %s", res.StatusCode, strings.TrimSpace(string(rawBody)))
}
