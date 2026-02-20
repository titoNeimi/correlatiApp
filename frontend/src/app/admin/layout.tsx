'use client';

import { useState } from 'react';
import {Sidebar, Topbar} from '@/components/admin/admin_nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  return (
    <div className={isDarkTheme ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div
          className={`transition-all duration-300 ease-out ${
            isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
          }`}
        >
          <Topbar
            isDark={isDarkTheme}
            onThemeToggle={() => setIsDarkTheme(!isDarkTheme)}
            onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          <main
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
