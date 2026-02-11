'use client'
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AuthLayout,
  AuthCard,
  AuthHeader,
  AuthField,
  AuthSubmitButton,
} from '@/components/auth/auth'

interface FormData {
  email: string;
  password: string;
  password2: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  password2?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    password2: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    setErrors(prev => ({ ...prev, [name]: undefined }));
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');

    const newErrors: FormErrors = {};
    const email = formData.email.trim();
    const password = formData.password.trim();
    const password2 = formData.password2.trim();

    if (!email) newErrors.email = 'Campo requerido';
    if (!password) newErrors.password = 'Campo requerido';
    if (!password2) newErrors.password2 = 'Campo requerido';

    if(password?.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres';

    if (!newErrors.password2 && password && password2 && password !== password2) {
      newErrors.password2 = 'Las contraseñas no coinciden';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();

      if (!resp.ok) {
        setSubmitError(data.error || "Error en el registro");
        return;
      }

      router.push('/login');
    } catch (err) {
      console.error('Error en registro:', err);
      setSubmitError('No se pudo completar el registro. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader />

        <form noValidate onSubmit={handleSubmit} className="space-y-3">
          <AuthField
            label="Correo Electrónico"
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            errorMessage={errors.email}
          />

          <AuthField
            label="Contraseña"
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            errorMessage={errors.password}
          />

          <AuthField
            label="Repetir contraseña"
            type="password"
            id="password2"
            name="password2"
            autoComplete="new-password"
            value={formData.password2}
            onChange={handleChange}
            errorMessage={errors.password2}
          />

          <AuthSubmitButton isLoading={isLoading}>
            Registrarse
          </AuthSubmitButton>

          {submitError && (
            <div className="mb-2 p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">
              {submitError}
            </div>
          )}
        </form>

        <div className="text-center text-gray-600 text-sm">
          ¿Ya tienes cuenta?{' '}
          <a
            href="/login"
            className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Inicia sesión aquí
          </a>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
