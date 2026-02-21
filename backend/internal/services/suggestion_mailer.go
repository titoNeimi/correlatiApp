package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
	"strings"
)

type SuggestionMailer interface {
	SendSuggestion(name, fromEmail, suggType, description, toEmail string) error
}

var suggestionTypeLabels = map[string]string{
	"career":     "Sugerir carrera",
	"university": "Sugerir universidad",
	"feature":    "Pedir feature",
	"bug":        "Reportar bug",
}

var suggestionTypeColors = map[string]string{
	"career":     "#0ea5e9",
	"university": "#f59e0b",
	"feature":    "#f43f5e",
	"bug":        "#64748b",
}

func buildSuggestionHTML(name, fromEmail, typeLabel, typeColor, description string) string {
	senderLine := html.EscapeString(name)
	if fromEmail != "" {
		senderLine += fmt.Sprintf(" &lt;%s&gt;", html.EscapeString(fromEmail))
	}
	escapedDesc := strings.ReplaceAll(html.EscapeString(description), "\n", "<br>")

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva sugerencia</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;">AcadifyApp</p>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:#ffffff;">Nueva sugerencia recibida</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">

              <!-- Badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:%s;border-radius:999px;padding:6px 16px;">
                    <p style="margin:0;font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.06em;text-transform:uppercase;">%s</p>
                  </td>
                </tr>
              </table>

              <!-- Sender -->
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;">Enviado por</p>
                    <p style="margin:0;font-size:15px;color:#0f172a;">%s</p>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;">Descripcion</p>
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid %s;border-radius:0 12px 12px 0;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;">%s</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Este mensaje fue generado automaticamente por AcadifyApp.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, typeColor, typeLabel, senderLine, typeColor, escapedDesc)
}

func (m *BrevoAPIMailer) SendSuggestion(name, fromEmail, suggType, description, toEmail string) error {
	if strings.TrimSpace(toEmail) == "" {
		return errors.New("empty recipient")
	}
	if strings.TrimSpace(description) == "" {
		return errors.New("empty description")
	}

	typeLabel := suggestionTypeLabels[suggType]
	if typeLabel == "" {
		typeLabel = suggType
	}
	typeColor := suggestionTypeColors[suggType]
	if typeColor == "" {
		typeColor = "#64748b"
	}

	senderLine := name
	if fromEmail != "" {
		senderLine = fmt.Sprintf("%s <%s>", name, fromEmail)
	}

	textContent := fmt.Sprintf(
		"Nueva sugerencia recibida en AcadifyApp\n\nTipo: %s\nDe: %s\n\nDescripcion:\n%s\n",
		typeLabel, senderLine, description,
	)

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
		HtmlContent string `json:"htmlContent"`
	}{}
	payload.Sender.Name = m.fromName
	payload.Sender.Email = m.fromEmail
	payload.To = []struct {
		Email string `json:"email"`
	}{{Email: toEmail}}
	payload.Subject = fmt.Sprintf("[Sugerencia] %s - AcadifyApp", typeLabel)
	payload.TextContent = textContent
	payload.HtmlContent = buildSuggestionHTML(name, fromEmail, typeLabel, typeColor, description)

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
		return fmt.Errorf("brevo api request failed: %w", err)
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
