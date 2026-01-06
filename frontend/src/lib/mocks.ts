const MOCK_UNIVERSITIES = [
  { id: 'uba', name: 'Universidad de Buenos Aires' },
  { id: 'unlp', name: 'Universidad Nacional de La Plata' },
  { id: 'unc', name: 'Universidad Nacional de Córdoba' },
  { id: 'utm', name: 'Universidad Tecnológica de México' },
];

const MOCK_SUBJECTS = [
  { id: 'mat1', name: 'Análisis Matemático I', prerequisites: [] },
  { id: 'mat2', name: 'Álgebra Lineal', prerequisites: [] },
  { id: 'fis1', name: 'Física I', prerequisites: [] },
  { id: 'prog1', name: 'Programación I', prerequisites: [] },
  { id: 'prog2', name: 'Programación II', prerequisites: [] },
  { id: 'bd', name: 'Bases de Datos', prerequisites: [] },
  { id: 'algo', name: 'Algoritmos y Estructuras', prerequisites: [] },
  { id: 'arq', name: 'Arquitectura de Computadoras', prerequisites: [] },
  { id: 'so', name: 'Sistemas Operativos', prerequisites: [] },
  { id: 'redes', name: 'Redes de Computadoras', prerequisites: [] },
  { id: 'ing-soft', name: 'Ingeniería de Software', prerequisites: [] },
  { id: 'ia', name: 'Inteligencia Artificial', prerequisites: [] },
];

export {MOCK_SUBJECTS, MOCK_UNIVERSITIES}