import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { CurriculumSubject, PrerequisiteType } from "../(types)/types";
import { useDegree } from "../degree-context";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Info, PlusCircleIcon, Trash2 } from "lucide-react";
import React from "react";

const getTermLabel = (term?: CurriculumSubject["term"]) => {
  if (term === "annual") return "Anual";
  if (term === "semester") return "Semestral";
  if (term === "quarterly") return "Cuatrimestral";
  if (term === "bimonthly") return "Bimestral";
  return "Anual";
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

const YearColumn: React.FC<{
  year: number;
  subjects: CurriculumSubject[];
  onRemoveSubject: (subjectId: string) => void;
  onContextMenu?: (subjectId: string, event: React.MouseEvent) => void;
  editingSubjectId?: string | null;
  editingName?: string;
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
}> = ({
  year,
  subjects,
  onRemoveSubject,
  onContextMenu,
  editingSubjectId,
  editingName,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `year-${year}` });

  return (
    <div className="w-full sm:w-72 flex-shrink-0">
      <Card className="h-full">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Año {year}</h3>
          <p className="text-sm text-gray-600">{subjects.length} materias</p>
        </div>

        <div className="p-4">
          <SortableContext
            items={subjects.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              ref={setNodeRef}
              className={`space-y-2 min-h-[200px] rounded-md transition-colors select-none ${
                isOver ? "bg-blue-50" : ""
              }`}
            >
              {subjects.map((subject) => (
                <SortableSubject
                  key={subject.id}
                  subject={subject}
                  onRemove={() => onRemoveSubject(subject.id)}
                  onContextMenu={onContextMenu}
                  isEditing={subject.id === editingSubjectId}
                  editingName={editingName}
                  onRenameChange={onRenameChange}
                  onRenameSubmit={onRenameSubmit}
                  onRenameCancel={onRenameCancel}
                />
              ))}

              {subjects.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Arrastra materias aquí
                </div>
              )}
            </div>
          </SortableContext>
        </div>
      </Card>
    </div>
  );
};

const SortableSubject: React.FC<{
  subject: CurriculumSubject;
  onRemove?: (id:string) => void;
  onContextMenu?: (subjectId: string, event: React.MouseEvent) => void;
  isEditing?: boolean;
  editingName?: string;
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
}> = ({
  subject,
  onRemove,
  onContextMenu,
  isEditing,
  editingName,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: subject.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isEditing ? { ...attributes, ...listeners } : {})}
    >
      <SubjectCard
        subject={subject}
        isDragging={isDragging}
        onRemove={onRemove}
        onContextMenu={onContextMenu}
        isEditing={isEditing}
        editingName={editingName}
        onRenameChange={onRenameChange}
        onRenameSubmit={onRenameSubmit}
        onRenameCancel={onRenameCancel}
      />
    </div>
  );
};

const AddSubjectButton: React.FC<{
  onAdd: () => void;
  label: string;
  helperText?: string;
  accentClassName?: string;
}> = ({ onAdd, label, helperText, accentClassName = "hover:border-green-400" }) => {
  return (
    <div
      onClick={onAdd}
      className={`bg-white border-2 border-dashed border-gray-200 rounded-lg p-3 shadow-sm cursor-pointer ${accentClassName}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <PlusCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-gray-900">{label}</span>
            {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
          </div>
        </div>
      </div>  
    </div>
  )
}

const SubjectCard: React.FC<{
  subject: CurriculumSubject;
  isDragging?: boolean;
  onRemove?: (id:string) => void;
  onContextMenu?: (subjectId: string, event: React.MouseEvent) => void;
  isEditing?: boolean;
  editingName?: string;
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
}> = ({
  subject,
  isDragging,
  onRemove,
  onContextMenu,
  isEditing,
  editingName,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}) => {
  const { subjects: allSubjects } = useDegree();

  const prerequisiteTypeLabels: Record<PrerequisiteType, string> = {
    passed: "Aprobada",
    pending_final: "Final pendiente",
  };

  const requirements = subject.prerequisites.map((prereq) => {
    const foundSubject = allSubjects.find((s) => s.id === prereq.subjectId);
    return {
      ...prereq,
      name: foundSubject?.name ?? "Materia no encontrada",
    };
  });

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm transition-all ${
        isDragging ? "opacity-50 rotate-2" : "hover:shadow-md"
      }`}
      onContextMenu={onContextMenu ? (e) => onContextMenu(subject.id, e) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                autoFocus
                value={editingName}
                onChange={(e) => onRenameChange?.(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onRenameSubmit?.();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    onRenameCancel?.();
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  if ((e.relatedTarget as HTMLElement)?.dataset?.action === "cancel-rename") return;
                  onRenameSubmit?.();
                }}
                className="!py-1 !px-2 text-sm w-full"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  data-action="cancel-rename"
                  className="text-sm text-gray-600 px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameCancel?.();
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">{subject.name}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
                {getTermLabel(subject.term)}
              </span>
              {subject.isElective && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                  Electiva
                </span>
              )}
              <div
                className="relative group"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <Info className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-default" />
                <div className="pointer-events-none absolute right-0 top-5 z-20 w-64 rounded-md border border-gray-200 bg-white p-3 text-gray-700 shadow-lg opacity-0 translate-y-1 transition duration-150 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                  <p className="text-xs font-semibold text-gray-900 mb-1">Requisitos</p>
                  {requirements.length > 0 ? (
                    <ul className="space-y-1">
                      {requirements.map((req, idx) => (
                        <li key={`${req.subjectId}-${idx}`} className="text-xs text-gray-700">
                          <span className="font-medium">{req.name}</span>
                          <span className="text-gray-500"> · {prerequisiteTypeLabels[req.type]}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">Sin requisitos asignados</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {onRemove && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(subject.id);
            }}
            className="text-gray-400 hover:text-red-600 transition-colors "
            aria-label={`Eliminar ${subject.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const UnassignedPool: React.FC<{
  subjects: CurriculumSubject[];
  onDelete: (id: string) => void;
  onAdd: () => void;
  onAddElective?: () => void;
  onContextMenu?: (subjectId: string, event: React.MouseEvent) => void;
  editingSubjectId?: string | null;
  editingName?: string;
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
}> = ({
  subjects,
  onDelete,
  onAdd,
  onContextMenu,
  editingSubjectId,
  editingName,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <Card className="mb-6">
      <div className="p-4 border-b border-gray-200 bg-purple-50">
        <h3 className="font-semibold text-purple-900">Banco de Materias</h3>
        <p className="text-sm text-purple-700">{subjects.length} materias disponibles</p>
      </div>

      <div className="p-4">
        <SortableContext items={subjects.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div
            ref={setNodeRef}
            className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 rounded-md transition-colors select-none ${
              isOver ? "bg-purple-50" : ""
            }`}
          >
            {subjects.map((subject) => (
              <SortableSubject
                key={subject.id}
                subject={subject}
                onRemove={onDelete}
                onContextMenu={onContextMenu}
                isEditing={subject.id === editingSubjectId}
                editingName={editingName}
                onRenameChange={onRenameChange}
                onRenameSubmit={onRenameSubmit}
                onRenameCancel={onRenameCancel}
              />
            ))}
            <AddSubjectButton onAdd={onAdd} label="Agregar materia" />
          </div>
        </SortableContext>
      </div>
    </Card>
  );
};

export { Button, Input, Label, Select, Card, YearColumn, SubjectCard, SortableSubject, UnassignedPool };
