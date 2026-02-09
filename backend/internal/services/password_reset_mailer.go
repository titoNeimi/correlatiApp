package services

import (
	"errors"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"strconv"
	"strings"
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

type BrevoSMTPMailer struct {
	host      string
	port      int
	username  string
	password  string
	fromEmail string
	fromName  string
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

	return smtp.SendMail(addr, auth, m.fromEmail, []string{toEmail}, []byte(message.String()))
}
