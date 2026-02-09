interface DegreeData {
  universityId?: string;
  universityName?: string;
  degreeName: string;
  publicRequested: boolean;
  years: number;
  subjects: number;
}

interface CurriculumSubject {
  id: string;
  name: string;
  year: number | null;
  term?: 'annual' | 'semester' | 'quarterly' | 'bimonthly';
  prerequisites: Prerequisite[];
  isElective?: boolean;
}

type ElectiveRequirementType = 'hours' | 'credits' | 'subject_count';

interface ElectivePoolDraft {
  id: string;
  name: string;
  description?: string;
  subjectIds: string[];
}

interface ElectiveRuleDraft {
  id: string;
  poolId: string;
  appliesFromYear: number;
  appliesToYear?: number | null;
  requirementType: ElectiveRequirementType;
  minimumValue: number;
}

interface DegreeContextType {
  degreeData: DegreeData | null;
  setDegreeData: (data: DegreeData | null) => void;
  subjects: CurriculumSubject[];
  setSubjects: (subjects: CurriculumSubject[]) => void;
  electivePools: ElectivePoolDraft[];
  setElectivePools: (pools: ElectivePoolDraft[]) => void;
  electiveRules: ElectiveRuleDraft[];
  setElectiveRules: (rules: ElectiveRuleDraft[]) => void;
}

interface Prerequisite {
  subjectId: string;
  type: PrerequisiteType;
}

type PrerequisiteType = 'passed' | 'pending_final';

export type {
  DegreeContextType,
  DegreeData,
  CurriculumSubject,
  PrerequisiteType,
  Prerequisite,
  ElectivePoolDraft,
  ElectiveRuleDraft,
  ElectiveRequirementType,
}
