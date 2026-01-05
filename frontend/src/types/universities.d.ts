type University = {
  id: string,
  name: string,
  location?: string,
  website?: string,
  degreePrograms?: degreeProgram[],
  created_at: string,
  updated_at: string
}