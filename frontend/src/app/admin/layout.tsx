'use client';

import { useState, useRef, useEffect } from 'react';
import {Sidebar, Topbar} from '@/components/admin/admin_nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [hasScrollShadow, setHasScrollShadow] = useState(false);

  // Effect para manejar la sombra del topbar al scrollear
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const handleScroll = () => {
      setHasScrollShadow(mainContent.scrollTop > 10);
    };

    mainContent.addEventListener('scroll', handleScroll);
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={isDarkTheme ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Sidebar
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div
          className={`transition-all duration-300 ease-out ${
            isSidebarCollapsed ? 'ml-20' : 'ml-72'
          }`}
        >
          <Topbar 
            isDark={isDarkTheme} 
            onThemeToggle={() => setIsDarkTheme(!isDarkTheme)}
          />

          <main
            ref={mainContentRef}
            className="p-4 lg:p-6 overflow-y-auto"
            style={{ height: 'calc(100vh - 73px)' }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}