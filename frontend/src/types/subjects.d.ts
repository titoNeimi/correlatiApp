type SubjectStatus = 'not_available' | 'available' | 'in_progress' | 'final_pending' | 'passed' | 'passed_with_distinction'
type RequirementMinStatus = 'passed' | 'final_pending'
type SubjectTerm = 'annual' | 'semester' | 'quarterly' | 'bimonthly'

type SubjectRequirementDTO = {
  id: string
  name?: string
  minStatus?: RequirementMinStatus
}

type SubjectDTO = {
  id: string
  name: string
  year?: number | null
  subjectYear: number
  term?: SubjectTerm
  degreeProgramID: string
  is_elective?: boolean
  status: SubjectStatus
  final_calification?: number
  requirements: Array<string | SubjectRequirementDTO>
}

type SubjectsFromProgram = {
  id: string
  name: string
  university: string
  universityID?: string
  subjects: SubjectDTO[]
}

export type {
  SubjectDTO,
  SubjectRequirementDTO,
  SubjectsFromProgram,
  SubjectStatus,
  RequirementMinStatus,
  SubjectTerm,
}
