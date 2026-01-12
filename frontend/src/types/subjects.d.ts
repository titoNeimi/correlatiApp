type SubjectStatus = 'not_available'  | 'available' | 'in_progress' | 'final_pending' | 'passed' | 'passed_with_distinction'

type SubjectDTO = {
  id: string
  name: string
  subjectYear: number
  degreeProgramID: string
  is_elective?: boolean
  status: SubjectStatus
  requirements: string[]
}

type SubjectsFromProgram = {
  id: string
  name: string
  university: string
  subjects: SubjectDTO[]
}



export type { SubjectDTO, SubjectsFromProgram, SubjectStatus }
