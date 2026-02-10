package db

import (
	"fmt"
	"net/url"
	"os"
	"strings"
)

// ResolveMySQLDSN returns a MySQL DSN from env vars with priority:
// MYSQL_DSN -> MYSQL_URL -> MYSQL_PUBLIC_URL.
func ResolveMySQLDSN() (string, error) {
	if dsn := strings.TrimSpace(os.Getenv("MYSQL_DSN")); dsn != "" {
		return dsn, nil
	}

	if raw := strings.TrimSpace(os.Getenv("MYSQL_URL")); raw != "" {
		dsn, err := mysqlURLToDSN(raw)
		if err != nil {
			return "", fmt.Errorf("invalid MYSQL_URL: %w", err)
		}
		return dsn, nil
	}

	if raw := strings.TrimSpace(os.Getenv("MYSQL_PUBLIC_URL")); raw != "" {
		dsn, err := mysqlURLToDSN(raw)
		if err != nil {
			return "", fmt.Errorf("invalid MYSQL_PUBLIC_URL: %w", err)
		}
		return dsn, nil
	}

	return "", fmt.Errorf("missing DB env var: set MYSQL_DSN, MYSQL_URL, or MYSQL_PUBLIC_URL")
}

func mysqlURLToDSN(raw string) (string, error) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return "", err
	}
	if parsed.Scheme != "mysql" {
		return "", fmt.Errorf("expected scheme mysql, got %q", parsed.Scheme)
	}
	if parsed.User == nil {
		return "", fmt.Errorf("missing user info")
	}

	username := parsed.User.Username()
	password, _ := parsed.User.Password()
	host := parsed.Host
	database := strings.TrimPrefix(parsed.Path, "/")

	if username == "" {
		return "", fmt.Errorf("missing username")
	}
	if host == "" {
		return "", fmt.Errorf("missing host")
	}
	if database == "" {
		return "", fmt.Errorf("missing database name")
	}

	query := parsed.Query()
	if query.Get("charset") == "" {
		query.Set("charset", "utf8mb4")
	}
	if query.Get("parseTime") == "" {
		query.Set("parseTime", "true")
	}
	// Managed MySQL deployments can fail on unsupported timezone names.
	query.Del("time_zone")
	query.Del("timezone")

	return fmt.Sprintf("%s:%s@tcp(%s)/%s?%s", username, password, host, database, query.Encode()), nil
}
