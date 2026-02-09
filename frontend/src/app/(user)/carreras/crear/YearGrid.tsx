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
import { useDegree } from './degree-context';
import { CurriculumSubject, PrerequisiteType, ElectiveRequirementType } from './(types)/types';
import { Select, YearColumn, SubjectCard, UnassignedPool } from './(components)';
import { confirmCreation } from './action';
import Link from 'next/link';

const DEFAULT_TERM: NonNullable<CurriculumSubject['term']> = 'annual';

const YearGrid: React.FC<{ onResetWizard?: () => void }> = ({ onResetWizard }) => {
  const {
    degreeData,
    setDegreeData,
    subjects,
    setSubjects,
    electivePools,
    setElectivePools,
    electiveRules,
    setElectiveRules,
  } = useDegree();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [count, setCount] = useState<number>(() => subjects.length + 1);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    subjectId: string;
    view: 'default' | 'addRequirement' | 'setTerm';
  } | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [prereqSelection, setPrereqSelection] = useState<{ subjectId: string; type: PrerequisiteType }>({
    subjectId: '',
    type: 'pending_final',
  });
  const [termSelection, setTermSelection] = useState<NonNullable<CurriculumSubject['term']>>(DEFAULT_TERM);
  const [poolName, setPoolName] = useState('');
  const [poolDescription, setPoolDescription] = useState('');
  const [poolError, setPoolError] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [rulePoolId, setRulePoolId] = useState('');
  const [ruleFromYear, setRuleFromYear] = useState<number>(1);
  const [ruleToYear, setRuleToYear] = useState<number | ''>('');
  const [ruleRequirementType, setRuleRequirementType] =
    useState<ElectiveRequirementType>('subject_count');
  const [ruleMinimumValue, setRuleMinimumValue] = useState<number>(1);
  const [poolSelection, setPoolSelection] = useState<Record<string, string>>({});

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
    // restaurar desde localStorage si se recargó la página
    try {
      const storedDegree = localStorage.getItem('degreeData');
      if (!degreeData && storedDegree) {
        setDegreeData(JSON.parse(storedDegree));
      }
      const storedSubjects = localStorage.getItem('degreeSubjects');
      if (storedSubjects) {
        const parsed = JSON.parse(storedSubjects) as CurriculumSubject[];
        if (parsed.length > 0) {
          setSubjects(parsed);
        }
      }
      const storedPools = localStorage.getItem('degreeElectivePools');
      if (storedPools && electivePools.length === 0) {
        const parsedPools = JSON.parse(storedPools) as typeof electivePools;
        if (Array.isArray(parsedPools)) {
          setElectivePools(parsedPools);
        }
      }
      const storedRules = localStorage.getItem('degreeElectiveRules');
      if (storedRules && electiveRules.length === 0) {
        const parsedRules = JSON.parse(storedRules) as typeof electiveRules;
        if (Array.isArray(parsedRules)) {
          setElectiveRules(parsedRules);
        }
      }
    } catch (err) {
      console.log('No se pudieron restaurar datos de la carrera', err);
    }
    // solo queremos intentar restaurar en el primer render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (degreeData) {
      localStorage.setItem('degreeData', JSON.stringify(degreeData));
    }
  }, [degreeData]);

  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem('degreeSubjects', JSON.stringify(subjects));
    }
  }, [subjects]);

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

  const handleCancel = () => {
    localStorage.removeItem('degreeData');
    localStorage.removeItem('degreeSubjects');
    localStorage.removeItem('degreeElectivePools');
    localStorage.removeItem('degreeElectiveRules');
    setDegreeData(null);
    setSubjects([]);
    setElectivePools([]);
    setElectiveRules([]);
    if (onResetWizard) onResetWizard();
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

  const handleSetSubjectTerm = (subjectId: string, term: NonNullable<CurriculumSubject['term']>) => {
    setSubjects(subjects.map((subject) => (subject.id === subjectId ? { ...subject, term } : subject)));
  };

  const openSetTerm = () => {
    if (!contextMenu) return;
    const subject = subjects.find((item) => item.id === contextMenu.subjectId);
    setTermSelection(subject?.term ?? DEFAULT_TERM);
    setContextMenu((prev) => (prev ? { ...prev, view: 'setTerm' } : prev));
  };

  const submitTerm = () => {
    if (!contextMenu) return;
    handleSetSubjectTerm(contextMenu.subjectId, termSelection);
    setContextMenu(null);
  };

  if (!degreeData) {
    return (
      <div className="w-full max-w-xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Falta configurar la carrera</h2>
        <p className="text-gray-600">
          No encontramos datos guardados de la carrera. Volvé al asistente para crearlos.
        </p>
        <div className="flex justify-center">
          <button
            onClick={onResetWizard}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Volver al asistente
          </button>
        </div>
      </div>
    );
  }

  const coreSubjects = subjects.filter((s) => !s.isElective);
  const unassignedSubjects = coreSubjects.filter((s) => s.year === null);
  const yearSubjects = Array.from({ length: degreeData.years }, (_, i) => ({
    year: i + 1,
    subjects: coreSubjects.filter((s) => s.year === i + 1),
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

    const nextYear = activeSubject.isElective ? null : targetYear;
    setSubjects(
      subjects.map((s) => (s.id === active.id ? { ...s, year: nextYear } : s))
    );

    setActiveId(null);
  };

  const handleRemoveFromYear = (subjectId: string) => {
    setSubjects(subjects.map((s) => (s.id === subjectId ? { ...s, year: null } : s)));
  };

  const handleDeleteSubject = (subjectId: string) => {
    const remainingSubjects = subjects.filter((subject) => subject.id !== subjectId);
    const cleanedSubjects = remainingSubjects.map((subject) => {
      if (subject.prerequisites.length === 0) return subject;
      const filtered = subject.prerequisites.filter((req) => req.subjectId !== subjectId);
      return filtered.length === subject.prerequisites.length
        ? subject
        : { ...subject, prerequisites: filtered };
    });
    setSubjects(cleanedSubjects);
    setElectivePools(
      electivePools.map((pool) => ({
        ...pool,
        subjectIds: pool.subjectIds.filter((id) => id !== subjectId),
      }))
    );
    if (editingSubjectId === subjectId) {
      cancelRename();
    }
    setContextMenu(null);
  };

  const handleAdd = (isElective = false): void => {
    const newSubject: CurriculumSubject = {
      id: `new${count}`,
      year: null,
      name: `Materia Nueva ${count}`,
      term: DEFAULT_TERM,
      prerequisites: [],
      isElective,
    };
    setSubjects([...subjects, newSubject]);
    setCount(count + 1);
  };

  const handleAddElective = () => handleAdd(true);

  const handleToggleElective = (subjectId: string) => {
    const wasElective = subjects.find((subject) => subject.id === subjectId)?.isElective;
    setSubjects(
      subjects.map((subject) =>
        subject.id === subjectId
          ? { ...subject, isElective: !subject.isElective, year: !subject.isElective ? null : subject.year }
          : subject
      )
    );
    if (wasElective) {
      setElectivePools(
        electivePools.map((pool) => ({
          ...pool,
          subjectIds: pool.subjectIds.filter((id) => id !== subjectId),
        }))
      );
    }
    setContextMenu(null);
  };

  const activeSubject = subjects.find((s) => s.id === activeId);
  const electiveSubjects = subjects.filter((s) => s.isElective);
  const pooledSubjectIds = new Set(electivePools.flatMap((pool) => pool.subjectIds));
  const createLocalId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const handleCreatePool = () => {
    const trimmedName = poolName.trim();
    if (!trimmedName) {
      setPoolError('El nombre del pool es obligatorio');
      return;
    }
    setPoolError(null);
    const newPool = {
      id: createLocalId('pool'),
      name: trimmedName,
      description: poolDescription.trim() || undefined,
      subjectIds: [],
    };
    setElectivePools([...electivePools, newPool]);
    setPoolName('');
    setPoolDescription('');
  };

  const handleDeletePool = (poolId: string) => {
    setElectivePools(electivePools.filter((pool) => pool.id !== poolId));
    setElectiveRules(electiveRules.filter((rule) => rule.poolId !== poolId));
  };

  const handleAddSubjectToPool = (poolId: string, subjectId: string) => {
    if (!subjectId) return;
    if (pooledSubjectIds.has(subjectId)) return;
    setElectivePools(
      electivePools.map((pool) =>
        pool.id === poolId && !pool.subjectIds.includes(subjectId)
          ? { ...pool, subjectIds: [...pool.subjectIds, subjectId] }
          : pool
      )
    );
    setPoolSelection((prev) => ({ ...prev, [poolId]: '' }));
  };

  const handleRemoveSubjectFromPool = (poolId: string, subjectId: string) => {
    setElectivePools(
      electivePools.map((pool) =>
        pool.id === poolId
          ? { ...pool, subjectIds: pool.subjectIds.filter((id) => id !== subjectId) }
          : pool
      )
    );
  };

  const handleCreateRule = () => {
    if (!rulePoolId) {
      setRuleError('Debe seleccionar un pool');
      return;
    }
    if (ruleMinimumValue <= 0) {
      setRuleError('El mínimo debe ser mayor a 0');
      return;
    }
    if (ruleToYear !== '' && ruleToYear < ruleFromYear) {
      setRuleError('El año hasta no puede ser menor que el año desde');
      return;
    }
    setRuleError(null);
    const newRule = {
      id: createLocalId('rule'),
      poolId: rulePoolId,
      appliesFromYear: ruleFromYear,
      appliesToYear: ruleToYear === '' ? null : ruleToYear,
      requirementType: ruleRequirementType,
      minimumValue: ruleMinimumValue,
    };
    setElectiveRules([...electiveRules, newRule]);
    setRulePoolId('');
    setRuleFromYear(1);
    setRuleToYear('');
    setRuleRequirementType('subject_count');
    setRuleMinimumValue(1);
  };

  const handleDeleteRule = (ruleId: string) => {
    setElectiveRules(electiveRules.filter((rule) => rule.id !== ruleId));
  };

  const handleConfirmCreation = async () => {
    if (!degreeData) return;
    const missingYears = Array.from({ length: degreeData.years }, (_, i) => i + 1).filter(
      (year) => !coreSubjects.some((s) => s.year === year)
    );
    const unassigned = coreSubjects.filter((s) => s.year === null).map((s) => s.name);
    const pooledIds = new Set(electivePools.flatMap((pool) => pool.subjectIds));
    const unpooledElectives = electiveSubjects
      .filter((subject) => !pooledIds.has(subject.id))
      .map((subject) => subject.name);

    const validationErrors: string[] = [];
    if (missingYears.length > 0) {
      validationErrors.push(`Años sin materias asignadas: ${missingYears.join(', ')}`);
    }
    if (unassigned.length > 0) {
      validationErrors.push(`Materias sin asignar: ${unassigned.join(', ')}`);
    }
    if (unpooledElectives.length > 0) {
      validationErrors.push(`Electivas sin pool: ${unpooledElectives.join(', ')}`);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setResultMessage(null);
      return;
    }

    setErrors([]);
    setResultMessage(null);
    setConfirming(true);
    try {
      const result = await confirmCreation({ degreeData, subjects, electivePools, electiveRules });
      if (result.ok) {
        setResultMessage({ type: 'success', text: result.message || 'Carrera creada correctamente' });
      } else {
        setResultMessage({ type: 'error', text: result.message || 'No se pudo crear la carrera' });
      }
    } finally {
      setConfirming(false);
    }
  };

  const isSuccessMessage = resultMessage?.type === 'success';

  if (isSuccessMessage) {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-green-100 p-10 md:p-16 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-green-700">Creacion exitosa</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-green-900">
            {degreeData?.degreeName}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-green-800">
            {resultMessage?.text ?? 'Carrera creada correctamente'}
          </p>
          <p className="mt-2 text-base text-green-700">
            {degreeData?.universityName || degreeData?.universityId}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/carreras"
              className="inline-flex items-center justify-center rounded-full bg-green-700 px-6 py-3 text-base font-semibold text-white hover:bg-green-800"
            >
              Ir a carreras
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {degreeData.degreeName}
        </h1>
        <p className="text-gray-600">
          {degreeData.universityName || degreeData.universityId}
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
          onAddElective={handleAddElective}
          onContextMenu={handleContextMenu}
          editingSubjectId={editingSubjectId}
          editingName={editingName}
          onRenameChange={setEditingName}
          onRenameSubmit={submitRename}
          onRenameCancel={cancelRename}
        />

        <div className="pb-4">
          <div className="flex flex-wrap gap-4 min-w-0">
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

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-amber-900">Electivas</h2>
            <p className="text-xs text-amber-800">Solo se agrupan por pools, no por año.</p>
          </div>
          <button
            onClick={handleAddElective}
            className="px-3 py-2 rounded bg-amber-600 text-white text-xs hover:bg-amber-700"
          >
            Agregar electiva
          </button>
        </div>
        {electiveSubjects.length === 0 ? (
          <p className="text-xs text-amber-800">No hay electivas creadas.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {electiveSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onRemove={handleDeleteSubject}
                onContextMenu={handleContextMenu}
                isEditing={subject.id === editingSubjectId}
                editingName={editingName}
                onRenameChange={setEditingName}
                onRenameSubmit={submitRename}
                onRenameCancel={cancelRename}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Pools de electivas</h2>
            <p className="text-sm text-slate-600">
              Agrupa electivas por tematica y asigna materias a cada pool.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              placeholder="Nombre del pool (ej: Sociales)"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={poolDescription}
              onChange={(e) => setPoolDescription(e.target.value)}
              placeholder="Descripcion (opcional)"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleCreatePool}
              className="px-4 py-2 rounded bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Crear pool
            </button>
            {poolError && <p className="text-sm text-red-600">{poolError}</p>}
          </div>
        </div>

        {electivePools.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            No hay pools de electivas creados.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {electivePools.map((pool) => {
              const availableElectives = electiveSubjects.filter(
                (subject) => !pooledSubjectIds.has(subject.id)
              );
              const selectedId = poolSelection[pool.id] ?? '';
              return (
                <div key={pool.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{pool.name}</h3>
                      {pool.description && (
                        <p className="text-xs text-slate-500 mt-1">{pool.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePool(pool.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-600">Electivas en el pool</p>
                    {pool.subjectIds.length === 0 ? (
                      <p className="text-xs text-slate-500">Sin electivas asignadas</p>
                    ) : (
                      <div className="space-y-1">
                        {pool.subjectIds.map((subjectId) => {
                          const subject = subjects.find((s) => s.id === subjectId);
                          if (!subject) return null;
                          return (
                            <div
                              key={subjectId}
                              className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs text-slate-700"
                            >
                              <span>{subject.name}</span>
                              <button
                                onClick={() => handleRemoveSubjectFromPool(pool.id, subjectId)}
                                className="text-red-500 hover:text-red-600"
                              >
                                Quitar
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Select
                      value={selectedId}
                      onChange={(e) =>
                        setPoolSelection((prev) => ({ ...prev, [pool.id]: e.target.value }))
                      }
                    >
                      <option value="">Agregar electiva</option>
                      {availableElectives.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </Select>
                    <button
                      onClick={() => handleAddSubjectToPool(pool.id, selectedId)}
                      disabled={!selectedId}
                      className="px-3 py-2 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Reglas de electivas</h2>
            <p className="text-sm text-slate-600">
              Define requisitos por pool y rango de anos.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select value={rulePoolId} onChange={(e) => setRulePoolId(e.target.value)}>
              <option value="">Selecciona un pool</option>
              {electivePools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </Select>
            <Select
              value={ruleFromYear}
              onChange={(e) => setRuleFromYear(Number(e.target.value))}
            >
              {Array.from({ length: degreeData.years }, (_, i) => i + 1).map((year) => (
                <option key={year} value={year}>
                  Desde {year}o
                </option>
              ))}
            </Select>
            <Select
              value={ruleToYear === '' ? '' : ruleToYear}
              onChange={(e) => {
                const value = e.target.value;
                setRuleToYear(value === '' ? '' : Number(value));
              }}
            >
              <option value="">Hasta (opcional)</option>
              {Array.from({ length: degreeData.years }, (_, i) => i + 1).map((year) => (
                <option key={year} value={year}>
                  Hasta {year}o
                </option>
              ))}
            </Select>
            <Select
              value={ruleRequirementType}
              onChange={(e) => setRuleRequirementType(e.target.value as ElectiveRequirementType)}
            >
              <option value="subject_count">Cantidad de materias</option>
              <option value="hours">Horas</option>
              <option value="credits">Creditos</option>
            </Select>
            <input
              type="number"
              min={1}
              value={ruleMinimumValue}
              onChange={(e) => setRuleMinimumValue(Number(e.target.value))}
              placeholder="Minimo"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleCreateRule}
              className="px-4 py-2 rounded bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Crear regla
            </button>
            {ruleError && <p className="text-sm text-red-600">{ruleError}</p>}
          </div>
        </div>

        {electiveRules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            No hay reglas de electivas definidas.
          </div>
        ) : (
          <div className="grid gap-3">
            {electiveRules.map((rule) => {
              const pool = electivePools.find((p) => p.id === rule.poolId);
              const toYearLabel = rule.appliesToYear ? `hasta ${rule.appliesToYear}o` : 'sin tope';
              const typeLabel =
                rule.requirementType === 'subject_count'
                  ? 'materias'
                  : rule.requirementType === 'hours'
                  ? 'horas'
                  : 'creditos';
              return (
                <div key={rule.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {pool?.name ?? 'Pool sin nombre'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {rule.minimumValue} {typeLabel} desde {rule.appliesFromYear}o {toYearLabel}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => openSetTerm()}
              >
                Cambiar cursada
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => handleToggleElective(contextMenu.subjectId)}
              >
                {subjects.find((subject) => subject.id === contextMenu.subjectId)?.isElective
                  ? 'Quitar electiva'
                  : 'Marcar como electiva'}
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
                  <option value="passed">Aprobada</option>
                  <option value="pending_final">Final pendiente</option>
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
            {contextMenu.view === 'setTerm' && (
              <div className="border-t border-gray-200 p-3 space-y-2 w-80">
                <p className="text-sm font-medium text-gray-800">Definir cursada</p>
                <Select
                  value={termSelection}
                  onChange={(e) =>
                    setTermSelection(e.target.value as NonNullable<CurriculumSubject['term']>)
                  }
                >
                  <option value="annual">Anual</option>
                  <option value="semester">Semestral</option>
                  <option value="quarterly">Cuatrimestral</option>
                  <option value="bimonthly">Bimestral</option>
                </Select>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    className="px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50"
                    onClick={() => setContextMenu(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    onClick={submitTerm}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {errors.length > 0 && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 space-y-1">
          {errors.map((err, idx) => (
            <div key={idx}>{err}</div>
          ))}
        </div>
      )}
      {resultMessage && (
        <div
          className={`mt-4 rounded border p-3 text-sm ${
            isSuccessMessage
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {resultMessage.text}
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleCancel}
          className="px-4 py-2 mr-3 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmCreation}
          disabled={confirming}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {confirming ? 'Confirmando...' : 'Crear'}
        </button>
      </div>
    </div>
  )
}

export { YearGrid };
