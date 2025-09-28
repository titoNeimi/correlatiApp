'use client'
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

    // limpia el error del campo y el error global al tipear
    setErrors(prev => ({ ...prev, [name]: undefined }));
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');

    // 1) Validaciones locales (requeridos + match de contraseñas)
    const newErrors: FormErrors = {};
    const email = formData.email.trim();
    const password = formData.password.trim();
    const password2 = formData.password2.trim();

    if (!email) newErrors.email = 'Campo requerido';
    if (!password) newErrors.password = 'Campo requerido';
    if (!password2) newErrors.password2 = 'Campo requerido';

    if (!newErrors.password2 && password && password2 && password !== password2) {
      newErrors.password2 = 'Las contraseñas no coinciden';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // no continúa si hay errores
    }

    setErrors({});
    setIsLoading(true);

    // 2) Llamada al backend
    try {
      const resp = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!resp.ok) {
        // Podés diferenciar por status (e.g., 409 email en uso)
        setSubmitError('No se pudo completar el registro. Inténtalo nuevamente.');
        return;
      }

      // Registro OK: redirige a login (o a donde prefieras)
      router.push('/login');
    } catch (err) {
      console.error('Error en registro:', err);
      setSubmitError('No se pudo completar el registro. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    console.log('handle Google Login');
  };

  return (
    <div className="min-h-3/4 bg-white flex items-center justify-center p-5">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-300 hover:shadow-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">CorrelatiApp</h1>
          <p className="text-gray-500 text-sm">Gestiona tu progreso académico</p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-3">
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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="password2" className="block text-gray-700 font-semibold mb-2 text-sm">
              Repetir contraseña
            </label>
            <input
              type="password"
              id="password2"
              name="password2"
              autoComplete="new-password"
              value={formData.password2}
              onChange={handleChange}
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                errors.password2 ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {errors.password2 && <p className="text-red-500 text-xs mt-1">{errors.password2}</p>}
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
            <span className={isLoading ? 'opacity-0' : 'opacity-100'}>Registrarse</span>
          </button>

          {submitError && (
            <div className="mb-2 p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">
              {submitError}
            </div>
          )}

        </form>

        <div className="relative my-4">
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
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
        </div>

        <div className="text-center text-gray-600 text-sm">
          ¿Ya tienes cuenta?{' '}
          <a
            href="/login"
            className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Inicia sesión aquí
          </a>
        </div>
      </div>
    </div>
  );
}
