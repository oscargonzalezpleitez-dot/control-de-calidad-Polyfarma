'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { recordsApi, reportsApi } from '@/lib/api';
import { FileBarChart, Download, FileText, Table, FileType, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FORMAT_CONFIG = {
  PDF: { icon: FileText, label: 'PDF', color: 'text-red-600 bg-red-50 border-red-200', description: 'Reporte con firmas y hash SHA-256' },
  XLSX: { icon: Table, label: 'Excel', color: 'text-green-600 bg-green-50 border-green-200', description: 'Datos para análisis estadístico' },
  DOCX: { icon: FileType, label: 'Word', color: 'text-blue-600 bg-blue-50 border-blue-200', description: 'Documento para revisión y firma' },
};

async function downloadReport(id: string, name: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${API_URL}/api/v1/reports/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) { toast.error('Error al descargar el reporte'); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name || `reporte-${id}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [selectedRecord, setSelectedRecord] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'XLSX' | 'DOCX'>('PDF');
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  const [generatedReportName, setGeneratedReportName] = useState<string>('');

  const { data: recordsData, isLoading: loadingRecords } = useQuery({
    queryKey: ['records-completed'],
    queryFn: () => recordsApi.findAll({ status: 'COMPLETED' as any }),
  });

  const { data: reportsData, isLoading: loadingReports, refetch } = useQuery({
    queryKey: ['reports-list'],
    queryFn: () => reportsApi.findAll(),
  });

  const generateMutation = useMutation({
    mutationFn: () => reportsApi.generate({ recordId: selectedRecord, format: selectedFormat }),
    onSuccess: (data: any) => {
      const report = data?.data ?? data;
      setGeneratedReportId(report?.id);
      setGeneratedReportName(report?.name || `reporte.${selectedFormat.toLowerCase()}`);
      toast.success(`Reporte ${selectedFormat} generado correctamente`);
      refetch();
    },
    onError: (e: any) => toast.error(e.message || 'Error al generar reporte'),
  });

  const records = (recordsData as any)?.data || [];
  const reports = (reportsData as any)?.data || (Array.isArray(reportsData) ? reportsData : []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-0.5">Generación de reportes GxP en PDF, Excel y Word</p>
      </div>

      {/* Generador */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-pharma-600" />
          Generar Nuevo Reporte
        </h2>

        <div className="space-y-4">
          {/* Selección de registro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Registro a Reportar
            </label>
            <select
              value={selectedRecord}
              onChange={(e) => setSelectedRecord(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500"
              disabled={loadingRecords}
            >
              <option value="">
                {loadingRecords ? 'Cargando registros completados...' : 'Selecciona un registro completado...'}
              </option>
              {records.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.format?.name}
                </option>
              ))}
            </select>
            {!loadingRecords && records.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No hay registros completados. Completa un registro primero.</p>
            )}
          </div>

          {/* Selección de formato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Formato de Exportación</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(FORMAT_CONFIG) as [keyof typeof FORMAT_CONFIG, typeof FORMAT_CONFIG['PDF']][]).map(([fmt, config]) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                    selectedFormat === fmt
                      ? `${config.color} border-current`
                      : 'border-gray-200 hover:border-gray-300 text-gray-500'
                  }`}
                >
                  <config.icon className="w-6 h-6" />
                  <span className="text-sm font-semibold">{config.label}</span>
                  <span className="text-xs text-center opacity-70">{config.description}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => generateMutation.mutate()}
            disabled={!selectedRecord || generateMutation.isPending}
            className="btn-primary"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generando...</>
            ) : (
              <><FileBarChart className="w-4 h-4" />Generar Reporte</>
            )}
          </button>

          {generatedReportId && (
            <button
              onClick={() => downloadReport(generatedReportId, generatedReportName)}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Descargar Reporte
            </button>
          )}
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Historial de Reportes</h2>
        </div>
        {loadingReports ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />Cargando...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileBarChart className="w-10 h-10 mb-3 opacity-40" />
            <p>No hay reportes generados aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Reporte</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Formato</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Generado</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{r.name || r.fileName || 'Reporte'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">{r.id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-semibold text-gray-600">{r.format}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      r.status === 'GENERATING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {r.status === 'COMPLETED' ? 'Completado' : r.status === 'GENERATING' ? 'Generando' : r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-500">
                      {r.generatedAt ? new Date(r.generatedAt).toLocaleString('es') : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'COMPLETED' && (
                      <button
                        onClick={() => downloadReport(r.id, r.name || r.fileName || `reporte-${r.id}`)}
                        className="inline-flex items-center gap-1 text-xs text-pharma-600 hover:text-pharma-800 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
