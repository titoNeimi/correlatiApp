'use client'
import React, { useState } from 'react';
import { DegreeProvider } from './degree-context';
import { CreateDegreeWizard } from './CreateDegreeWizard';
import { YearGrid } from './YearGrid';
import { useDegree } from './degree-context';

const InnerApp: React.FC = () => {
  const [view, setView] = useState<'wizard' | 'grid'>('wizard');
  const [hydrated, setHydrated] = useState(false);
  const { degreeData } = useDegree();

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    if (degreeData) {
      setView('grid');
      return;
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem('degreeData') : null;
    setView(stored ? 'grid' : 'wizard');
  }, [degreeData, hydrated]);

  if (!hydrated) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-8 px-4 flex justify-center items-center min-h-[calc(100vh-82px)] overflow-hidden">
      <div className="w-full max-w-screen-2xl mx-auto flex justify-center">
        {view === 'wizard' ? (
          <CreateDegreeWizard onComplete={() => setView('grid')} />
        ) : (
          <YearGrid onResetWizard={() => setView('wizard')} />
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <DegreeProvider>
    <InnerApp />
  </DegreeProvider>
);

export default App;
