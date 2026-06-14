'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, FileText, Printer, X, Layers,
  Droplets, Eye, EyeOff, Save, CheckCircle, AlertTriangle,
  Loader2, ExternalLink, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { recordsApi, formatsApi } from '@/lib/api';
import CertificadoAguaPurificada, { type CertificadoAguaProps } from '@/components/certificates/CertificadoAguaPurificada';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface RawRow   { [colKey: string]: string }   // clave interna → valor crudo
interface ParsedRow { cert: CertificadoAguaProps; raw: RawRow }
interface ParsedFile { fileName: string; rows: ParsedRow[]; errors: string[] }
interface SavedRecord { rowIndex: number; recordId: string; recordCode: string; fileName: string }

type SaveStatus = 'idle' | 'saving' | 'done' | 'error';

// ─── Mapeo de encabezados del MD → clave interna ─────────────────────────────
const COL_ALIASES: Record<string, string> = {
  'fecha': 'fecha', 'date': 'fecha',
  'muestra': 'muestra', 'punto': 'muestra', 'sample': 'muestra',
  'punto de muestreo': 'muestra', 'punto de uso': 'muestra',
  'hora': 'hora', 'time': 'hora', 'hour': 'hora',
  'temp': 'temperatura', 'temp (°c)': 'temperatura',
  'temp c': 'temperatura',                              // normHeader("Temp (°C)") → "temp c"
  'temperatura': 'temperatura', 'temperatura (°c)': 'temperatura',
  'cond': 'conductividad', 'cond (µs/cm)': 'conductividad',
  'cond s/cm': 'conductividad',                         // normHeader("Cond (µS/cm)") → "cond s/cm"
  'cond (us/cm)': 'conductividad', 'conductividad': 'conductividad',
  'tds': 'tds', 'tds (ppm)': 'tds',
  'tds ppm': 'tds',                                     // normHeader("TDS (ppm)") → "tds ppm"
  'toc': 'toc', 'toc (ppb)': 'toc', 'toc ppb': 'toc',
  'ph': 'ph',
  'cloro': 'cloro', 'cloro residual': 'cloro',
  'cumple': 'cumple',
  'lote': 'lote', 'n° de lote': 'lote', 'numero de lote': 'lote', 'n lote': 'lote',
  'codigo': 'codigo', 'código': 'codigo',
  'n° control': 'codigo', 'n control': 'codigo',
  'firma/resp': 'analista', 'firma': 'analista',
  'responsable': 'analista', 'analista': 'analista', 'resp': 'analista',
};

function normHeader(h: string): string {
  return h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s/]/g, '').trim();
}

// ─── Parser de la tabla MD ────────────────────────────────────────────────────
function parseBitacoraMd(text: string, fileName: string): ParsedFile {
  const lines  = text.split('\n').map(l => l.trim()).filter(Boolean);
  const errors: string[] = [];
  const rows:   ParsedRow[] = [];

  const headerIdx = lines.findIndex(l => l.startsWith('|') && !l.match(/^\|[-:\s|]+\|$/));
  if (headerIdx === -1) { errors.push('No se encontró tabla Markdown.'); return { fileName, rows, errors }; }

  const rawHeaders = lines[headerIdx].split('|').map(h => h.trim()).filter(Boolean);
  const colMap = rawHeaders.map(h => COL_ALIASES[normHeader(h)] ?? '');

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|') || line.match(/^\|[-:\s|]+\|$/)) continue;

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    const raw: RawRow = {};
    cells.forEach((cell, ci) => { if (colMap[ci]) raw[colMap[ci]] = cell; });
    if (!Object.keys(raw).length) continue;

    rows.push({ raw, cert: buildCert(raw) });
  }

  if (!rows.length && !errors.length) errors.push('Sin filas de datos en la tabla.');
  return { fileName, rows, errors };
}

// ─── Construcción de props del certificado desde raw ─────────────────────────
function fmtFecha(f: string): string {
  if (!f) return '—';
  const p = f.split(/[-/]/);
  if (p.length === 3) {
    const [d, m, y] = p;
    return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y.length === 2 ? `20${y}` : y}`;
  }
  return f;
}

function cumpleText(v: string): string {
  if (v === '✓' || /^s[ií]$/i.test(v)) return 'Conforme ✓';
  if (v === '✗' || /^no$/i.test(v))    return 'No Conforme ✗';
  return v || 'Conforme ✓';
}

function buildCert(raw: RawRow): CertificadoAguaProps {
  const g = (k: string) => raw[k]?.trim() ?? '';
  const fecha = fmtFecha(g('fecha'));
  const hora  = g('hora');
  return {
    puntoDeUso:    g('muestra')       || '—',
    ubicacion:     g('muestra') ? `Punto ${g('muestra')}` : '—',
    nControl:      g('codigo')        || g('lote') || '—',
    nLote:         g('lote')          || g('codigo') || '—',
    fechaAnalisis: hora ? `${fecha}  ${hora}` : fecha,
    responsable:   g('analista')      || '—',
    fFab:          fecha,
    fechaEmision:  fecha,
    referencias:   'USP 47 - NF 42',
    rTemperatura:  g('temperatura')   ? `${g('temperatura')} °C`   : '—',
    rConductividad:g('conductividad') ? `${g('conductividad')} µS/cm` : '—',
    rToc:          g('toc')           ? `${g('toc')} ppb`
                 : g('tds')           ? `${g('tds')} ppm (TDS)`   : '—',
    rPh:           g('ph')            || '—',
    rBacterias:    cumpleText(g('cumple')),
    rHongos:       cumpleText(g('cumple')),
    rEcoli:        cumpleText(g('cumple')),
    rPseudomona:   cumpleText(g('cumple')),
    notaMuestra:   'El resultado corresponde únicamente a la muestra referida',
    codigo:        'CC-F-063',
  };
}

// ─── Conversión de fecha DD/MM/YYYY → ISO ─────────────────────────────────────
function toIso(ddmmyy: string): string | null {
  if (!ddmmyy) return null;
  const p = ddmmyy.split(/[-/]/);
  if (p.length !== 3) return null;
  const [d, m, y] = p;
  const year = y.length === 2 ? `20${y}` : y;
  const dt = new Date(`${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T12:00:00`);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

// ─── Payload de campo para la API ─────────────────────────────────────────────
function buildFieldValues(raw: RawRow, fieldByName: Record<string, any>) {
  const payload: any[] = [];

  const text  = (name: string, val: string) => {
    if (fieldByName[name] && val) payload.push({ fieldId: fieldByName[name].id, value: val });
  };
  const num   = (name: string, val: string) => {
    const n = parseFloat(val);
    if (fieldByName[name] && !isNaN(n)) payload.push({ fieldId: fieldByName[name].id, valueNumeric: n });
  };
  const date  = (name: string, val: string) => {
    const iso = toIso(val);
    if (fieldByName[name] && iso) payload.push({ fieldId: fieldByName[name].id, valueDate: iso });
  };
  const sel   = (name: string, val: string) => text(name, val);

  const g = (k: string) => raw[k]?.trim() ?? '';
  const cumple = g('cumple');
  const micro  = cumple === '✓' || /^s[ií]$/i.test(cumple) ? 'Ausente ✓' : 'Presente ✗';
  const result = cumple === '✓' || /^s[ií]$/i.test(cumple)
    ? 'APROBADO — Cumple especificaciones'
    : 'RECHAZADO — No cumple especificaciones';

  text('numero_lote',  g('lote')          || g('codigo'));
  sel ('tipo_agua',    'Agua Purificada (PW)');
  date('fecha_produccion', g('fecha'));
  text('punto_muestreo',   g('muestra'));
  text('analista',         g('analista'));
  sel ('apariencia',   'Límpida y transparente ✓');
  num ('ph',               g('ph'));
  num ('conductividad',    g('conductividad'));
  num ('toc',              g('tds') || g('toc'));
  num ('temperatura',      g('temperatura'));
  date('fecha_micro',      g('fecha'));
  sel ('pseudomonas',      micro);
  sel ('staph_aureus',     micro);
  sel ('e_coli',           micro);
  sel ('resultado_final',  result);

  return payload;
}

// ─── Tarjeta de certificado (expandible) ─────────────────────────────────────
function CertCard({
  cert, index, fileName, savedRecord,
}: {
  cert: CertificadoAguaProps;
  index: number;
  fileName: string;
  savedRecord?: SavedRecord;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden bg-white transition-colors ${
      savedRecord ? 'border-green-200' : 'border-gray-200'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 transition">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            savedRecord ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {savedRecord
              ? <CheckCircle className="w-4 h-4 text-green-600" />
              : <Droplets className="w-4 h-4 text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Muestra {cert.puntoDeUso} — Lote {cert.nLote}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {cert.fechaAnalisis} · pH {cert.rPh} · Cond {cert.rConductividad}
              {savedRecord && <span className="text-green-600 ml-2 font-medium">· {savedRecord.recordCode}</span>}
            </p>
          </div>
          <span className="text-xs text-gray-300 flex-shrink-0">{fileName}</span>
          {expanded ? <EyeOff className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        </button>

        {savedRecord && (
          <button
            onClick={() => router.push(`/records/${savedRecord.recordId}`)}
            className="flex items-center gap-1 text-xs text-pharma-600 hover:text-pharma-800 border border-pharma-200 rounded-lg px-2.5 py-1.5 flex-shrink-0 transition ml-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ver registro
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <div className="min-w-[820px]">
            <CertificadoAguaPurificada {...cert} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Barra de progreso ────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Guardando registros…</span>
        <span className="font-medium">{current} / {total}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 bg-pharma-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CertificadosAguaBatchPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging,     setDragging]     = useState(false);
  const [parsedFiles,  setParsedFiles]  = useState<ParsedFile[]>([]);
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([]);
  const [saveStatus,   setSaveStatus]   = useState<SaveStatus>('idle');
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

  const allRows = parsedFiles.flatMap(f =>
    f.rows.map((r, ri) => ({ ...r, fileName: f.fileName, globalIdx: ri }))
  );
  const totalErrors = parsedFiles.reduce((s, f) => s + f.errors.length, 0);

  // ── Procesar archivos ──
  const processFiles = useCallback((files: FileList | File[]) => {
    const mdFiles = Array.from(files).filter(f => f.name.endsWith('.md'));
    if (!mdFiles.length) { toast.error('Solo se aceptan archivos .md'); return; }

    Promise.all(mdFiles.map(file => file.text().then(t => parseBitacoraMd(t, file.name))))
      .then(results => {
        setParsedFiles(prev => {
          const existing = new Set(prev.map(p => p.fileName));
          return [...prev, ...results.filter(r => !existing.has(r.fileName))];
        });
        setSavedRecords([]);
        setSaveStatus('idle');
      });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (name: string) => {
    setParsedFiles(p => p.filter(f => f.fileName !== name));
    setSavedRecords([]);
    setSaveStatus('idle');
  };

  const resetAll = () => {
    setParsedFiles([]); setSavedRecords([]); setSaveStatus('idle');
  };

  // ── Guardar en base de datos ──
  const handleSaveAll = async () => {
    if (!allRows.length) return;
    setSaveStatus('saving');
    setSaveProgress({ current: 0, total: allRows.length });
    setSavedRecords([]);

    try {
      // 1. Obtener formato QC-AGUA-001
      const fmtData: any = await formatsApi.findAll({ status: 'APPROVED', limit: 50 });
      const formats: any[] = fmtData?.data ?? fmtData ?? [];
      const aguaFormat = formats.find((f: any) => f.code === 'QC-AGUA-001');
      if (!aguaFormat) throw new Error('Formato QC-AGUA-001 no encontrado. Ejecute el seed de formatos.');

      // 2. Crear mapa nombre→campo usando el primer registro creado
      let fieldByName: Record<string, any> = {};
      const newSaved: SavedRecord[] = [];

      for (let i = 0; i < allRows.length; i++) {
        const { raw, fileName } = allRows[i];

        // Crear registro
        const created: any = await recordsApi.create({ formatId: aguaFormat.id });
        const record = created?.data ?? created;

        // Extraer mapa de campos del primer registro
        if (i === 0) {
          const sections: any[] = record?.format?.sections ?? [];
          const fields = sections.flatMap((s: any) => s.fields ?? []);
          fieldByName = Object.fromEntries(fields.map((f: any) => [f.name, f]));
        }

        // Guardar valores de campo
        const values = buildFieldValues(raw, fieldByName);
        if (values.length) {
          await recordsApi.saveFieldValues(record.id, { values });
        }

        const saved: SavedRecord = {
          rowIndex: i,
          recordId: record.id,
          recordCode: record.code,
          fileName,
        };
        newSaved.push(saved);
        setSavedRecords([...newSaved]);
        setSaveProgress({ current: i + 1, total: allRows.length });
      }

      setSaveStatus('done');
      toast.success(`${allRows.length} registros guardados en el sistema ✓`);

    } catch (e: any) {
      setSaveStatus('error');
      toast.error(e.message ?? 'Error al guardar registros');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const savedMap = new Map(savedRecords.map(s => [s.rowIndex, s]));
  const allSaved = saveStatus === 'done';

  return (
    <>
      {/* ── Vista pantalla ── */}
      <div className="space-y-6 pb-12 print:hidden">

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => router.back()} className="btn-icon" title="Volver">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600" />
              Certificados en Lote — Agua Purificada
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Arrastra uno o varios .md con datos de bitácora — un certificado por fila, guardado en el sistema
            </p>
          </div>
          <div className="flex gap-2">
            {allRows.length > 0 && (
              <button
                onClick={handlePrint}
                className="btn-secondary"
              >
                <Printer className="w-4 h-4" />
                Imprimir {allRows.length}
              </button>
            )}
            {allRows.length > 0 && !allSaved && saveStatus !== 'saving' && (
              <button
                onClick={handleSaveAll}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                Guardar {allRows.length} registros
              </button>
            )}
            {allSaved && (
              <button
                onClick={() => router.push('/records')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 active:scale-95 text-white rounded-lg text-sm font-semibold shadow-md transition-all duration-150"
              >
                <CheckCircle className="w-4 h-4" />
                Ver en Registros
              </button>
            )}
          </div>
        </div>

        {/* Zona de arrastre */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            dragging ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-10 gap-3 select-none">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-blue-200' : 'bg-white border border-gray-200'}`}>
              <Upload className={`w-6 h-6 ${dragging ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">{dragging ? 'Suelta aquí' : 'Arrastra tus archivos .md'}</p>
              <p className="text-sm text-gray-400 mt-0.5">O haz clic · Múltiples archivos · Una fila = un certificado</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".md,text/markdown" multiple className="hidden"
            onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }} />
        </div>

        {/* Archivos cargados */}
        {parsedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Archivos</p>
              <button onClick={resetAll} className="text-xs text-red-400 hover:underline flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Limpiar todo
              </button>
            </div>
            {parsedFiles.map(f => (
              <div key={f.fileName} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {f.rows.length} certificado{f.rows.length !== 1 ? 's' : ''}
                    {f.errors.map((e, i) => <span key={i} className="text-amber-500 ml-2">⚠ {e}</span>)}
                  </p>
                </div>
                <button onClick={() => removeFile(f.fileName)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resumen */}
        {allRows.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{parsedFiles.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Archivo{parsedFiles.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-pharma-600">{allRows.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Certificado{allRows.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${savedRecords.length > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                {savedRecords.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Guardado{savedRecords.length !== 1 ? 's' : ''} en sistema</p>
            </div>
          </div>
        )}

        {/* Progreso de guardado */}
        {saveStatus === 'saving' && (
          <div className="bg-white border border-pharma-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="w-4 h-4 animate-spin text-pharma-600" />
              <span className="text-sm font-medium text-pharma-800">Guardando en el sistema…</span>
            </div>
            <ProgressBar current={saveProgress.current} total={saveProgress.total} />
          </div>
        )}

        {/* Error */}
        {saveStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Error al guardar registros</p>
              <p className="text-xs text-red-600 mt-0.5">Revisa la consola o verifica que el servidor esté activo.</p>
            </div>
            <button onClick={handleSaveAll} className="text-xs text-red-600 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-100 transition">
              Reintentar
            </button>
          </div>
        )}

        {/* Éxito */}
        {allSaved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">
                {savedRecords.length} registro{savedRecords.length !== 1 ? 's' : ''} guardado{savedRecords.length !== 1 ? 's' : ''} correctamente
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Visibles en Registros · Estado: En Progreso · Pendiente firma electrónica
              </p>
            </div>
          </div>
        )}

        {/* Lista de certificados */}
        {allRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Certificados — clic para previsualizar
            </p>
            {allRows.map(({ cert, fileName }, i) => (
              <CertCard
                key={`${fileName}-${i}`}
                cert={cert}
                index={i}
                fileName={fileName}
                savedRecord={savedMap.get(i)}
              />
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {parsedFiles.length === 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <p className="text-sm font-semibold text-blue-800 mb-2">Formato esperado del .md</p>
            <pre className="text-xs text-blue-700 font-mono leading-relaxed overflow-x-auto whitespace-pre">{`| Fecha    | Muestra | Hora  | Temp (°C) | Cond (µS/cm) | pH   | Lote        | Código   | Firma/Resp |
|----------|---------|-------|-----------|--------------|------|-------------|----------|------------|
| 05-01-26 | 4C      | 9:00  | 25.2      | 0.973        | 5.50 | MB 05-01-26 | AP050126 | MB         |
| 06-01-26 | 5C      | 9:15  | 23.5      | 0.682        | 5.34 | MB 06-01-26 | AP060126 | MB         |`}</pre>
          </div>
        )}
      </div>

      {/* ── Vista impresión: todos los certificados, uno por página ── */}
      <div id="print-all-certs" className="hidden print:block">
        {allRows.map(({ cert }, i) => (
          <div key={i} className="print-page-break">
            <CertificadoAguaPurificada {...cert} />
          </div>
        ))}
      </div>
    </>
  );
}
