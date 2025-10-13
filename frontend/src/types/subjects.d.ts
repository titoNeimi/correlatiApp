type SubjectStatus = 'not_available'  | 'available' | 'in_progress' | 'final_pending' | 'passed' | 'passed_with_distinction'

type SubjectDTO = {
  id: string
  name: string
  subjectYear: number
  degreeProgramID: string
  status: SubjectStatus
  requirements: string[]
}

type SubjectsFromProgram = {
  Id: string
  Name: string
  University: string
  Subjects: SubjectDTO[]
}

export type { SubjectDTO, SubjectsFromProgram, SubjectStatus }