'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, FileText, ClipboardList, FileBarChart,
  Shield, Users, PenLine, LogOut, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['*'] },
  { name: 'Formatos', href: '/formats', icon: FileText, roles: ['ADMIN', 'QUALITY', 'REGULATORY_AFFAIRS'] },
  { name: 'Registros', href: '/records', icon: ClipboardList, roles: ['*'] },
  { name: 'Firmas Electrónicas', href: '/signatures', icon: PenLine, roles: ['*'] },
  { name: 'Reportes', href: '/reports', icon: FileBarChart, roles: ['*'] },
  { name: 'Audit Trail', href: '/audit', icon: Shield, roles: ['ADMIN', 'QUALITY', 'AUDITOR'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const canAccess = (roles: string[]) => {
    if (roles.includes('*')) return true;
    return roles.includes(user?.role || '');
  };

  return (
    <aside className="flex flex-col w-64 bg-pharma-950 h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex flex-col items-center px-5 py-4 border-b border-pharma-900">
        <Image
          src="/logo-polyfarma.jpg"
          alt="Laboratorios PolyFarma"
          width={140}
          height={90}
          className="rounded-lg object-contain"
          priority
        />
        <p className="text-pharma-400 text-[10px] leading-tight mt-2 text-center">Lab. Control de Calidad</p>
        <p className="text-pharma-600 text-[10px] leading-tight mt-0.5 text-center font-medium">Lic. Oscar Gonzalez</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-pharma-700 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
          Módulos
        </p>
        <div className="space-y-0.5">
          {navigation.filter((item) => canAccess(item.roles)).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group',
                  isActive
                    ? 'bg-pharma-600 text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                )}
              >
                <item.icon className={clsx('w-4 h-4 flex-shrink-0 transition-colors', isActive ? 'text-white' : 'text-gray-500 group-hover:text-pharma-400')} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer del sidebar - Info usuario */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-pharma-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ring-2 ring-pharma-800">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-gray-500 text-[10px] truncate uppercase tracking-wide">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 w-full text-gray-500 hover:text-white text-xs transition-all duration-150 px-2 py-2 rounded-lg hover:bg-pharma-700 group"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:text-white" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
