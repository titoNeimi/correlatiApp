'use client'
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { useUser } from '@/context/UserContext'
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
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginPageContent: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useUser()

  const getRedirectPath = (value: string | null) => {
    if (!value) return '/'
    if (!value.startsWith('/')) return '/'
    if (value.startsWith('//')) return '/'
    return value
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    setErrors(prev => ({ ...prev, [name]: undefined }));
    if (authError) setAuthError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setAuthError('');

    const newErrors: FormErrors = {};
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email) newErrors.email = 'Campo requerido';
    if (!password) newErrors.password = 'Campo requerido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const result = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!result.ok) {
        setAuthError('Usuario o contraseña incorrectos');
        return;
      }

      try {
        await refresh()
      } catch {
        window.location.reload()
        return
      }

      router.push(getRedirectPath(searchParams.get('next')));
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setAuthError('Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader />

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
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
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            errorMessage={errors.password}
          />

          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-indigo-600 text-sm font-medium hover:underline bg-transparent border-none cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <AuthSubmitButton isLoading={isLoading}>
            Iniciar Sesión
          </AuthSubmitButton>

          {authError && (
            <div className="mb-2 p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">
              {authError}
            </div>
          )}
        </form>

        <div className="text-center text-gray-600 text-sm">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer">
            Regístrate aquí
          </a>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};

const LoginFallback = () => (
  <AuthLayout>
    <AuthCard>
      <AuthHeader />
      <div className="py-8 text-center text-sm text-slate-600">Cargando login...</div>
    </AuthCard>
  </AuthLayout>
)

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
