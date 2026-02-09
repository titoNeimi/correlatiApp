import React from 'react';
import { BookOpen, TrendingUp, Users, Star, ChevronRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Tu carrera universitaria
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                organizada y clara
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Descubre programas académicos, visualiza tu progreso en tiempo real y toma decisiones informadas 
              sobre tu futuro universitario con estadísticas detalladas.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href='/carreras' className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center">
              Explorar Carreras
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border-2 border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-blue-600 mb-3 group-hover:scale-110 transition-transform duration-300">500+</div>
                <div className="text-gray-700 font-semibold text-lg">Programas Académicos</div>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto mt-3"></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border-2 border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-purple-600 mb-3 group-hover:scale-110 transition-transform duration-300">50+</div>
                <div className="text-gray-700 font-semibold text-lg">Universidades</div>
                <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mx-auto mt-3"></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border-2 border-green-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300 group sm:col-span-2 lg:col-span-1">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-green-600 mb-3 group-hover:scale-110 transition-transform duration-300">10K+</div>
                <div className="text-gray-700 font-semibold text-lg">Estudiantes</div>
                <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mt-3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para tu carrera
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas diseñadas específicamente para estudiantes universitarios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl w-fit mb-6 group-hover:scale-105 transition-transform duration-300">
                  <BookOpen className="h-10 w-10 text-blue-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  Explorar Materias
                </h4>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  Visualiza todas las materias de tu carrera, sus requisitos y cómo se conectan entre sí.
                </p>
                <div className="w-full h-1 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl w-fit mb-6 group-hover:scale-105 transition-transform duration-300">
                  <TrendingUp className="h-10 w-10 text-purple-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                  Seguir tu Progreso
                </h4>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  Monitorea tu avance académico con estadísticas detalladas y visualizaciones claras.
                </p>
                <div className="w-full h-1 bg-gradient-to-r from-purple-200 to-purple-400 rounded-full mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300 group md:col-span-2 xl:col-span-1">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl w-fit mb-6 group-hover:scale-105 transition-transform duration-300">
                  <Users className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                  Comparar Universidades
                </h4>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  Compara programas académicos entre diferentes universidades para tomar la mejor decisión.
                </p>
                <div className="w-full h-1 bg-gradient-to-r from-green-200 to-green-400 rounded-full mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">
            Lo que dicen nuestros estudiantes
          </h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl text-gray-700 font-medium mb-8 leading-relaxed">
              &quot;AcadifyApp me ayudó a entender completamente mi plan de estudios. 
              Ahora puedo planificar mis semestres de manera eficiente y ver claramente mi progreso.&quot;
            </blockquote>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3">
                AM
              </div>
              <div className="text-gray-900 font-semibold">Ana Martínez</div>
              <div className="text-gray-600">Estudiante de Ingeniería - UBA</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Comienza a organizar tu carrera hoy
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a miles de estudiantes que ya están usando AcadifyApp para 
            planificar su futuro académico de manera inteligente.
          </p>
          <Link href='/register' className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            Registrarse Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">AcadifyApp</span>
            </div>
            <div className="flex space-x-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Soporte</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 AcadifyApp. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
