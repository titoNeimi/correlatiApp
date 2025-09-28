'use client'
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

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
      const result = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!result.ok) {
        setAuthError('Usuario o contraseña incorrectos');
        return;
      }

      router.push('/');
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
    <div className="min-h-3/4 bg-white flex items-center justify-center p-5">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-300 hover:shadow-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">CorrelatiApp</h1>
          <p className="text-gray-500 text-sm">Gestiona tu progreso académico</p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 font-semibold mb-2 text-sm">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold mb-2 text-sm">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div className="text-right">
            <a
              href="/resetPassword"
              className="text-indigo-600 text-sm font-medium hover:underline bg-transparent border-none cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-4 rounded-xl text-lg font-semibold transition-all duration-300 relative overflow-hidden ${
              isLoading ? 'opacity-80 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300'
            }`}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <span className={isLoading ? 'opacity-0' : 'opacity-100'}>Iniciar Sesión</span>
          </button>

            {authError && (
              <div className="mb-2 p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">
                {authError}
              </div>
            )}
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">o continúa con</span>
          </div>
        </div>

        <div className="mb-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-all duration-300 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md bg-white cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        </div>

        <div className="text-center text-gray-600 text-sm">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer">
            Regístrate aquí
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
