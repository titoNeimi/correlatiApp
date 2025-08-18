import { GraduationCap } from "lucide-react";
import Link from "next/link";

export function Navbar(){
  return(
    <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </Link>
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CorrelatiApp
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Inicio</Link>
            <Link href="/carreras" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Carreras</Link>
            <Link href="/universidades" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Universidades</Link>
            <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Contacto</Link>
          </nav>
        </div>
      </div>
    </header>
  )
}