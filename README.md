# AcadifyApp

Plataforma para gestionar universidades, carreras y planes de estudio, con seguimiento del progreso academico de los usuarios. Incluye un panel administrativo para aprobar/publicar programas y una experiencia publica para explorar universidades y carreras.

## Funcionalidades

- Catalogo de universidades con etiquetas, accesos rapidos e informacion adicional.
- Gestion de carreras, materias, correlativas y electivas (pools y reglas).
- Seguimiento de estado de materias por usuario (aprobada, en curso, etc.).
- Roles (admin, staff, user) y sesiones basadas en cookies.
- Panel admin para aprobar/publicar programas y administrar usuarios.
- Inscripcion a carreras, favoritos y seguimiento de plan por usuario.
- Autenticacion con sesiones persistentes y endpoints de salud.

## Stack

- **Backend**: Go (Gin), GORM, MySQL.
- **Frontend**: Next.js (React), TypeScript, Tailwind CSS.

## Requisitos

- Go 1.24+
- Node.js 20+
- MySQL 8+ (o MariaDB compatible)

## Estructura del repositorio

- `backend/`: API y logica de negocio.
- `frontend/`: aplicacion web.

## Configuracion

### Backend

Crear `backend/.env`:

```bash
MYSQL_DSN="user:password@tcp(127.0.0.1:3306)/correlati?charset=utf8mb4&parseTime=True&loc=Local"
GIN_MODE="release"
BREVO_SMTP_HOST="smtp-relay.brevo.com"
BREVO_SMTP_PORT="587"
BREVO_SMTP_USER="tu_usuario_brevo"
BREVO_SMTP_PASS="tu_smtp_key_brevo"
MAIL_FROM_EMAIL="no-reply@tudominio.com"
MAIL_FROM_NAME="AcadifyApp"
PASSWORD_RESET_URL_BASE="http://localhost:3000/reset-password"
PASSWORD_RESET_TOKEN_TTL="30m"
```

Notas:
- `MYSQL_DSN` es obligatorio.
- `GIN_MODE=release` desactiva el modo debug.
- `PASSWORD_RESET_TOKEN_TTL` usa formato Go duration (`15m`, `30m`, `1h`).
- Si falta config SMTP de Brevo, el endpoint de forgot password queda deshabilitado.

### Recuperar contrasena por email (Brevo)

Endpoints backend:

- `POST /auth/password/forgot` con body `{"email":"user@example.com"}`
- `POST /auth/password/reset` con body `{"token":"...","newPassword":"nuevaClaveSegura"}`

### Frontend

Crear `frontend/.env.local`:

```bash
NEXT_PUBLIC_APIURL="http://localhost:8080"
```

## Ejecutar en desarrollo

1) Iniciar MySQL y crear la base de datos.
2) Backend:

```bash
cd backend
go run ./cmd/main.go
```

3) (Opcional) Cargar datos de ejemplo:

```bash
cd backend
go run ./cmd/seed/seed.go
```

4) Frontend:

```bash
cd frontend
npm install
npm run dev
```

La app quedara en `http://localhost:3000` y la API en `http://localhost:8080`.

## Credenciales de ejemplo (seed)

Si ejecutas el seed, se crean usuarios de prueba:

- Admin: `admin@example.com` / `dolores`
- Staff: `staff@example.com` / `dolores`
- User: `alumno@example.com` / `dolores`

## Scripts utiles

- Backend: `go test ./...`
- Frontend: `npm run lint`
