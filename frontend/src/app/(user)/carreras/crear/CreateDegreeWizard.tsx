'use client'
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { MOCK_UNIVERSITIES } from '@/lib/mocks';
import { useDegree } from './degree-context';
import { DegreeData } from './(types)/types';
import { Button, Input, Label, Select, Card } from './(components)';

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
});

const structureSchema = z.object({
  years: z.number().min(1).max(8),
});

const UniversityStep: React.FC<{
  onNext: (data: z.infer<typeof universitySchema>) => void;
}> = ({ onNext }) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');
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

  const handleModeChange = (newMode: 'select' | 'create') => {
    setMode(newMode);

    if (newMode === 'select') {
      setValue('universityName', '');
    } else {
      setValue('universityId', '');
    }

    clearErrors(['universityId', 'universityName']);
  };

  const onSubmit = (data: z.infer<typeof universitySchema>) => {
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

        {mode === 'select' ? (
          <div>
            <Label htmlFor="universityId">Universidad</Label>
            <Select {...register('universityId')} error={!!errors.universityId}>
              <option value="">Seleccione...</option>
              {MOCK_UNIVERSITIES.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div>
            <Label htmlFor="universityName">Nombre de la nueva universidad</Label>
            <Input
              {...register('universityName')}
              placeholder="Ej: Universidad Nacional de..."
              error={!!errors.universityName}
            />
          </div>
        )}

        {(errors.universityId || errors.universityName) && (
          <p className="text-sm text-red-600">
            {errors.universityId?.message || errors.universityName?.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit(onSubmit)}>
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
          {...register('degreeName')}
          placeholder="Ej: Licenciatura en Ciencias de la Computación"
          error={!!errors.degreeName}
        />
        {errors.degreeName && (
          <p className="text-sm text-red-600 mt-1">{errors.degreeName.message}</p>
        )}
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
    defaultValues: { years: 5 },
  });

  const years = watch('years');

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
        <Select {...register('years', { valueAsNumber: true })} error={!!errors.years}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
            <option key={y} value={y}>
              {y} {y === 1 ? 'año' : 'años'}
            </option>
          ))}
        </Select>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Vista previa</h3>
        <p className="text-blue-800">
          La carrera tendrá <strong>{years} {years === 1 ? 'año' : 'años'}</strong>
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
  const { setDegreeData } = useDegree();
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

    await new Promise((r) => setTimeout(r, 500));

    setDegreeData(finalData);
    localStorage.setItem('degreeData', JSON.stringify(finalData));
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
