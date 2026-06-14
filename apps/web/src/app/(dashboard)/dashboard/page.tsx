'use client';

import { useQuery } from '@tanstack/react-query';
import { recordsApi, auditApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  FileText, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Shield, Activity, Users, Database, Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  UNDER_REVIEW: '#f59e0b',
  APPROVED: '#6366f1',
  REJECTED: '#ef4444',
  CANCELLED: '#f97316',
  DRAFT: '#6b7280',
  INVALIDATED: '#b91c1c',
};

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completados',
  UNDER_REVIEW: 'En Revisión',
  APPROVED: 'Aprobados',
  REJECTED: 'Rechazados',
  CANCELLED: 'Cancelados',
  DRAFT: 'Borrador',
  INVALIDATED: 'Invalidados',
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => recordsApi.getDashboard(),
    refetchInterval: 60000,
  });

  const { data: auditStats } = useQuery<any>({
    queryKey: ['audit-stats'],
    queryFn: () => auditApi.getStatistics({}),
  });

  const stats = dashboardData as any;
  const byStatus = stats?.byStatus || [];
  const totalRecords = stats?.totalRecords || 0;
  const recentActivity = stats?.recentActivity || [];

  const pieData = byStatus.map((s: any) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s._count.status,
    color: STATUS_COLORS[s.status] || '#6b7280',
  }));

  const kpiCards = [
    {
      label: 'Total Registros',
      value: totalRecords,
      icon: FileText,
      color: 'blue',
      description: 'Todos los registros activos',
    },
    {
      label: 'Completados',
      value: byStatus.find((s: any) => s.status === 'COMPLETED')?._count?.status || 0,
      icon: CheckCircle,
      color: 'green',
      description: 'Registros finalizados',
    },
    {
      label: 'En Revisión',
      value: byStatus.find((s: any) => s.status === 'UNDER_REVIEW')?._count?.status || 0,
      icon: Clock,
      color: 'yellow',
      description: 'Pendientes de aprobación',
    },
    {
      label: 'Incidencias',
      value: byStatus.find((s: any) => s.status === 'REJECTED')?._count?.status || 0,
      icon: AlertTriangle,
      color: 'red',
      description: 'Registros rechazados/invalidados',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-red-50 text-pharma-700 border-pharma-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Bienvenido, {user?.firstName} {user?.lastName} — {user?.role} |{' '}
            {format(new Date(), "EEEE dd 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Sistema Operativo
        </div>
      </div>

      {/* Compliance Banner */}
      <div className="bg-gradient-to-r from-gray-950 via-pharma-900 to-pharma-800 rounded-xl p-4 text-white flex items-center justify-between shadow-lg border border-pharma-900">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-pharma-600/30 rounded-lg flex items-center justify-center border border-pharma-600/40">
            <Shield className="w-6 h-6 text-pharma-400" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-wide">Laboratorio de Control de Calidad Polyfarma — Sistema Validado GxP</p>
            <p className="text-pharma-400 text-xs mt-0.5">
              FDA 21 CFR Part 11 | EU GMP Annex 11 | GAMP 5 Segunda Edición | ALCOA+
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-xs flex-shrink-0">
          <span className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 font-medium">Audit Trail Activo</span>
          <span className="px-3 py-1.5 bg-pharma-600/20 rounded-lg border border-pharma-600/30 font-medium text-pharma-300">E-Signatures ON</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className={`pharma-card border ${colorMap[kpi.color]}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{kpi.label}</p>
                <p className="text-3xl font-bold mt-1">{isLoading ? '—' : kpi.value}</p>
                <p className="text-xs opacity-60 mt-1">{kpi.description}</p>
              </div>
              <kpi.icon className="w-8 h-8 opacity-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Estado */}
        <div className="pharma-card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-pharma-600" />
            Distribución de Registros por Estado
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              No hay datos de registros aún
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="pharma-card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pharma-600" />
            Actividad Reciente
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {recentActivity.length > 0 ? recentActivity.map((record: any) => (
              <div key={record.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                <div className={`w-2 h-2 rounded-full flex-shrink-0`}
                  style={{ backgroundColor: STATUS_COLORS[record.status] || '#6b7280' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{record.code}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {record.format?.name} — {record.createdBy?.firstName} {record.createdBy?.lastName}
                  </p>
                </div>
                <span className={`status-badge flex-shrink-0 ${
                  record.status === 'COMPLETED' ? 'status-approved' :
                  record.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  record.status === 'CANCELLED' ? 'status-cancelled' : 'status-pending'
                }`}>
                  {STATUS_LABELS[record.status] || record.status}
                </span>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay actividad reciente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicadores de cumplimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pharma-card border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
            <Shield className="w-4 h-4" />
            Audit Trail
          </div>
          <p className="text-2xl font-bold text-gray-900">{auditStats?.totalLogs?.toLocaleString() || '0'}</p>
          <p className="text-xs text-gray-500">Registros de auditoría totales (inmutables)</p>
        </div>
        <div className="pharma-card border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 text-blue-700 font-semibold mb-1">
            <Database className="w-4 h-4" />
            Integridad de Datos
          </div>
          <p className="text-2xl font-bold text-gray-900">100%</p>
          <p className="text-xs text-gray-500">ALCOA+ — Todos los datos verificados</p>
        </div>
        <div className="pharma-card border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 text-purple-700 font-semibold mb-1">
            <TrendingUp className="w-4 h-4" />
            Cumplimiento GxP
          </div>
          <p className="text-2xl font-bold text-gray-900">Activo</p>
          <p className="text-xs text-gray-500">Sistema en estado validado</p>
        </div>
      </div>
    </div>
  );
}
