'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordsApi, formatsApi } from '@/lib/api';
import { ClipboardList, Plus, Eye, Layers, Trash2, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'status-draft',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'status-approved',
  UNDER_REVIEW: 'status-pending',
  APPROVED: 'bg-indigo-100 text-indigo-800',
  REJECTED: 'status-rejected',
  CANCELLED: 'status-cancelled',
  INVALIDATED: 'status-invalidated',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', IN_PROGRESS: 'En Progreso', COMPLETED: 'Completado',
  UNDER_REVIEW: 'En Revisión', APPROVED: 'Aprobado', REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado', INVALIDATED: 'Invalidado',
};

export default function RecordsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', formatId: '', page: 1, limit: 20 });
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState('');

  // Estado del modal de eliminación
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const closeDeleteModal = () => { setDeleteTarget(null); setDeleteReason(''); setDeletePassword(''); };

  const { data, isLoading } = useQuery({
    queryKey: ['records', filters],
    queryFn: () => recordsApi.findAll(filters),
  });

  const { data: formatsData } = useQuery({
    queryKey: ['formats-approved'],
    queryFn: () => formatsApi.findAll({ status: 'APPROVED', limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (formatId: string) => recordsApi.create({ formatId }),
    onSuccess: (data: any) => {
      toast.success('Registro creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      setShowNewRecord(false);
      router.push(`/records/${data.id}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => recordsApi.delete(deleteTarget!.id, deleteReason, deletePassword),
    onSuccess: () => {
      toast.success(`Registro ${deleteTarget?.code} eliminado`);
      queryClient.invalidateQueries({ queryKey: ['records'] });
      closeDeleteModal();
    },
    onError: (err: any) => toast.error(err.message ?? 'Contraseña incorrecta o sin permisos'),
  });

  const records = (data as any)?.data || [];
  const meta = (data as any)?.meta || {};
  const formats = (formatsData as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-pharma-600" />
            Registros
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Captura de datos electrónicos — ALCOA+ | Audit Trail automático
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/certificados-agua')}
            className="btn-secondary"
          >
            <Layers className="w-4 h-4" />
            Lote de Certificados
          </button>
          <button
            onClick={() => setShowNewRecord(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Modal nuevo registro */}
      {showNewRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Registro</h2>
            <p className="text-sm text-gray-500 mb-4">
              Seleccione el formato aprobado para crear el registro:
            </p>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-pharma-500 focus:outline-none"
              value={selectedFormatId}
              onChange={(e) => setSelectedFormatId(e.target.value)}
            >
              <option value="">Seleccione un formato...</option>
              {formats.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.code} — {f.name} (v{f.version})
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNewRecord(false); setSelectedFormatId(''); }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => selectedFormatId && createMutation.mutate(selectedFormatId)}
                disabled={!selectedFormatId || createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Registro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="pharma-card flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Estado</label>
          <select
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pharma-500 focus:outline-none"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">Todos</option>
            {Object.keys(STATUS_LABELS).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Formato</label>
          <select
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pharma-500 focus:outline-none"
            value={filters.formatId}
            onChange={(e) => setFilters({ ...filters, formatId: e.target.value, page: 1 })}
          >
            <option value="">Todos los formatos</option>
            {formats.map((f: any) => (
              <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="pharma-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Formato</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Elaborado por</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Campos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No se encontraron registros
                  </td>
                </tr>
              ) : records.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-pharma-700">
                    {record.code}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 text-xs">{record.format?.name}</p>
                      <p className="text-gray-400 text-xs">{record.format?.code} v{record.format?.version}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${STATUS_STYLES[record.status] || ''}`}>
                      {STATUS_LABELS[record.status] || record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {record.createdBy?.firstName} {record.createdBy?.lastName}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {format(new Date(record.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {record._count?.fieldValues || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/records/${record.id}`)}
                        className="btn-icon text-pharma-600 hover:text-pharma-800 hover:bg-pharma-50"
                        title="Ver/Editar registro"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: record.id, code: record.code })}
                        className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Página {meta.page} de {meta.totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= meta.totalPages}
                className="px-3 py-1 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de eliminación con contraseña ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">

              {/* Cabecera */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Eliminar registro</h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">{deleteTarget.code}</p>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                  Esta acción marca el registro como eliminado y queda registrada en el
                  <strong className="mx-1">Audit Trail</strong> de forma permanente. No se puede deshacer.
                  Se requiere contraseña de administrador para autorizar.
                </p>
              </div>

              {/* Motivo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Motivo de eliminación <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Describa el motivo (mínimo 10 caracteres)..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{deleteReason.length} / mín. 10 caracteres</p>
              </div>

              {/* Contraseña */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña del administrador <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deleteReason.length >= 10 && deletePassword)
                      deleteMutation.mutate();
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteReason.length < 10 || !deletePassword || deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Eliminando...</>
                    : <><Trash2 className="w-4 h-4" />Eliminar registro</>}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
