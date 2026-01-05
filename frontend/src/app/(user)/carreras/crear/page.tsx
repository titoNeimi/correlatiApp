'use client'
import React, { useState } from 'react';
import { DegreeProvider } from './degree-context';
import { CreateDegreeWizard } from './CreateDegreeWizard';
import { YearGrid } from './YearGrid';

const App: React.FC = () => {
  const [view, setView] = useState<'wizard' | 'grid'>('wizard');

  return (
    <DegreeProvider>
      <div className="bg-gray-50 py-8 px-4 flex justify-center items-center min-h-[calc(100vh-82px)] overflow-hidden">
        <div className="w-full max-w-screen-2xl mx-auto flex justify-center">
          {view === 'wizard' ? <CreateDegreeWizard onComplete={() => setView('grid')}/> : <YearGrid />}
        </div>
      </div>
    </DegreeProvider>
  );
};

export default App;
