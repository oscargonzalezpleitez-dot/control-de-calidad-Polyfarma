'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layout/sidebar';
import { Bell, Search, LogOut, User, Shield, ChevronDown } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar registros, formatos..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharma-600 focus:border-transparent transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-icon relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pharma-600 rounded-full" />
            </button>
            {/* Menú de usuario */}
            <div className="relative pl-3 border-l border-gray-200" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-all duration-150 group"
              >
                <div className="w-8 h-8 bg-pharma-600 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-pharma-100 flex-shrink-0">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">{user?.role}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  {/* Encabezado del usuario */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pharma-600 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-pharma-100">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-pharma-100 text-pharma-700 text-[10px] rounded-full font-semibold uppercase tracking-wide">
                          <Shield className="w-2.5 h-2.5" />
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="py-1.5">
                    <div className="px-4 py-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Cuenta</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <div className="text-left">
                        <p className="font-medium">Mi Perfil</p>
                        <p className="text-xs text-gray-400">{user?.department || 'Control de Calidad'}</p>
                      </div>
                    </button>
                  </div>

                  {/* Separador + Cerrar Sesión */}
                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-pharma-700 hover:bg-pharma-50 transition-colors group"
                    >
                      <LogOut className="w-4 h-4 text-pharma-500 group-hover:text-pharma-700" />
                      <span className="font-semibold">Cerrar Sesión</span>
                    </button>
                  </div>

                  {/* Footer GxP */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 text-center">
                      Sesión auditada · 21 CFR Part 11
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* Footer de cumplimiento */}
        <footer className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
          <span className="font-medium text-gray-500">Laboratorio de Control de Calidad Polyfarma v1.0.0 — By Lic. Oscar Gonzalez</span>
          <span>FDA 21 CFR Part 11 | EU GMP Annex 11 | GAMP 5 | ALCOA+</span>
        </footer>
      </div>
    </div>
  );
}
