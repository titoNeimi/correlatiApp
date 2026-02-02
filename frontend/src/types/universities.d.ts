type UniversityTag = {
  tag: string,
}

type UniversityQuickLink = {
  id?: string,
  label: string,
  url: string,
}

type UniversityAdditionalInformation = {
  id?: string,
  title: string,
  description?: string,
  url?: string,
  status?: string,
}

type University = {
  id: string,
  name: string,
  location?: string,
  website?: string,
  institution_type?: 'public' | 'private' | 'mixed',
  summary?: string,
  logo_url?: string,
  primary_focus?: string,
  focus_tags?: UniversityTag[],
  quick_links?: UniversityQuickLink[],
  additional_information?: UniversityAdditionalInformation[],
  degreePrograms?: DegreeProgram[],
  created_at: string,
  updated_at: string
}
