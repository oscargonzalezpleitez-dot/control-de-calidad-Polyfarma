'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordsApi, signaturesApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  ArrowLeft, Save, CheckCircle, Shield, Hash,
  AlertTriangle, Loader2, Clock, FileText, XCircle, Award,
  ChevronDown, ChevronRight, Upload, FileCode2, Sparkles, X,
  PenLine, BadgeCheck, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── helpers ─────────────────────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  DRAFT:        'bg-gray-100 text-gray-700 border-gray-200',
  IN_PROGRESS:  'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED:    'bg-green-100 text-green-700 border-green-200',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED:     'bg-indigo-100 text-indigo-700 border-indigo-200',
  REJECTED:     'bg-red-100 text-red-700 border-red-200',
  CANCELLED:    'bg-orange-100 text-orange-700 border-orange-200',
  INVALIDATED:  'bg-red-200 text-red-800 border-red-300',
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador', IN_PROGRESS: 'En Progreso', COMPLETED: 'Completado',
  UNDER_REVIEW: 'En Revisión', APPROVED: 'Aprobado', REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado', INVALIDATED: 'Invalidado',
};

function parseOptions(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

/* ─── Field renderer ──────────────────────────────────────────── */
function FieldInput({
  field, value, disabled,
  onChange,
}: {
  field: any;
  value: any;
  disabled: boolean;
  onChange: (val: any) => void;
}) {
  const base =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-pharma-500 focus:border-transparent ' +
    'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition';

  switch (field.type) {
    case 'SIGNATURE': {
      const signed = !!value;
      return (
        <div className={`rounded-lg p-3 border ${signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
          {signed ? (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Firmado electrónicamente</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Shield className="w-4 h-4" />
              <span>Se aplica al completar el registro</span>
            </div>
          )}
        </div>
      );
    }
    case 'SEPARATOR':
      return <hr className="border-gray-200" />;
    case 'LABEL':
      return <p className="text-sm text-gray-500 italic">{field.helpText || field.label}</p>;

    case 'TEXTAREA':
      return (
        <textarea
          rows={3}
          disabled={disabled}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className={base}
        />
      );

    case 'SELECT':
    case 'RADIO': {
      const opts = parseOptions(field.options);
      return (
        <select
          disabled={disabled}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">— Seleccionar —</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }

    case 'MULTISELECT': {
      const opts = parseOptions(field.options);
      const selected: string[] = Array.isArray(value) ? value : (value ? value.split(',') : []);
      return (
        <div className={`border border-gray-200 rounded-lg p-2 space-y-1 ${disabled ? 'bg-gray-50' : 'bg-white'}`}>
          {opts.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected.includes(o)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, o]
                    : selected.filter((x) => x !== o);
                  onChange(next.join(','));
                }}
                className="rounded border-gray-300 text-pharma-600"
              />
              {o}
            </label>
          ))}
        </div>
      );
    }

    case 'CHECKBOX':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            disabled={disabled}
            checked={value === 'true' || value === true}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 rounded border-gray-300 text-pharma-600"
          />
          <span className="text-sm text-gray-700">{field.helpText || 'Sí'}</span>
        </label>
      );

    case 'DATE':
      return (
        <input
          type="date"
          disabled={disabled}
          value={value ? String(value).split('T')[0] : ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );

    case 'DATETIME':
      return (
        <input
          type="datetime-local"
          disabled={disabled}
          value={value ? String(value).slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );

    case 'TIME':
      return (
        <input type="time" disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={base} />
      );

    case 'NUMBER':
      return (
        <div className="relative">
          <input
            type="number"
            disabled={disabled}
            value={value ?? ''}
            step={field.decimalPlaces != null ? Math.pow(10, -field.decimalPlaces) : 'any'}
            min={field.minValue ?? undefined}
            max={field.maxValue ?? undefined}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? ''}
            className={`${base} ${field.unit ? 'pr-20' : ''}`}
          />
          {field.unit && (
            <span className="absolute right-3 top-2 text-xs font-mono text-gray-400 pointer-events-none">
              {field.unit}
            </span>
          )}
        </div>
      );

    default:
      return (
        <input
          type="text"
          disabled={disabled}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          maxLength={field.maxLength ?? undefined}
          className={base}
        />
      );
  }
}

/* ─── Markdown parser ─────────────────────────────────────────── */
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[^a-z0-9\s]/g, ' ')                     // sólo alfanumerico
    .replace(/\s+/g, ' ')
    .trim();
}

interface ParsedPair { key: string; value: string }
interface MatchResult {
  fieldId: string;
  fieldLabel: string;
  fieldName: string;
  parsedKey: string;
  parsedValue: string;
}

function parseMd(text: string): ParsedPair[] {
  const pairs: ParsedPair[] = [];
  const lines = text.split('\n');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    // Tabla markdown: | key | value |
    if (line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2 && !cells[0].match(/^-+$/)) {
        pairs.push({ key: cells[0], value: cells[1] });
      }
      continue;
    }

    // Lista: - **Key**: value  o  - Key: value
    const listMatch = line.match(/^[-*]\s+\*{0,2}(.+?)\*{0,2}:\s*(.+)$/);
    if (listMatch) { pairs.push({ key: listMatch[1].trim(), value: listMatch[2].trim() }); continue; }

    // Negrita inline: **Key**: value
    const boldMatch = line.match(/^\*{2}(.+?)\*{2}:\s*(.+)$/);
    if (boldMatch) { pairs.push({ key: boldMatch[1].trim(), value: boldMatch[2].trim() }); continue; }

    // Clave: valor simple (no empieza con #)
    const plainMatch = line.match(/^([^:]{2,60}):\s*(.+)$/);
    if (plainMatch) { pairs.push({ key: plainMatch[1].trim(), value: plainMatch[2].trim() }); }
  }

  return pairs;
}

function matchPairs(pairs: ParsedPair[], allFields: any[]): MatchResult[] {
  return pairs
    .map(({ key, value }) => {
      const normKey = normalize(key);
      // 1. coincidencia exacta por name
      let field = allFields.find((f: any) => normalize(f.name) === normKey);
      // 2. coincidencia exacta por label
      if (!field) field = allFields.find((f: any) => normalize(f.label) === normKey);
      // 3. label contiene la clave o viceversa
      if (!field) field = allFields.find((f: any) => {
        const nl = normalize(f.label);
        return nl.includes(normKey) || normKey.includes(nl);
      });
      // 4. name contiene la clave
      if (!field) field = allFields.find((f: any) => normalize(f.name).includes(normKey) || normKey.includes(normalize(f.name)));

      if (!field) return null;
      return { fieldId: field.id, fieldLabel: field.label, fieldName: field.name, parsedKey: key, parsedValue: value };
    })
    .filter(Boolean) as MatchResult[];
}

/* ─── Panel de importación Markdown ───────────────────────────── */
function MarkdownImportPanel({
  allFields,
  onApply,
}: {
  allFields: any[];
  onApply: (results: MatchResult[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mdText, setMdText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [parsed, setParsed] = useState(false);

  const readFile = (file: File) => {
    if (!file.name.endsWith('.md')) { toast.error('Solo se aceptan archivos .md'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setMdText(e.target?.result as string ?? ''); setParsed(false); setMatches([]); };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = '';
  };

  const handleParse = () => {
    const pairs = parseMd(mdText);
    const results = matchPairs(pairs, allFields.filter((f: any) => !['SIGNATURE','SEPARATOR','LABEL'].includes(f.type)));
    setMatches(results);
    setParsed(true);
    if (results.length === 0) toast('No se encontraron campos coincidentes');
  };

  const handleApply = () => {
    onApply(matches);
    setOpen(false);
    setMdText('');
    setMatches([]);
    setParsed(false);
    toast.success(`${matches.length} campo${matches.length !== 1 ? 's' : ''} completado${matches.length !== 1 ? 's' : ''} desde Markdown`);
  };

  const clear = () => { setMdText(''); setMatches([]); setParsed(false); };

  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-violet-200 bg-violet-50/40' : 'border-gray-200 bg-white'}`}>
      {/* Header colapsable */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
          <FileCode2 className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Importar datos desde Markdown</p>
          <p className="text-xs text-gray-400 mt-0.5">Arrastra un .md o pega texto — el sistema detecta y rellena los campos automáticamente</p>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {/* Contenido */}
      {open && (
        <div className="px-5 pb-5 space-y-4">

          {/* Drop zone + textarea */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed transition-colors ${
              dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white'
            }`}
          >
            {!mdText ? (
              <label className="flex flex-col items-center justify-center gap-2 py-8 cursor-pointer text-gray-400 hover:text-gray-500 transition">
                <Upload className="w-7 h-7 opacity-60" />
                <span className="text-sm font-medium">Suelta tu .md aquí o haz clic para seleccionar</span>
                <span className="text-xs">También puedes pegar el contenido directamente</span>
                <input type="file" accept=".md,text/markdown" className="hidden" onChange={handleFileInput} />
              </label>
            ) : (
              <div className="relative">
                <textarea
                  value={mdText}
                  onChange={(e) => { setMdText(e.target.value); setParsed(false); setMatches([]); }}
                  rows={8}
                  placeholder="Pega aquí el contenido Markdown..."
                  spellCheck={false}
                  className="w-full px-4 py-3 text-xs font-mono text-gray-700 bg-transparent rounded-xl focus:outline-none resize-none"
                />
                <button
                  onClick={clear}
                  className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Formato de referencia rápida */}
          {!mdText && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-500 space-y-0.5">
              <p className="text-gray-400 font-sans font-medium mb-1.5 text-[11px]">Formatos aceptados:</p>
              <p>- pH (5.0 – 7.0): 6.5</p>
              <p>- Conductividad: 0.85</p>
              <p>**Número de Lote**: PW-2024-001</p>
              <p>| Temperatura de Muestreo | 25.4 |</p>
            </div>
          )}

          {/* Botón analizar */}
          {mdText && !parsed && (
            <button
              onClick={handleParse}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Analizar y detectar campos
            </button>
          )}

          {/* Resultado del análisis */}
          {parsed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">
                  {matches.length > 0
                    ? <span className="text-green-700">✓ {matches.length} campo{matches.length !== 1 ? 's' : ''} detectado{matches.length !== 1 ? 's'  : ''}</span>
                    : <span className="text-amber-600">⚠ Sin coincidencias</span>}
                </p>
                <button onClick={handleParse} className="text-xs text-violet-600 hover:underline">Re-analizar</button>
              </div>

              {matches.length > 0 && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Campo del formulario</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Valor detectado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {matches.map((m, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700 font-medium">{m.fieldLabel}</td>
                          <td className="px-3 py-2 font-mono text-violet-700">{m.parsedValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {matches.length > 0 && (
                <button
                  onClick={handleApply}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aplicar {matches.length} campo{matches.length !== 1 ? 's' : ''} al formulario
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [values, setValues] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [password, setPassword] = useState('');
  const [signType, setSignType] = useState('ELABORATED_BY');
  const [signMeaning, setSignMeaning] = useState('Datos verificados y confirmados por el responsable del análisis');
  const [saving, setSaving] = useState(false);

  /* fetch record */
  const { data: rec, isLoading, error } = useQuery<any>({
    queryKey: ['record', id],
    queryFn: () => recordsApi.findOne(id),
    retry: 1,
  });

  /* pre-load existing values once record is fetched */
  useEffect(() => {
    if (!rec?.fieldValues) return;
    const init: Record<string, any> = {};
    rec.fieldValues.forEach((fv: any) => {
      init[fv.fieldId] =
        fv.value !== null && fv.value !== undefined ? fv.value
        : fv.valueNumeric !== null && fv.valueNumeric !== undefined ? fv.valueNumeric
        : fv.valueDate !== null && fv.valueDate !== undefined ? fv.valueDate
        : '';
    });
    setValues(init);
    setDirty(false);
  }, [rec?.id]);

  const isEditable = rec?.status === 'IN_PROGRESS' || rec?.status === 'DRAFT';

  /* build payload — fields live under sections[].fields in API response */
  const buildPayload = useCallback(() => {
    const sections: any[] = rec?.format?.sections ?? [];
    const fields: any[] = sections.flatMap((s: any) => s.fields ?? []);
    return Object.entries(values)
      .map(([fieldId, val]) => {
        const f = fields.find((x: any) => x.id === fieldId);
        if (!f || val === '' || val == null) return null;
        if (f.type === 'NUMBER') return { fieldId, valueNumeric: Number(val) };
        if (f.type === 'DATE' || f.type === 'DATETIME')
          return { fieldId, valueDate: new Date(val).toISOString() };
        return { fieldId, value: String(val) };
      })
      .filter(Boolean);
  }, [values, rec]);

  /* save mutation */
  const saveMut = useMutation({
    mutationFn: (payload: any[]) => recordsApi.saveFieldValues(id, { values: payload }),
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['record', id] });
      toast.success('Datos guardados correctamente');
    },
    onError: (e: any) => toast.error(e.message ?? 'Error al guardar'),
  });

  /* complete mutation */
  const completeMut = useMutation({
    mutationFn: () => recordsApi.complete(id),
    onSuccess: () => {
      toast.success('Registro completado con firma electrónica ✓');
      queryClient.invalidateQueries({ queryKey: ['record', id] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
      setShowSign(false);
      setPassword('');
    },
    onError: (e: any) => toast.error(e.message ?? 'Error al completar'),
  });

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload.length) { toast('No hay datos nuevos para guardar'); return; }
    setSaving(true);
    try { await saveMut.mutateAsync(payload); }
    finally { setSaving(false); }
  };

  const handleComplete = async () => {
    if (!password) { toast.error('Ingrese su contraseña'); return; }
    if (!signMeaning.trim() || signMeaning.trim().length < 5) { toast.error('El significado de la firma debe tener al menos 5 caracteres'); return; }
    setSaving(true);
    try {
      // 1. Guardar valores pendientes
      const payload = buildPayload();
      if (payload.length) await saveMut.mutateAsync(payload);

      // 2. Crear firma electrónica (21 CFR Part 11)
      await signaturesApi.create({
        password,
        type: signType,
        purpose: 'RECORD_COMPLETION',
        meaning: signMeaning.trim(),
        recordId: id,
      });

      // 3. Completar el registro
      await completeMut.mutateAsync();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al aplicar la firma');
    } finally {
      setSaving(false);
    }
  };

  const setVal = (fieldId: string, val: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
    setDirty(true);
  };

  /* ── loading / error states ── */
  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando registro...
    </div>
  );

  if (error || !rec) return (
    <div className="text-center py-16 text-gray-400">
      <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-60" />
      <p className="font-medium">Registro no encontrado</p>
      <button onClick={() => router.push('/records')} className="mt-4 text-pharma-600 text-sm underline">
        Volver a Registros
      </button>
    </div>
  );

  const sections: any[] = rec.format?.sections ?? [];
  // Backend nests fields under sections[].fields, not format.fields
  const allFields: any[] = sections.flatMap((s: any) => s.fields ?? []);
  const rootFields: any[] = []; // all fields are inside sections

  /* required fields count */
  const required = allFields.filter((f: any) => f.isRequired && f.type !== 'SIGNATURE' && f.type !== 'SEPARATOR' && f.type !== 'LABEL');
  const filled = required.filter((f: any) => {
    const v = values[f.id];
    return v !== undefined && v !== null && v !== '';
  });
  const progress = required.length ? Math.round((filled.length / required.length) * 100) : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push('/records')}
          className="btn-icon"
          title="Volver a Registros"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-gray-900 text-lg">{rec.code}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[rec.status]}`}>
              {STATUS_LABEL[rec.status]}
            </span>
            {dirty && isEditable && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">
                Sin guardar
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {rec.format?.name} &nbsp;·&nbsp; v{rec.format?.version} &nbsp;·&nbsp; {rec.format?.code}
          </p>
        </div>

        {isEditable && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="btn-secondary disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
            <button
              onClick={() => setShowSign(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 active:scale-95 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-150"
            >
              <CheckCircle className="w-4 h-4" />
              Completar y Firmar
            </button>
          </div>
        )}

        {!isEditable && (
          <div className="flex items-center gap-2">
            {rec.format?.code === 'QC-AGUA-001' && (
              <button
                onClick={() => router.push(`/records/${id}/certificado`)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white rounded-lg text-sm font-semibold shadow-md transition-all duration-150"
              >
                <Award className="w-4 h-4" />
                Ver Certificado
              </button>
            )}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              Sólo lectura
            </div>
          </div>
        )}
      </div>

      {/* ── Meta + progress ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Creado</p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(rec.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-pharma-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Elaborado por</p>
            <p className="text-sm font-medium text-gray-800">
              {rec.createdBy?.firstName} {rec.createdBy?.lastName}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-400">Campos completados</p>
            <p className="text-xs font-semibold text-gray-700">{filled.length}/{required.length}</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-pharma-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{progress}% completado</p>
        </div>
      </div>

      {/* ── Audit trail notice ── */}
      <div className="flex items-center gap-2 text-xs text-pharma-700 bg-pharma-50 border border-pharma-100 rounded-xl px-4 py-2.5">
        <Hash className="w-3.5 h-3.5 flex-shrink-0" />
        Cada valor guardado genera una entrada inmutable en el <strong className="mx-1">Audit Trail</strong> con hash SHA-256 — ALCOA+ Compliant
      </div>

      {/* ── Importar desde Markdown (solo en estado editable) ── */}
      {isEditable && (
        <MarkdownImportPanel
          allFields={allFields}
          onApply={(results) => {
            results.forEach((m) => setVal(m.fieldId, m.parsedValue));
          }}
        />
      )}

      {/* ── Root fields (no section) ── */}
      {rootFields.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Datos Generales</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {rootFields.map((field: any) => (
              <FieldRow key={field.id} field={field} value={values[field.id]} disabled={!isEditable} onChange={(v) => setVal(field.id, v)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      {sections
        .slice()
        .sort((a: any, b: any) => a.order - b.order)
        .map((section: any) => {
          const sFields = (section.fields ?? []).slice().sort((a: any, b: any) => a.order - b.order);
          if (!sFields.length) return null;

          const secRequired = sFields.filter((f: any) => f.isRequired && f.type !== 'SIGNATURE' && f.type !== 'SEPARATOR');
          const secFilled = secRequired.filter((f: any) => {
            const v = values[f.id]; return v !== undefined && v !== null && v !== '';
          });

          return (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 bg-pharma-50 border-b border-pharma-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-pharma-900">{section.name}</h3>
                  {section.description && (
                    <p className="text-xs text-pharma-600 mt-0.5">{section.description}</p>
                  )}
                </div>
                {secRequired.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    secFilled.length === secRequired.length
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {secFilled.length}/{secRequired.length}
                  </span>
                )}
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {sFields.map((field: any) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    disabled={!isEditable}
                    onChange={(v) => setVal(field.id, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}

      {/* ── Completed state ── */}
      {rec.status === 'COMPLETED' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Registro completado y firmado electrónicamente</p>
            <p className="text-sm text-green-600 mt-0.5">
              Las firmas han sido aplicadas con hash SHA-256. El registro es ahora inmutable.
            </p>
          </div>
        </div>
      )}

      {/* ── Panel de firmas electrónicas ── */}
      {rec.signatures && rec.signatures.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-800">Firmas Electrónicas</h3>
            <span className="ml-auto text-xs text-gray-400">21 CFR Part 11</span>
          </div>
          <div className="divide-y divide-gray-100">
            {rec.signatures.map((sig: any) => {
              const TYPE_LABEL: Record<string, string> = {
                ELABORATED_BY: 'Elaborado por',
                REVIEWED_BY:   'Revisado por',
                APPROVED_BY:   'Aprobado por',
                VERIFIED_BY:   'Verificado por',
                AUTHORIZED_BY: 'Autorizado por',
                WITNESSED_BY:  'Presenciado por',
              };
              return (
                <div key={sig.id} className="px-6 py-4 flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${sig.isRevoked ? 'bg-red-400' : 'bg-green-500'}`}>
                    {sig.user?.firstName?.[0]}{sig.user?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">
                        {sig.user?.firstName} {sig.user?.lastName}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-medium">
                        {TYPE_LABEL[sig.type] ?? sig.type}
                      </span>
                      {sig.isRevoked && (
                        <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full">
                          Revocada
                        </span>
                      )}
                      {!sig.isRevoked && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <BadgeCheck className="w-3.5 h-3.5" />Válida
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sig.user?.position ?? sig.user?.email}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 italic">"{sig.meaning}"</p>
                    {sig.comments && (
                      <p className="text-xs text-gray-400 mt-0.5">{sig.comments}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(sig.signedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(sig.signedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] font-mono text-gray-300 mt-1 truncate max-w-[90px]" title={sig.signatureHash}>
                      {sig.signatureHash?.slice(0, 8)}…
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sign modal ── */}
      {showSign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6">

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Firma Electrónica</h3>
                  <p className="text-xs text-gray-500">21 CFR Part 11 §11.200 — No-repudiación</p>
                </div>
                <button
                  onClick={() => { setShowSign(false); setPassword(''); setSignType('ELABORATED_BY'); setSignMeaning('Datos verificados y confirmados por el responsable del análisis'); }}
                  className="ml-auto p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Alerta de campos incompletos */}
              {progress < 100 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Faltan <strong>{required.length - filled.length} campo(s) obligatorio(s)</strong> por completar.
                    Puede firmar de todas formas si los datos son correctos.
                  </p>
                </div>
              )}

              {/* Tipo de firma */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Rol en este documento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'ELABORATED_BY',  label: 'Elaborado por' },
                    { value: 'REVIEWED_BY',    label: 'Revisado por' },
                    { value: 'APPROVED_BY',    label: 'Aprobado por' },
                    { value: 'VERIFIED_BY',    label: 'Verificado por' },
                    { value: 'AUTHORIZED_BY',  label: 'Autorizado por' },
                    { value: 'WITNESSED_BY',   label: 'Presenciado por' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSignType(opt.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition ${
                        signType === opt.value
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Significado de la firma */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Significado de la firma <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={signMeaning}
                  onChange={(e) => setSignMeaning(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Describa la declaración que representa esta firma..."
                />
              </div>

              {/* Declaración ALCOA+ */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700 mb-1.5">Al aplicar esta firma declara que:</p>
                <p>✓ Los datos registrados son verdaderos, exactos y verificados</p>
                <p>✓ Es el responsable directo de la información capturada</p>
                <p>✓ La firma genera un hash SHA-256 inmutable en el Audit Trail</p>
              </div>

              {/* Firmante + contraseña */}
              <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 mb-4 flex items-center gap-3">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-green-700 font-semibold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-green-600">{user?.role} · {user?.email}</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña de confirmación
                </label>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSign(false); setPassword(''); setSignType('ELABORATED_BY'); setSignMeaning('Datos verificados y confirmados por el responsable del análisis'); }}
                  disabled={saving}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!password || !signMeaning.trim() || saving || completeMut.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 active:scale-95 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {(saving || completeMut.isPending)
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Aplicando firma...</>
                    : <><PenLine className="w-4 h-4" />Firmar y Completar</>}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Field row wrapper ───────────────────────────────────────── */
function FieldRow({ field, value, disabled, onChange }: {
  field: any; value: any; disabled: boolean; onChange: (v: any) => void;
}) {
  const wide = ['TEXTAREA', 'SIGNATURE', 'SEPARATOR', 'LABEL', 'MULTISELECT', 'TABLE'].includes(field.type);
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      {field.type !== 'SEPARATOR' && field.type !== 'LABEL' && field.type !== 'CHECKBOX' && (
        <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1.5">
          {field.label}
          {field.isRequired && <span className="text-red-500">*</span>}
          {field.unit && <span className="text-gray-400 font-normal">({field.unit})</span>}
        </label>
      )}
      <FieldInput field={field} value={value} disabled={disabled} onChange={onChange} />
      {field.helpText && !['SIGNATURE', 'CHECKBOX', 'SEPARATOR', 'LABEL'].includes(field.type) && (
        <p className="text-xs text-gray-400 mt-1 leading-tight">{field.helpText}</p>
      )}
    </div>
  );
}
