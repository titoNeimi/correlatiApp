'use client'
import React, { createContext, useContext, useState } from 'react';
import { DegreeContextType, DegreeData, CurriculumSubject } from './(types)/types';
import { MOCK_SUBJECTS } from '@/lib/mocks';

const DegreeContext = createContext<DegreeContextType | undefined>(undefined);

const DegreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [degreeData, setDegreeData] = useState<DegreeData | null>(null);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>(
    MOCK_SUBJECTS.map((s) => ({ ...s, year: null }))
  );

  return (
    <DegreeContext.Provider value={{ degreeData, setDegreeData, subjects, setSubjects }}>
      {children}
    </DegreeContext.Provider>
  );
};

const useDegree = () => {
  const context = useContext(DegreeContext);
  if (!context) throw new Error('useDegree must be used within DegreeProvider');
  return context;
};

export { DegreeProvider, useDegree };
