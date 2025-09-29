import React from 'react';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

type fetchDegree = {
  count:number,
  data: [degreeProgram]
}

const fetchDegreePrograms = async (): Promise<fetchDegree | null> =>  {
  try {
    const result = await fetch("http://localhost:8080/degreeProgram")
    if(!result.ok){
      return null
    }
    const data = await result.json()
    console.log(data)
    return data
  } catch (error) {
    console.log(error)
    return null
  }
}



export async function CareersPage () {

  const colors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-red-50 border-red-200",
    "bg-yellow-50 border-yellow-200",
    "bg-purple-50 border-purple-200",
    "bg-pink-50 border-pink-200",
    "bg-indigo-50 border-indigo-200",
    "bg-orange-50 border-orange-200",
    "bg-teal-50 border-teal-200"
  ]

  const data = await fetchDegreePrograms()

  if(data == null){
    return(
      <div>
        Error
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Explora Nuestras Carreras
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre programas académicos de las mejores universidades y visualiza tu progreso académico de manera inteligente.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{data?.count}</h3>
              <p className="text-gray-600">Carreras Disponibles</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">8</h3>
              <p className="text-gray-600">Universidades</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {data.data.reduce((total, program) => total + (program.subjects ? program.subjects.length : 0), 0)}
              </h3>
              <p className="text-gray-600">Materias Totales</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data && data.data.map((program, i) => (
            <div
              key={program.id}
              className={`${colors[i]} rounded-2xl p-6 border-2 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/70 p-2 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-gray-700" />
                </div>
                <div className="bg-white/70 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-gray-700">
                    {program.subjects ? program.subjects.length : 0} materias
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
                {program.name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {program.university}
              </p>

              <div className="flex items-center justify-between">                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-sm font-medium text-gray-700">Ver detalles →</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/50">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Progreso promedio</span>
                  <span>30%</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `30%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">¿No encontraste tu carrera?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Estamos constantemente agregando nuevas carreras y universidades. 
              Contáctanos para sugerir la tuya.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200">
              Sugerir Carrera
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CareersPage;