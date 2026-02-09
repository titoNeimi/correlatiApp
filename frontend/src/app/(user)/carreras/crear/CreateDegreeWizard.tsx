'use client'
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useDegree } from './degree-context';
import { CurriculumSubject, DegreeData } from './(types)/types';
import { Button, Input, Label, Select, Card } from './(components)';
import { fetchDegreePrograms, createUniversity } from './action';

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
);

const universitySchema = z
  .object({
    universityId: z.string().transform((v) => (v?.trim() ? v : undefined)).optional(),
    universityName: z.string().transform((v) => (v?.trim() ? v : undefined)).optional(),
  })
  .refine(
    (data) => {
      const hasUniversityId = !!data.universityId;
      const hasUniversityName = !!data.universityName && data.universityName.length >= 2;
      return hasUniversityId || hasUniversityName;
    },
    {
      message: 'Debe seleccionar una universidad o crear una nueva',
      path: ['universityId'],
    }
  );

const degreeSchema = z.object({
  degreeName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  publicRequested: z.boolean(),
});

const structureSchema = z
  .object({
    years: z.number().min(1).max(8),
    subjects: z.number().min(1).max(80),
  })
  .refine((data) => data.subjects >= data.years, {
    message: 'Debe haber al menos tantas materias como años',
    path: ['subjects'],
  });

const UniversityStep: React.FC<{
  onNext: (data: z.infer<typeof universitySchema>) => void;
}> = ({ onNext }) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [programs, setPrograms] = useState<University[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<z.infer<typeof universitySchema>>({
    resolver: zodResolver(universitySchema),
    defaultValues: {
      universityId: '',
      universityName: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      const data = await fetchDegreePrograms();
      setPrograms(data.data || []);
      if (data.error) {
        setLoadError(data.error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleModeChange = (newMode: 'select' | 'create') => {
    setMode(newMode);
    setError(null);

    if (newMode === 'select') {
      setValue('universityName', '');
    } else {
      setValue('universityId', '');
    }

    clearErrors(['universityId', 'universityName']);
  };

  const onSubmit = async (data: z.infer<typeof universitySchema>) => {
    setError(null);
    if (mode === 'create') {
      const name = data.universityName?.trim();
      if (!name) {
        setError('El nombre es requerido para crear una universidad');
        return;
      }
      setCreating(true);
      const created = await createUniversity(name);
      setCreating(false);
      if (!created.ok) {
        setError(created.message || 'No se pudo crear la universidad');
        return;
      }
      const newUniversity = created.data;
      if (!newUniversity) {
        setError('No se pudo crear la universidad');
        return;
      }
      setPrograms((prev) => [...prev, newUniversity]);
      setValue('universityId', newUniversity.id);
      data.universityId = newUniversity.id;
      data.universityName = newUniversity.name;
    }
    if (mode === 'select' && data.universityId) {
      const selected = programs.find((uni) => uni.id === data.universityId);
      if (selected) {
        data.universityName = selected.name;
      }
    }
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 1: Universidad</h2>
        <p className="text-gray-600">Selecciona una universidad existente o crea una nueva</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'select' ? 'default' : 'outline'}
            onClick={() => handleModeChange('select')}
          >
            Seleccionar existente
          </Button>
          <Button
            type="button"
            variant={mode === 'create' ? 'default' : 'outline'}
            onClick={() => handleModeChange('create')}
          >
            <Plus className="w-4 h-4" />
            Crear nueva
          </Button>
        </div>

        {mode === 'select' && (
          <div>
            <Label htmlFor="universityId">Universidad</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <Spinner />
                Cargando universidades...
              </div>
            ) : (
              <>
                <Select
                  id="universityId"
                  {...register('universityId')}
                  error={!!errors.universityId}
                  disabled={loading}
                >
                  <option value="">Seleccione...</option>
                  {programs.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </Select>
                {loadError && <p className="text-sm text-red-600 mt-2">{loadError}</p>}
              </>
            )}
          </div>
        )}
        {mode === 'create' && (
          <div>
            <Label htmlFor="universityName">Nombre de la nueva universidad</Label>
            <div className="flex items-center gap-3">
              <Input
                id="universityName"
                {...register('universityName')}
                placeholder="Ej: Universidad Nacional de..."
                aria-invalid={!!errors.universityName}
                disabled={creating}
              />
              {creating && <Spinner />}
            </div>
          </div>
        )}

        {(errors.universityId || errors.universityName) && (
          <p className="text-sm text-red-600">
            {errors.universityId?.message || errors.universityName?.message}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit(onSubmit)} disabled={creating || loading}>
          Siguiente
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const DegreeStep: React.FC<{
  onNext: (data: z.infer<typeof degreeSchema>) => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof degreeSchema>>({
    resolver: zodResolver(degreeSchema),
    defaultValues: {
      publicRequested: false,
    },
  });

  const onSubmit = (data: z.infer<typeof degreeSchema>) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 2: Carrera</h2>
        <p className="text-gray-600">Define el nombre de la carrera</p>
      </div>

      <div>
        <Label htmlFor="degreeName">Nombre de la carrera</Label>
        <Input
          id="degreeName"
          {...register('degreeName')}
          placeholder="Ej: Licenciatura en Ciencias de la Computación"
          aria-invalid={!!errors.degreeName}
        />
        {errors.degreeName && (
          <p className="text-sm text-red-600 mt-1">{errors.degreeName.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="publicRequested"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          {...register('publicRequested')}
        />
        <Label htmlFor="publicRequested">
          Quiero que esta carrera sea visible públicamente cuando sea aprobada
        </Label>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
        <Button type="button" onClick={handleSubmit(onSubmit)}>
          Siguiente
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const StructureStep: React.FC<{
  onSubmit: (data: z.infer<typeof structureSchema>) => void;
  onBack: () => void;
}> = ({ onSubmit, onBack }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof structureSchema>>({
    resolver: zodResolver(structureSchema),
    defaultValues: { years: 5, subjects: 12 },
  });

  const years = watch('years');
  const subjects = watch('subjects');

  const onFormSubmit = (data: z.infer<typeof structureSchema>) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 3: Estructura</h2>
        <p className="text-gray-600">Define la duración de la carrera</p>
      </div>

      <div>
        <Label htmlFor="years">Duración en años</Label>
        <Select
          id="years"
          {...register('years', { valueAsNumber: true })}
          error={!!errors.years}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
            <option key={y} value={y}>
              {y} {y === 1 ? 'año' : 'años'}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="subjects">Cantidad de materias</Label>
        <Input
          id="subjects"
          type="number"
          min={1}
          max={80}
          {...register('subjects', { valueAsNumber: true })}
          aria-invalid={!!errors.subjects}
        />
        {errors.subjects && (
          <p className="text-sm text-red-600 mt-1">{errors.subjects.message}</p>
        )}
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Vista previa</h3>
        <p className="text-blue-800">
          La carrera tendrá{' '}
          <strong>
            {years} {years === 1 ? 'año' : 'años'}
          </strong>{' '}
          y{' '}
          <strong>
            {subjects} {subjects === 1 ? 'materia' : 'materias'}
          </strong>
        </p>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
        <Button type="button" onClick={handleSubmit(onFormSubmit)}>
          <Check className="w-4 h-4" />
          Crear carrera
        </Button>
      </div>
    </div>
  );
};

const CreateDegreeWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const { setDegreeData, setSubjects, setElectivePools, setElectiveRules } = useDegree();
  const [formData, setFormData] = useState<Partial<DegreeData>>({});

  const handleUniversityNext = (data: z.infer<typeof universitySchema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleDegreeNext = (data: z.infer<typeof degreeSchema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  };

  const handleStructureSubmit = async (data: z.infer<typeof structureSchema>) => {
    const finalData = { ...formData, ...data } as DegreeData;
    const initialSubjects: CurriculumSubject[] = Array.from({ length: data.subjects }, (_, idx) => ({
      id: `subject-${idx + 1}`,
      name: `Materia ${idx + 1}`,
      year: null,
      prerequisites: [],
      isElective: false,
    }));

    await new Promise((r) => setTimeout(r, 500));

    setSubjects(initialSubjects);
    setElectivePools([]);
    setElectiveRules([]);
    setDegreeData(finalData);
    localStorage.setItem('degreeData', JSON.stringify(finalData));
    localStorage.setItem('degreeSubjects', JSON.stringify(initialSubjects));
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            {[1, 2, 3].map((s, idx) => (
              <React.Fragment key={s}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s === step
                      ? 'bg-blue-600 text-white scale-110'
                      : s < step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {idx < 2 && (
                  <div
                    className={`w-32 h-1 mx-2 transition-all ${
                      s < step ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === 1 && <UniversityStep onNext={handleUniversityNext} />}
        {step === 2 && <DegreeStep onNext={handleDegreeNext} onBack={() => setStep(1)} />}
        {step === 3 && <StructureStep onSubmit={handleStructureSubmit} onBack={() => setStep(2)} />}
      </Card>
    </div>
  );
};

export { CreateDegreeWizard };
