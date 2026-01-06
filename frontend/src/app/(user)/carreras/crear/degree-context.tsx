'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DegreeContextType, DegreeData, CurriculumSubject } from './(types)/types';
import { MOCK_SUBJECTS } from '@/lib/mocks';

const DegreeContext = createContext<DegreeContextType | undefined>(undefined);

const DegreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // estados iniciales iguales en SSR/cliente; luego se rellenan en useEffect
  const [degreeData, setDegreeData] = useState<DegreeData | null>(null);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);

  useEffect(() => {
    try {
      const storedDegree = localStorage.getItem('degreeData');
      const storedSubjects = localStorage.getItem('degreeSubjects');

      if (storedDegree) {
        const parsed = JSON.parse(storedDegree) as DegreeData;
        setDegreeData(parsed);
      }

      if (storedSubjects) {
        const parsed = JSON.parse(storedSubjects) as CurriculumSubject[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubjects(parsed);
          return;
        }
      }
    } catch {
      // ignore parse errors and fallback to mocks
    }
    // fallback si no hay storage o está vacío
    setSubjects(MOCK_SUBJECTS.map((s) => ({ ...s, year: null })));
  }, []);

  // persistencia centralizada
  useEffect(() => {
    if (degreeData) {
      localStorage.setItem('degreeData', JSON.stringify(degreeData));
    } else {
      localStorage.removeItem('degreeData');
    }
  }, [degreeData]);

  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem('degreeSubjects', JSON.stringify(subjects));
    } else {
      localStorage.removeItem('degreeSubjects');
    }
  }, [subjects]);

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
