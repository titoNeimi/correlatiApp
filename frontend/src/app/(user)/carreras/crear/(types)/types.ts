interface DegreeData {
  universityId?: string;
  universityName?: string;
  degreeName: string;
  years: number;
}

interface CurriculumSubject {
  id: string;
  name: string;
  year: number | null;
  prerequisites: Prerequisite[];
}

interface DegreeContextType {
  degreeData: DegreeData | null;
  setDegreeData: (data: DegreeData) => void;
  subjects: CurriculumSubject[];
  setSubjects: (subjects: CurriculumSubject[]) => void;
}

interface Prerequisite {
  subjectId: string;
  type: PrerequisiteType;
}

type PrerequisiteType = 'approved' | 'pending_final';

export type { DegreeContextType, DegreeData, CurriculumSubject, PrerequisiteType, Prerequisite }
