
type degreeProgram = {
  id: string,
  name: string,
  university: university,
  subjects?: [subjects],
  users?: [users],
  created_at: string,
  updated_at: string
}

//!Aclaro que no hay ningun tipo que este chequeado al 100%

type subjects = {
  id: string,
  name: string,
  subjectYear: int,
  requirements: [subjects],
  status: [users],
  degreeProgramID: string,
  created_at: string,
  updated_at: string
}