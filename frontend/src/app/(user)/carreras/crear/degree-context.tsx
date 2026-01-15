'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DegreeContextType,
  DegreeData,
  CurriculumSubject,
  ElectivePoolDraft,
  ElectiveRuleDraft,
} from './(types)/types';

const DegreeContext = createContext<DegreeContextType | undefined>(undefined);

const DegreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // estados iniciales iguales en SSR/cliente; luego se rellenan en useEffect
  const [degreeData, setDegreeData] = useState<DegreeData | null>(null);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [electivePools, setElectivePools] = useState<ElectivePoolDraft[]>([]);
  const [electiveRules, setElectiveRules] = useState<ElectiveRuleDraft[]>([]);

  useEffect(() => {
    try {
      const storedDegree = localStorage.getItem('degreeData');
      const storedSubjects = localStorage.getItem('degreeSubjects');
      const storedPools = localStorage.getItem('degreeElectivePools');
      const storedRules = localStorage.getItem('degreeElectiveRules');

      if (storedDegree) {
        const parsed = JSON.parse(storedDegree) as DegreeData;
        setDegreeData(parsed);
      }

      if (storedSubjects) {
        const parsed = JSON.parse(storedSubjects) as CurriculumSubject[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubjects(parsed);
        }
      }

      if (storedPools) {
        const parsedPools = JSON.parse(storedPools) as ElectivePoolDraft[];
        if (Array.isArray(parsedPools)) {
          setElectivePools(parsedPools);
        }
      }

      if (storedRules) {
        const parsedRules = JSON.parse(storedRules) as ElectiveRuleDraft[];
        if (Array.isArray(parsedRules)) {
          setElectiveRules(parsedRules);
        }
      }
      return;
    } catch {
      // ignore parse errors
    }
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

  useEffect(() => {
    if (electivePools.length > 0) {
      localStorage.setItem('degreeElectivePools', JSON.stringify(electivePools));
    } else {
      localStorage.removeItem('degreeElectivePools');
    }
  }, [electivePools]);

  useEffect(() => {
    if (electiveRules.length > 0) {
      localStorage.setItem('degreeElectiveRules', JSON.stringify(electiveRules));
    } else {
      localStorage.removeItem('degreeElectiveRules');
    }
  }, [electiveRules]);

  return (
    <DegreeContext.Provider
      value={{
        degreeData,
        setDegreeData,
        subjects,
        setSubjects,
        electivePools,
        setElectivePools,
        electiveRules,
        setElectiveRules,
      }}
    >
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
