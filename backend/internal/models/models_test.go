package models

import (
	"reflect"
	"strings"
	"testing"
)

// getStructFieldTag devuelve el tag de un campo usando reflect.
// Usamos reflect para leer los tags sin tocar la base de datos.
func getStructFieldTag(t *testing.T, model any, fieldName string) reflect.StructTag {
	t.Helper()

	typ := reflect.TypeOf(model)
	if typ.Kind() == reflect.Pointer {
		typ = typ.Elem()
	}

	field, ok := typ.FieldByName(fieldName)
	if !ok {
		t.Fatalf("missing field %s", fieldName)
	}

	return field.Tag
}

// requireTagContains verifica que un tag tenga una parte concreta.
// Por ejemplo: "gorm" debe contener "primaryKey" o "size:191".
func requireTagContains(t *testing.T, tag reflect.StructTag, key, want string) {
	t.Helper()

	value := tag.Get(key)
	if !strings.Contains(value, want) {
		t.Fatalf("tag %q = %q, want to contain %q", key, value, want)
	}
}

func TestSubjectStatusValuesExample(t *testing.T) {
	t.Parallel()

	// Ejemplo simple: comparar constantes con el string esperado.
	if string(StatusAvailable) != "available" {
		t.Fatalf("StatusAvailable = %q, want %q", StatusAvailable, "available")
	}
}

func TestUserIDTags(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO: leer el tag gorm de User.ID y verificar que:
	// - contiene "primaryKey"
	// - contiene "size:191"
	// Pista: tag := getStructFieldTag(t, User{}, "ID")
	// Luego requireTagContains(t, tag, "gorm", "primaryKey")
}

func TestUserEmailTags(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO: leer el tag gorm de User.Email y verificar que:
	// - contiene "unique"
	// - contiene "not null"
	// - contiene "size:191"
}

func TestSubjectYearColumnTag(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO: verificar que el tag gorm de Subject.Year contiene "column:subject_year".
	// Esto asegura que la columna en DB se llama subject_year.
}

func TestUserDegreeProgramsManyToManyTag(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO: verificar que el tag gorm de User.DegreePrograms contiene
	// "many2many:user_degree_programs".
}

func TestTableNameOverrides(t *testing.T) {
	t.Parallel()
	t.Skip("TODO: implementar")

	// TODO: verificar que TableName() devuelve:
	// - "user_subjects" para UserSubject{}
	// - "subject_requirements" para SubjectRequirement{}
	// - "elective_pool_subjects" para ElectivePoolSubject{}
	// Pista: compara strings directamente sin GORM.
}
