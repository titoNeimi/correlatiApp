export type ElectivePoolSubject = {
  id: string
  name: string
  year?: number | null
  term?: 'annual' | 'semester' | 'quarterly' | 'bimonthly'
  credits?: number | null
  hours?: number | null
  is_elective?: boolean
}

export type ElectivePool = {
  id: string
  degree_program_id: string
  name: string
  description?: string
  subjects?: ElectivePoolSubject[]
}

export type ElectiveRequirementType = 'hours' | 'credits' | 'subject_count'

export type ElectiveRule = {
  id: string
  degree_program_id: string
  pool_id: string
  applies_from_year: number
  applies_to_year?: number | null
  requirement_type: ElectiveRequirementType
  minimum_value: number
  pool?: ElectivePool
}
