'use client';

import { useQuery } from '@tanstack/react-query';
import { recordsApi } from '@/lib/api';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Printer, AlertTriangle, Loader2 } from 'lucide-react';
import CertificadoAguaPurificada, { type CertificadoAguaProps } from '@/components/certificates/CertificadoAguaPurificada';

function buildCertificateProps(rec: any): CertificadoAguaProps {
  const sections: any[] = rec.format?.sections ?? [];
  const allFields: any[] = sections.flatMap((s: any) => s.fields ?? []);

  // Build name → value map from fieldValues
  const byName: Record<string, string> = {};
  (rec.fieldValues ?? []).forEach((fv: any) => {
    const field = allFields.find((f: any) => f.id === fv.fieldId);
    if (!field) return;
    let val = '';
    if (fv.value !== null && fv.value !== undefined) val = String(fv.value);
    else if (fv.valueNumeric !== null && fv.valueNumeric !== undefined) val = String(fv.valueNumeric);
    else if (fv.valueDate !== null && fv.valueDate !== undefined)
      val = new Date(fv.valueDate).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });
    byName[field.name] = val;
  });

  const fmt = (v: string | undefined) => (v && v.trim() ? v.trim() : '—');

  const fmtDate = (v: string | undefined) => {
    if (!v || !v.trim()) return '—';
    // Already formatted by the DATE field handler above
    if (v.includes('/')) return v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const withUnit = (name: string, unit: string) => {
    const v = byName[name];
    return v && v.trim() ? `${v.trim()} ${unit}` : '—';
  };

  const fechaEmision = rec.completedAt
    ? new Date(rec.completedAt).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date(rec.updatedAt).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return {
    logoUrl:        '/logo-polyfarma.jpg',
    puntoDeUso:     fmt(byName['punto_muestreo']),
    ubicacion:      fmt(byName['tipo_agua']),
    nControl:       rec.code ?? '—',
    nLote:          fmt(byName['numero_lote']),
    fechaAnalisis:  fmtDate(byName['fecha_analisis']) !== '—'
                      ? fmtDate(byName['fecha_analisis'])
                      : fmtDate(byName['fecha_produccion']),
    responsable:    fmt(byName['analista'] ?? byName['responsable']),
    fFab:           fmtDate(byName['fecha_produccion']),
    fechaEmision,
    referencias:    fmt(byName['referencias']) !== '—' ? fmt(byName['referencias']) : 'USP 47- NF 42',
    rTemperatura:   withUnit('temperatura', '°C'),
    rConductividad: withUnit('conductividad', 'µS/cm'),
    rToc:           withUnit('toc', 'ppb'),
    rPh:            fmt(byName['ph']),
    rBacterias:     fmt(byName['bacterias']),
    rHongos:        fmt(byName['hongos']),
    rEcoli:         fmt(byName['e_coli']),
    rPseudomona:    fmt(byName['pseudomonas']),
    notaMuestra:    fmt(byName['observaciones']) !== '—'
                      ? fmt(byName['observaciones'])
                      : 'El resultado corresponde únicamente a la muestra referida',
    codigo:         'CC-F-063',
    resultadoFinal: byName['resultado_final']?.trim() || '',
  };
}

export default function CertificadoClient() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const pathnameId = pathname.split('/').filter(Boolean)[1] ?? '';
  const id = (params.id && params.id !== '_') ? params.id : pathnameId;
  const router = useRouter();

  const { data: rec, isLoading, error } = useQuery<any>({
    queryKey: ['record', id],
    queryFn: () => recordsApi.findOne(id),
    retry: 1,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando certificado...
    </div>
  );

  if (error || !rec) return (
    <div className="text-center py-16 text-gray-400">
      <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-60" />
      <p className="font-medium">Registro no encontrado</p>
      <button onClick={() => router.back()} className="mt-4 text-pharma-600 text-sm underline">Volver</button>
    </div>
  );

  if (rec.format?.code !== 'CC-F-063') return (
    <div className="text-center py-16 text-gray-400">
      <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-60" />
      <p className="font-medium">Este certificado solo aplica para el formato CC-F-063</p>
      <button onClick={() => router.back()} className="mt-4 text-pharma-600 text-sm underline">Volver al registro</button>
    </div>
  );

  const props = buildCertificateProps(rec);

  return (
    <>
      <div className="coa-toolbar no-print flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Certificado de Análisis — {rec.code}</p>
            <p className="text-xs text-gray-500">{rec.format?.name} · {rec.status}</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-pharma-600 text-white rounded-lg text-sm hover:bg-pharma-700 transition font-medium"
        >
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </button>
      </div>
      <CertificadoAguaPurificada {...props} />
    </>
  );
}
