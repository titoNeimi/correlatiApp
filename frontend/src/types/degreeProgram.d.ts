export type DegreeProgram = {
  id: string;
  name: string;
  university: University;
  universityID: string;
  subjects?: DegreeProgramSubject[];
  users?: { id: string; email?: string; role?: string }[];
  created_at: string;
  updated_at: string;
};

export type DegreeProgramSubject = {
  id: string;
  name: string;
  year: number;
  requirements?: string[];
  status?: SubjectStatus;
  degreeProgramID: string;
  created_at: string;
  updated_at: string;
};
