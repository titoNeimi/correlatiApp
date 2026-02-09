export type DegreeProgram = {
  id: string;
  name: string;
  university: University;
  universityID: string;
  subjects?: DegreeProgramSubject[];
  users?: { id: string; email?: string; role?: string }[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  publicRequested?: boolean;
  created_at: string;
  updated_at: string;
};

export type DegreeProgramSubject = {
  id: string;
  name: string;
  year?: number | null;
  term?: 'annual' | 'semester' | 'quarterly' | 'bimonthly';
  requirements?: Array<string | { id?: string; name?: string; minStatus?: 'passed' | 'final_pending' }>;
  status?: SubjectStatus;
  degreeProgramID: string;
  final_calification?: number;
  is_elective?: boolean;
  hours?: number;
  credits?: number;
  created_at: string;
  updated_at: string;
};
