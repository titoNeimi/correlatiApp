'use client'
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { useUser } from '@/context/UserContext'
import {
  AuthLayout,
  AuthCard,
  AuthHeader,
  AuthField,
  AuthSubmitButton,
  AuthDivider,
  AuthSocialButton,
} from '@/components/auth/auth'

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
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
    console.log(email, password);

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

  const handleGoogleLogin = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    console.log('Inicio de sesión con Google próximamente');
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
              href="/resetPassword"
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

        <AuthDivider />

        <div className="mb-8">
          <AuthSocialButton
            onClick={handleGoogleLogin}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
          >
            Continuar con Google
          </AuthSocialButton>
        </div>

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

export default LoginPage;
