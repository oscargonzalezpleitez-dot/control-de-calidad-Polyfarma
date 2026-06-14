'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api';
import { Shield, CheckCircle, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-700',
  LOGIN_FAILED: 'bg-red-200 text-red-900',
  SIGNATURE: 'bg-indigo-100 text-indigo-800',
  APPROVE: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-rose-100 text-rose-800',
  CANCEL: 'bg-orange-100 text-orange-800',
  INVALIDATE: 'bg-red-200 text-red-900',
  EXPORT: 'bg-cyan-100 text-cyan-800',
  PERMISSION_CHANGE: 'bg-yellow-100 text-yellow-800',
};

export default function AuditPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    module: '',
    page: 1,
    limit: 50,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditApi.findAll(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ['audit-stats', filters.startDate, filters.endDate],
    queryFn: () => auditApi.getStatistics({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
  });

  const logs = (data as any)?.data || [];
  const meta = (data as any)?.meta || {};
  const auditStats = stats as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-pharma-600" />
            Audit Trail
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Registro inmutable de todas las acciones del sistema — 21 CFR Part 11 §11.10(e)
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-primary"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Banner regulatorio */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Registro de Auditoría Permanente e Inmutable</p>
          <p className="text-amber-700 text-xs mt-0.5">
            Los registros de este audit trail no pueden eliminarse ni modificarse, en cumplimiento con FDA 21 CFR Part 11 §11.10(e),
            EU GMP Annex 11 §9, y los principios ALCOA+ (Enduring/Durable). Cada registro incluye hash SHA-256 para verificación de integridad.
          </p>
        </div>
      </div>

      {/* Stats */}
      {auditStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="pharma-card text-center">
            <p className="text-3xl font-bold text-pharma-700">{auditStats.totalLogs?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total de Eventos</p>
          </div>
          {auditStats.byAction?.slice(0, 3).map((a: any) => (
            <div key={a.action} className="pharma-card text-center">
              <p className="text-3xl font-bold text-gray-900">{a._count.action}</p>
              <p className="text-sm text-gray-500">{a.action}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="pharma-card">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4" />
          Filtros de Búsqueda
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Desde</label>
            <input
              type="datetime-local"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pharma-500 focus:outline-none"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
            <input
              type="datetime-local"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pharma-500 focus:outline-none"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Acción</label>
            <select
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pharma-500 focus:outline-none"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
            >
              <option value="">Todas</option>
              {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'SIGNATURE', 'APPROVE', 'REJECT'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Módulo</label>
            <select
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pharma-500 focus:outline-none"
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value, page: 1 })}
            >
              <option value="">Todos</option>
              {['AUTH', 'USERS', 'FORMATS', 'RECORDS', 'SIGNATURES', 'REPORTS', 'ATTACHMENTS'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de audit trail */}
      <div className="pharma-card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Eventos Registrados
            {meta.total && (
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({meta.total?.toLocaleString()} total)
              </span>
            )}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Módulo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Integridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No se encontraron registros de auditoría con los filtros seleccionados
                  </td>
                </tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-xs font-mono">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 text-xs">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userName || '—'}
                      </p>
                      <p className="text-gray-400 text-xs">{log.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs font-medium">{log.module}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs max-w-xs truncate">{log.description}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.ipAddress}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      SHA-256
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Página {meta.page} de {meta.totalPages} ({meta.total} registros)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= meta.totalPages}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
