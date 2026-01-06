'use client';
import Link from 'next/link';

export default function Forbidden() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">403</h1>
        <p className="text-2xl font-semibold text-gray-600 mb-2">
          Acceso Prohibido
        </p>
        <p className="text-gray-500 mb-8">
          No tienes permiso para acceder a este recurso.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}