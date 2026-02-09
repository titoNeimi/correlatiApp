package handlers

import (
	"acadifyapp/internal/models"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

type stubPasswordResetMailer struct{}

func (stubPasswordResetMailer) SendPasswordReset(toEmail, resetURL string) error {
	return nil
}

// performRequest arma un router mínimo con un handler y devuelve la respuesta.
// Esto permite testear validaciones básicas sin levantar todo el servidor.
func performRequest(t *testing.T, method, route, path string, body []byte, handler gin.HandlerFunc) *httptest.ResponseRecorder {
	t.Helper()

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Handle(method, route, handler)

	req := httptest.NewRequest(method, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	return w
}

func TestCreateUser_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPost, "/users", "/users", []byte("{"), CreateUser)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestUpdateUser_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPut, "/users/:id", "/users/123", []byte("{"), UpdateUser)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestCreateProgram_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPost, "/degreeProgram", "/degreeProgram", []byte("{"), CreateProgram)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestUpdateProgram_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPut, "/degreeProgram/:id", "/degreeProgram/123", []byte("{"), UpdateProgram)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestCreateUniversity_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPost, "/universities", "/universities", []byte("{"), CreateUniversity)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestUpdateUniversity_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPut, "/universities/:id", "/universities/123", []byte("{"), UpdateUniversity)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestCreateSubject_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPost, "/subjects", "/subjects", []byte("{"), CreateSubject)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestUpdateSubject_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPut, "/subjects/:id", "/subjects/123", []byte("{"), UpdateSubject)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestAuthLogin_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	h := &AuthHandlers{}
	w := performRequest(t, http.MethodPost, "/auth/login", "/auth/login", []byte("{"), h.LoginHandler)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestAuthRegister_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	h := &AuthHandlers{}
	w := performRequest(t, http.MethodPost, "/auth/register", "/auth/register", []byte("{"), h.Register)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestAuthForgotPassword_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	h := &AuthHandlers{Mailer: stubPasswordResetMailer{}}
	w := performRequest(t, http.MethodPost, "/auth/password/forgot", "/auth/password/forgot", []byte("{"), h.ForgotPassword)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestAuthForgotPassword_NoMailer_Returns503(t *testing.T) {
	t.Parallel()

	h := &AuthHandlers{}
	w := performRequest(t, http.MethodPost, "/auth/password/forgot", "/auth/password/forgot", []byte(`{"email":"user@example.com"}`), h.ForgotPassword)
	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusServiceUnavailable)
	}
}

func TestAuthResetPassword_InvalidJSON_Returns400(t *testing.T) {
	t.Parallel()

	h := &AuthHandlers{}
	w := performRequest(t, http.MethodPost, "/auth/password/reset", "/auth/password/reset", []byte("{"), h.ResetPassword)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- TODOs: tests funcionales (de simple a complejo) ---

func TestCreateUniversity_EmptyName_Returns400(t *testing.T) {
	t.Parallel()

	u := models.University{
		Name:     "   ",
		Location: "Islandia",
		Website:  "Pepe",
	}
	body, err := json.Marshal(u)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	w := performRequest(t, http.MethodPost, "/universities", "/universities", body, CreateUniversity)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
	if !strings.Contains(w.Body.String(), "name is required") {
		t.Fatalf("body = %q, want to contain %q", w.Body.String(), "name is required")
	}
}

func TestUpdateUniversity_NoFields_Returns400(t *testing.T) {
	t.Parallel()

	w := performRequest(t, http.MethodPut, "/universities/:id", "/universities/123", []byte("{}"), UpdateUniversity)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status %d, want %d", w.Code, http.StatusBadRequest)
	}

	if !strings.Contains(w.Body.String(), "no fields to update") {
		t.Fatalf("body = %q, want to contain %q", w.Body.String(), "no fields to update")
	}
}

func TestCreateProgram_MissingUniversityID_Returns400(t *testing.T) {
	t.Parallel()

	program := models.DegreeProgram{
		Name: "Test Program",
	}
	body, err := json.Marshal(program)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	w := performRequest(t, http.MethodPost, "/degreeProgram", "/degreeProgram", body, CreateProgram)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status %d, want %d", w.Code, http.StatusBadRequest)
	}

	if !strings.Contains(w.Body.String(), "UniversityID is required") {
		t.Fatalf("body = %q, want to contain %q", w.Body.String(), "UniversityID is required")
	}
}

func TestCreateSubject_MissingDegreeProgramID_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO:
	// - Enviar JSON con name pero degreeProgramID = "".
	// - Esperar 400 "degreeProgramID is required".
	// - Pista: si el binding required falla, tambien es OK que devuelva 400.
}

func TestCreateSubject_InvalidRequirementIDs_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Crear degree program y una subject valida.
	// - Intentar crear otra subject con requirements que no existen.
	// - Esperar 400 "Some requirement IDs are invalid".
}

func TestUpdateSubject_ClearRequirements(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Crear subject con requirements.
	// - Update con requirements: [] (array vacio).
	// - Esperar que se borren las correlativas (subject_requirements).
}

func TestUpdateSubject_InvalidDegreeProgramID_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO:
	// - Enviar payload con degreeProgramID = "".
	// - Esperar 400 "degreeProgramID cannot be empty".
}

func TestGetAllSubjectsFromProgram_BuildsMinStatus(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Crear program + subjects + requirements con min_status distinto.
	// - Llamar GET /subjects/:programId.
	// - Verificar que cada requirement incluya minStatus correcto.
}

func TestGetUser_NotFound_Returns404(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB o mock de services):
	// - Llamar GET /users/:id con id inexistente.
	// - Esperar 404 "User not found".
}

func TestCreateUser_DuplicateEmail_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Crear usuario con email X.
	// - Intentar crear otro con mismo email.
	// - Esperar 400 "Email already in use".
}

func TestUpdateUser_InvalidDegreePrograms_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Actualizar usuario enviando DegreeProgramsID con IDs inexistentes.
	// - Esperar 400 "Some DegreeProgram IDs are invalid".
}

func TestDeleteUser_NotFound_Returns404(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Eliminar usuario inexistente.
	// - Esperar 404 "User not found".
}

func TestAuthRegister_CreatesSessionCookie(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y services):
	// - Registrar usuario valido.
	// - Verificar StatusCreated y que la respuesta incluya cookie de sesion.
}

func TestAuthLogin_WrongPassword_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Crear usuario con password hasheado.
	// - Login con password incorrecto.
	// - Esperar 400 "Datos incorrectos".
}

func TestGetMyPrograms_ReturnsEnrolledAndFavorites(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y usuario en contexto):
	// - Crear usuario y programas, vincular enroll/favorite.
	// - Inyectar "user" en el contexto gin.
	// - Esperar arrays con IDs correctos.
}

func TestEnrollProgram_AlreadyEnrolled_Returns409(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y usuario en contexto):
	// - Usuario ya tiene el programa.
	// - Esperar 409 "Already enrolled".
}

func TestUnenrollProgram_NotEnrolled_Returns409(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y usuario en contexto):
	// - Usuario NO tiene el programa.
	// - Esperar 409 "Not enrolled".
}

func TestFavoriteProgram_AlreadyFavorited_Returns409(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y usuario en contexto):
	// - Usuario ya tiene el programa en favoritos.
	// - Esperar 409 "Already favorited".
}

func TestUnfavoriteProgram_NotFavorited_Returns409(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y usuario en contexto):
	// - Usuario NO tiene el programa en favoritos.
	// - Esperar 409 "Not favorited".
}

func TestCreateElectivePool_NameRequired_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Crear degree program.
	// - Enviar JSON con name vacio.
	// - Esperar 400 "name es requerido".
}

func TestAddSubjectToElectivePool_SubjectFromOtherProgram_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Crear pool de un program A.
	// - Crear subject de program B.
	// - Intentar agregar subject al pool.
	// - Esperar 400 "Subject no pertenece al degreeProgram".
}

func TestAddSubjectToElectivePool_Duplicate_Returns409(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Agregar subject al pool una vez.
	// - Reintentar con el mismo subject.
	// - Esperar 409 "Subject ya está en el pool".
}

func TestRemoveSubjectFromElectivePool_NotFound_Returns404(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Intentar quitar subject que no está en el pool.
	// - Esperar 404 "Subject no está en el pool".
}

func TestCreateElectiveRule_InvalidRequirementType_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Enviar requirement_type invalido.
	// - Esperar 400 "requirement_type inválido".
}

func TestCreateElectiveRule_MinimumValueMustBePositive(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Enviar minimum_value <= 0.
	// - Esperar 400 "minimum_value debe ser mayor que 0".
}

func TestUpdateElectiveRule_AppliesToLessThanFrom_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Actualizar con applies_from_year mayor que applies_to_year.
	// - Esperar 400 "applies_to_year no puede ser menor que applies_from_year".
}

func TestGetMySubjectsFromProgram_NotRegistered_Returns403(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y user en contexto):
	// - Usuario sin el programa en DegreePrograms.
	// - Esperar 403 "You are not registered in this program".
}

func TestSaveMySubjectsFromProgram_InvalidStatus_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y user en contexto):
	// - Enviar subject status invalido.
	// - Esperar 400 "Invalid subject status".
}

func TestSaveMySubjectsFromProgram_SubjectNotInProgram_Returns400(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB y user en contexto):
	// - Enviar subject de otro program.
	// - Esperar 400 "Subject not in program".
}

func TestRevokeSession_UserNotFound_Returns404(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO (requiere DB):
	// - Llamar revoke con userId inexistente.
	// - Esperar 404 "User not found".
}
