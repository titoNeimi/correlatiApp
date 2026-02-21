'use client'

import { useState } from 'react';
import { ChevronDown, User, LogOut, Settings, GraduationCap, CircleUserRound, ShieldUser, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext'

export function Navbar(){

  const { user: ctxUser, isLoggedIn, logout } = useUser()
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = ctxUser ? { name: ctxUser.email.split('@')[0], email: ctxUser.email, role: ctxUser.role} : null

  return(
    <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </Link>
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AcadifyApp
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Inicio</Link>
              <Link href="/carreras" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Carreras</Link>
              <Link href="/universidades" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Universidades</Link>
              <Link href="/sugerencias" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Sugerencias</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            {!isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="hidden md:block text-gray-600 hover:text-blue-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm sm:text-base"
                >
                  Registrarse
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CircleUserRound className="w-8 h-8"/>
                  <span className="hidden sm:block text-gray-700 font-medium">{user?.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/mis-carreras"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Mis carreras</span>
                      </Link>
                      {/* <Link
                        href="/perfil"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Mi Perfil</span>
                      </Link>
                      
                      <Link
                        href="/configuracion"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configuración</span>
                      </Link> */}
                      {user?.role == 'admin' ? 
                        <Link
                          href="/admin"
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <ShieldUser className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      :
                        <></>
                      }
                    </div>
                    
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await logout()
                          window.location.href = '/'
                        }}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {dropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                )}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-100 bg-white/95 backdrop-blur-sm">
          <nav className="max-w-7xl mx-auto px-4 py-2 flex flex-col">
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-3 py-2.5 rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
            <Link href="/carreras" className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-3 py-2.5 rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>Carreras</Link>
            <Link href="/universidades" className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-3 py-2.5 rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>Universidades</Link>
            <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-3 py-2.5 rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>Contacto</Link>
            {!isLoggedIn && (
              <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-3 py-2.5 rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>Iniciar Sesión</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
