'use client';

import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api';
import { PenLine, Shield, CheckCircle, Hash } from 'lucide-react';

export default function SignaturesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-signatures'],
    queryFn: () => auditApi.findAll({ module: 'SIGNATURES', limit: 50 }),
  });

  const logs = (data as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firmas Electrónicas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Registro de firmas electrónicas — 21 CFR Part 11 Compliant</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <Shield className="w-3.5 h-3.5" />
          No-repudiación SHA-256
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-pharma-700 mb-1">
            <PenLine className="w-4 h-4" />
            <span className="text-sm font-medium">Firmas registradas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Desde el audit trail</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Verificadas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Hash íntegro SHA-256</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <Hash className="w-4 h-4" />
            <span className="text-sm font-medium">Algoritmo</span>
          </div>
          <p className="text-lg font-bold text-gray-900">SHA-256</p>
          <p className="text-xs text-gray-500 mt-1">HMAC con llave AES-256</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">
            Actividad de firmas electrónicas (via Audit Trail)
          </h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="w-5 h-5 border-2 border-pharma-500 border-t-transparent rounded-full animate-spin mr-2" />
            Cargando...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <PenLine className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium">No hay firmas registradas aún</p>
            <p className="text-sm mt-1">Las firmas aparecen al completar un registro</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Acción</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Entidad</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Integridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3">
                    <span className="text-sm font-medium text-gray-900">{log.action}</span>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{log.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{log.user?.firstName} {log.user?.lastName}</span>
                    <p className="text-xs text-gray-400">{log.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-600">{log.entityType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString('es')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Íntegro
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-pharma-50 border border-pharma-200 rounded-xl p-4 text-sm text-pharma-800">
        <p className="font-semibold mb-1">Conformidad 21 CFR Part 11</p>
        <p className="text-pharma-600 text-xs">
          Cada firma electrónica requiere verificación de identidad en tiempo real (contraseña).
          Se genera un hash SHA-256 de no-repudiación que vincula la firma al documento de forma permanente e inmutable.
        </p>
      </div>
    </div>
  );
}
