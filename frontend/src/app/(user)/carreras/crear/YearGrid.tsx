'use client'
import React, { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { MOCK_UNIVERSITIES } from '@/lib/mocks';
import { useDegree } from './degree-context';
import { CurriculumSubject, PrerequisiteType } from './(types)/types';
import { Select, YearColumn, SubjectCard, UnassignedPool } from './(components)';

const YearGrid: React.FC = () => {
  const { degreeData, subjects, setSubjects } = useDegree();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    subjectId: string;
    view: 'default' | 'addRequirement';
  } | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [prereqSelection, setPrereqSelection] = useState<{ subjectId: string; type: PrerequisiteType }>({
    subjectId: '',
    type: 'pending_final',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleContextMenu = (subjectId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, subjectId, view: 'default' });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const closeMenuOnScroll = () => setContextMenu(null);
    window.addEventListener('scroll', closeMenuOnScroll, true);
    return () => window.removeEventListener('scroll', closeMenuOnScroll, true);
  }, [contextMenu]);

  const startRename = (id: string) => {
    const current = subjects.find((s) => s.id === id);
    setEditingSubjectId(id);
    setEditingName(current?.name ?? '');
    setContextMenu(null);
  };

  const handleRename = (id: string, name: string) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const submitRename = () => {
    if (!editingSubjectId) return;
    const newName = editingName.trim();
    if (!newName) {
      cancelRename();
      return;
    }
    handleRename(editingSubjectId, newName);
    setEditingSubjectId(null);
    setEditingName('');
  };

  const cancelRename = () => {
    setEditingSubjectId(null);
    setEditingName('');
  };

  const handleAddPrerequisite = (id: string, prereqId: string, type: PrerequisiteType) => {
    if (!prereqId) return;
    setSubjects(
      subjects.map((s) =>
        s.id === id ? { ...s, prerequisites: [...s.prerequisites, { subjectId: prereqId, type }] } : s
      )
    );
  };

  const openAddRequirement = () => {
    setPrereqSelection({ subjectId: '', type: 'pending_final' });
    setContextMenu((prev) => (prev ? { ...prev, view: 'addRequirement' } : prev));
  };

  const submitRequirement = () => {
    if (!contextMenu || !prereqSelection.subjectId) return;
    handleAddPrerequisite(contextMenu.subjectId, prereqSelection.subjectId, prereqSelection.type);
    setContextMenu(null);
  };

  if (!degreeData) return null;

  const unassignedSubjects = subjects.filter((s) => s.year === null);
  const yearSubjects = Array.from({ length: degreeData.years }, (_, i) => ({
    year: i + 1,
    subjects: subjects.filter((s) => s.year === i + 1),
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeSubject = subjects.find((s) => s.id === active.id);
    if (!activeSubject) {
      setActiveId(null);
      return;
    }

    let targetYear: number | null = null;

    if (typeof over.id === 'string') {
      if (over.id === 'unassigned') {
        targetYear = null;
      } else if (over.id.startsWith('year-')) {
        const parsed = parseInt(over.id.replace('year-', ''), 10);
        targetYear = Number.isFinite(parsed) ? parsed : null;
      }
    }

    if (targetYear === null) {
      const overSubject = subjects.find((s) => s.id === over.id);
      if (overSubject) targetYear = overSubject.year;
    }

    setSubjects(
      subjects.map((s) => (s.id === active.id ? { ...s, year: targetYear } : s))
    );

    setActiveId(null);
  };

  const handleRemoveFromYear = (subjectId: string) => {
    setSubjects(subjects.map((s) => (s.id === subjectId ? { ...s, year: null } : s)));
  };

  const handleDeleteSubject = (subjectId: string) => {
    const goodSubjects = subjects.filter((subject) => subject.id != subjectId);
    setSubjects(goodSubjects);
    if (editingSubjectId === subjectId) {
      cancelRename();
    }
    setContextMenu(null);
  };

  const handleAdd = (): void => {
    const newSubject: CurriculumSubject = {
      id: `new${count}`,
      year: null,
      name: `Materia Nueva ${count}`,
      prerequisites: [],
    };
    setSubjects([...subjects, newSubject]);
    setCount(count + 1);
  };

  const activeSubject = subjects.find((s) => s.id === activeId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {degreeData.degreeName}
        </h1>
        <p className="text-gray-600">
          {degreeData.universityName ||
            MOCK_UNIVERSITIES.find((u) => u.id === degreeData.universityId)?.name}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <UnassignedPool
          subjects={unassignedSubjects}
          onDelete={handleDeleteSubject}
          onAdd={handleAdd}
          onContextMenu={handleContextMenu}
          editingSubjectId={editingSubjectId}
          editingName={editingName}
          onRenameChange={setEditingName}
          onRenameSubmit={submitRename}
          onRenameCancel={cancelRename}
        />

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-min">
            {yearSubjects.map(({ year, subjects: yearSubs }) => (
              <YearColumn
                key={year}
                year={year}
                subjects={yearSubs}
                onRemoveSubject={handleRemoveFromYear}
                onContextMenu={handleContextMenu}
                editingSubjectId={editingSubjectId}
                editingName={editingName}
                onRenameChange={setEditingName}
                onRenameSubmit={submitRename}
                onRenameCancel={cancelRename}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeSubject && <SubjectCard subject={activeSubject} isDragging />}
        </DragOverlay>
      </DndContext>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}></div>
          <div
            className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => startRename(contextMenu.subjectId)}
              >
                Cambiar nombre
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => openAddRequirement()}
              >
                Agregar requirement
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                onClick={() => handleDeleteSubject(contextMenu.subjectId)}
              >
                Eliminar subject
              </button>
            </div>

            {contextMenu.view === 'addRequirement' && (
              <div className="border-t border-gray-200 p-3 space-y-2 w-80">
                <p className="text-sm font-medium text-gray-800">Agregar requisito</p>
                <Select
                  value={prereqSelection.subjectId}
                  onChange={(e) =>
                    setPrereqSelection((prev) => ({ ...prev, subjectId: e.target.value }))
                  }
                >
                  <option value="">Selecciona una materia</option>
                  {subjects
                    .filter((s) => s.id !== contextMenu.subjectId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </Select>
                <Select
                  value={prereqSelection.type}
                  onChange={(e) =>
                    setPrereqSelection((prev) => ({
                      ...prev,
                      type: e.target.value as PrerequisiteType,
                    }))
                  }
                >
                  <option value="approved">approved</option>
                  <option value="pending_final">pending_final</option>
                </Select>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    className="px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50"
                    onClick={() => setContextMenu(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                    disabled={!prereqSelection.subjectId}
                    onClick={submitRequirement}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export { YearGrid };
