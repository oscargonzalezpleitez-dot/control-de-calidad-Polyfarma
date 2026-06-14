'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatsApi } from '@/lib/api';
import { FileText, Search, AlertCircle, Archive, X } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente Aprobación',
  APPROVED: 'Aprobado',
  OBSOLETE: 'Obsoleto',
  REJECTED: 'Rechazado',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  OBSOLETE: 'bg-orange-100 text-orange-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
  SOP: 'SOP',
  BATCH_RECORD: 'Registro de Lote',
  QUALITY_CONTROL: 'Control de Calidad',
  DEVIATION: 'Desviación',
  CAPA: 'CAPA',
  VALIDATION: 'Validación',
  AUDIT: 'Auditoría',
  GENERAL: 'General',
};

export default function FormatsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [obsoleteTarget, setObsoleteTarget] = useState<{ id: string; code: string } | null>(null);
  const [obsoleteReason, setObsoleteReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['formats', statusFilter, page],
    queryFn: () => formatsApi.findAll({ status: statusFilter || undefined, page, limit: 20 }),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => formatsApi.submitForApproval(id),
    onSuccess: () => {
      toast.success('Formato enviado para aprobación');
      queryClient.invalidateQueries({ queryKey: ['formats'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const obsoleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      formatsApi.obsolete(id, reason),
    onSuccess: () => {
      toast.success('Formato marcado como obsoleto');
      queryClient.invalidateQueries({ queryKey: ['formats'] });
      setObsoleteTarget(null);
      setObsoleteReason('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const formats = (data as any)?.data || [];
  const meta = (data as any)?.meta || {};
  const filtered = formats.filter((f: any) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formatos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de plantillas de captura de datos GxP</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-6 h-6 border-2 border-pharma-500 border-t-transparent rounded-full animate-spin mr-2" />
            Cargando formatos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium">No hay formatos</p>
            <p className="text-sm mt-1">Aún no existen formatos registrados en el sistema</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Código / Nombre</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Versión</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Registros</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((format: any) => (
                <tr key={format.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{format.code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{format.name}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-600">{TYPE_LABELS[format.type] || format.type}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono text-gray-700">v{format.version}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[format.status]}`}>
                      {STATUS_LABELS[format.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">{format._count?.records ?? 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {format.status === 'DRAFT' && (
                        <button
                          onClick={() => submitMutation.mutate(format.id)}
                          className="inline-flex items-center gap-1.5 text-xs bg-pharma-600 text-white px-3 py-1.5 rounded-lg hover:bg-pharma-700 active:bg-pharma-800 active:scale-95 shadow-sm hover:shadow-md transition-all duration-150 font-semibold"
                        >
                          Enviar a Aprobación
                        </button>
                      )}
                      {format.status === 'APPROVED' && (
                        <button
                          onClick={() => { setObsoleteTarget({ id: format.id, code: format.code }); setObsoleteReason(''); }}
                          className="inline-flex items-center gap-1.5 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 active:bg-orange-700 active:scale-95 shadow-sm hover:shadow-md transition-all duration-150 font-semibold"
                        >
                          Obsoleto
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Página {meta.page} de {meta.totalPages} ({meta.total} formatos)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= meta.totalPages}
                className="px-3 py-1 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Flujo de aprobación GxP</p>
          <p className="text-blue-600 mt-0.5">BORRADOR → Enviar a Aprobación → APROBADO → Usar en Registros</p>
        </div>
      </div>

      {/* Modal de obsolescencia */}
      {obsoleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Marcar como Obsoleto</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{obsoleteTarget.code}</p>
                </div>
                <button onClick={() => setObsoleteTarget(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex gap-2">
                <Archive className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700">El formato quedará archivado. No se podrán crear nuevos registros con él, pero los existentes se conservan.</p>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Motivo de obsolescencia <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={obsoleteReason}
                  onChange={(e) => setObsoleteReason(e.target.value)}
                  placeholder="Describa el motivo (mínimo 10 caracteres)..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{obsoleteReason.length} / mín. 10 caracteres</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setObsoleteTarget(null); setObsoleteReason(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => obsoleteMutation.mutate({ id: obsoleteTarget.id, reason: obsoleteReason })}
                  disabled={obsoleteReason.length < 10 || obsoleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 transition flex items-center justify-center gap-2"
                >
                  {obsoleteMutation.isPending
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Procesando...</>
                    : <><Archive className="w-4 h-4" />Confirmar Obsolescencia</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
