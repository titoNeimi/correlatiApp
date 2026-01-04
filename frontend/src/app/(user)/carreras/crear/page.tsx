'use client'
import React, { useState } from 'react';
import { DegreeProvider } from './degree-context';
import { CreateDegreeWizard } from './CreateDegreeWizard';
import { YearGrid } from './YearGrid';

const App: React.FC = () => {
  const [view, setView] = useState<'wizard' | 'grid'>('wizard');

  return (
    <DegreeProvider>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {view === 'wizard' ? (
            <CreateDegreeWizard onComplete={() => setView('grid')} />
          ) : (
            <YearGrid />
          )}
        </div>
      </div>
    </DegreeProvider>
  );
};

export default App;
