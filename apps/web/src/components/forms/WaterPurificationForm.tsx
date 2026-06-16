'use client';

import React from 'react';

const BL = '#1f4e79';
const BD = '#2b6cb0';

interface WaterFormProps {
  rec: any;
  values: Record<string, any>;
  setVal: (fieldId: string, val: any) => void;
  isEditable: boolean;
}

export function WaterPurificationForm({ rec, values, setVal, isEditable }: WaterFormProps) {
  const sections: any[] = rec.format?.sections ?? [];
  const allFields: any[] = sections.flatMap((s: any) => s.fields ?? []);
  const byName: Record<string, any> = Object.fromEntries(allFields.map((f: any) => [f.name, f]));

  const val = (name: string): string => {
    const f = byName[name];
    if (!f) return '';
    const v = values[f.id];
    if (v === null || v === undefined || v === '') return '';
    if (f.type === 'DATE') return String(v).split('T')[0];
    return String(v);
  };

  const set = (name: string, v: any) => {
    const f = byName[name];
    if (f) setVal(f.id, v);
  };

  /* ── estilos ── */
  const EDIT_BG = isEditable ? '#fffde7' : 'transparent';

  const BASE: React.CSSProperties = {
    width: '100%', border: 'none', outline: 'none',
    textAlign: 'center', fontWeight: 700, fontSize: 11,
    color: '#000', padding: '4px 2px', background: 'transparent',
    fontFamily: 'Arial, Helvetica, sans-serif',
  };

  const CELL: React.CSSProperties = { border: '1px solid #000' };
  const ECELL: React.CSSProperties = { ...CELL, background: EDIT_BG };

  const TH = (fs: number, extra?: React.CSSProperties): React.CSSProperties => ({
    ...CELL, textAlign: 'center', padding: '3px 2px', fontWeight: 700, color: BL, fontSize: fs, ...extra,
  });

  const fechaEmision = rec.completedAt
    ? new Date(rec.completedAt).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });

  /* ── filas de determinaciones ── */
  const FISICO = [
    { name: 'temperatura',   label: 'TEMPERATURA',    spec: 'No mayor a 40°C',      unit: '°C'    },
    { name: 'conductividad', label: 'CONDUCTIVIDAD',  spec: 'No mayor a 1.3 µS/cm', unit: 'µS/cm' },
    { name: 'toc',           label: 'TOC',             spec: 'No mayor a 500 ppb',   unit: 'ppb'   },
    { name: 'ph',            label: 'pH',             spec: '5.0 – 7.0',            unit: ''      },
  ];

  const MICRO_TEXT = [
    { name: 'bacterias', label: 'Recuento total de bacterias aerobias mesofilas',    spec: '<100 UFC' },
    { name: 'hongos',    label: 'Recuento total de hongos filamentosos y levaduras', spec: '<100 UFC' },
  ];

  const MICRO_SEL = [
    { name: 'e_coli',      label: 'Escherichia Coli — Examen microbiológico (productos no estériles: microorganismos específicos)',       spec: 'Ausencia/100 mL' },
    { name: 'pseudomonas', label: 'Pseudomona Aeruginosa — Examen microbiológico (productos no estériles: microorganismos específicos)',   spec: 'Ausencia/100 mL' },
  ];

  const microOpts = ['Conforme', 'Ausente', 'No conforme — Presente'];

  const TxtInput = ({ name, placeholder }: { name: string; placeholder?: string }) => (
    <input
      disabled={!isEditable}
      value={val(name)}
      onChange={e => set(name, e.target.value)}
      placeholder={isEditable ? (placeholder ?? '') : ''}
      style={BASE}
    />
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      {isEditable && (
        <div style={{ marginBottom: 8, padding: '6px 10px', background: '#fffde7', border: '1px solid #f59e0b', borderRadius: 6, fontSize: 11, color: '#92400e' }}>
          Las celdas con fondo amarillo son editables — haga clic para ingresar datos
        </div>
      )}
      <div
        className="coa-page"
        style={{
          position: 'relative', width: 780, minHeight: 980,
          background: '#fff', border: '1.5px solid #000',
          padding: '12px 12px 60px',
          fontFamily: 'Arial, Helvetica, sans-serif', color: '#000',
          boxShadow: '0 4px 20px rgba(0,0,0,.10)',
        }}
      >
        {/* ════════════ CABECERA ════════════ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingBottom: 10 }}>
          <div style={{ width: 96, display: 'flex', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-polyfarma.jpg" alt="Polyfarma" style={{ maxWidth: 88, maxHeight: 66, objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', paddingTop: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.2px' }}>LABORATORIOS FARMACEUTICOS POLYFARMA</div>
            <div style={{ fontWeight: 700, fontSize: 12, marginTop: 2 }}>LABORATORIO DE CONTROL DE CALIDAD</div>
            <div style={{ fontWeight: 700, fontSize: 12, marginTop: 2 }}>CERTIFICADO DE ANALISIS DE AGUA PURIFICADA</div>
          </div>
          <div style={{ width: 96 }} />
        </div>

        {/* ════════════ TABLA A — IDENTIFICACIÓN ════════════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '24%' }} /><col style={{ width: '22%' }} />
            <col style={{ width: '15%' }} /><col style={{ width: '20%' }} />
            <col style={{ width: '19%' }} />
          </colgroup>
          <tbody>
            {/* ── fila 1: encabezados ── */}
            <tr>
              <td style={TH(11)}>PUNTO DE USO</td>
              <td style={TH(7.5, { lineHeight: 1.1 })}>UBICACIÓN DEL PUNTO DE USO</td>
              <td style={TH(9)}>N° DE CONTROL</td>
              <td style={TH(9)}>N° DE LOTE INTERNO</td>
              <td style={TH(9)}>FECHA DE ANALISIS</td>
            </tr>
            {/* ── fila 2: datos ── */}
            <tr>
              <td style={ECELL}><TxtInput name="punto_muestreo" placeholder="Ej. 9C" /></td>
              <td style={ECELL}><TxtInput name="tipo_agua" placeholder="Ej. Lavado" /></td>
              <td style={{ ...CELL, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11 }}>{rec.code}</td>
              <td style={ECELL}><TxtInput name="numero_lote" placeholder="Ej. AP290126" /></td>
              <td style={ECELL}>
                <input
                  type="text" disabled={!isEditable}
                  value={val('fecha_analisis')} onChange={e => set('fecha_analisis', e.target.value)}
                  placeholder={isEditable ? 'DDMMAAAA' : ''}
                  style={{ ...BASE, fontSize: 10 }}
                />
              </td>
            </tr>
            {/* ── fila 3: responsable + F.Fab + Fecha Emisión ── */}
            <tr>
              <td colSpan={2} style={TH(9)}>RESPONSABLE DE MUESTREO / ANALISTA</td>
              <td style={TH(10)}>F. FAB.</td>
              <td colSpan={2} style={TH(10)}>FECHA DE EMISION</td>
            </tr>
            {/* ── fila 4: datos responsable + F.Fab + Fecha Emisión ── */}
            <tr>
              <td colSpan={2} style={ECELL}><TxtInput name="analista" placeholder="Marisol Beltran" /></td>
              <td style={ECELL}>
                <input
                  type="date" disabled={!isEditable}
                  value={val('fecha_produccion')} onChange={e => set('fecha_produccion', e.target.value)}
                  style={{ ...BASE, fontSize: 10 }}
                />
              </td>
              <td colSpan={2} style={{ ...CELL, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11 }}>
                {fechaEmision}
              </td>
            </tr>
            {/* ── fila 5: referencias ── */}
            <tr>
              <td colSpan={3} style={{ ...CELL, textAlign: 'left', padding: '3px 6px', fontWeight: 700, fontSize: 10, color: BL }}>
                REFERENCIAS UTILIZADAS:
              </td>
              <td colSpan={2} style={ECELL}><TxtInput name="referencias" placeholder="USP 47- NF 42" /></td>
            </tr>
          </tbody>
        </table>

        {/* ════════════ TABLA B — DETERMINACIONES ════════════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '31%' }} />
            <col style={{ width: '37%' }} />
            <col style={{ width: '32%' }} />
          </colgroup>
          <tbody>
            {/* ── encabezado ── */}
            <tr>
              <td style={TH(11)}>DETERMINACIONES</td>
              <td style={TH(11)}>ESPECIFICACIONES</td>
              <td style={TH(11)}>RESULTADOS</td>
            </tr>

            {/* ── Fisicoquímicos ── */}
            {FISICO.map(row => (
              <tr key={row.name}>
                <td style={{ ...CELL, textAlign: 'center', padding: '4px', fontSize: 11, color: BD }}>{row.label}</td>
                <td style={{ ...CELL, textAlign: 'center', padding: '4px', fontSize: 11, color: BD }}>{row.spec}</td>
                <td style={{ ...ECELL, padding: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 6px', gap: 4 }}>
                    <input
                      type="text" inputMode="decimal" disabled={!isEditable}
                      value={val(row.name)} onChange={e => set(row.name, e.target.value)}
                      placeholder={isEditable ? '0.00' : ''}
                      style={{ flex: 1, border: 'none', outline: 'none', textAlign: 'center', fontSize: 11, color: BD, fontWeight: 700, background: 'transparent', minWidth: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}
                    />
                    {row.unit && <span style={{ fontSize: 10, color: BD, whiteSpace: 'nowrap', flexShrink: 0 }}>{row.unit}</span>}
                  </div>
                </td>
              </tr>
            ))}

            {/* ── Microbiológicos – texto libre ── */}
            {MICRO_TEXT.map(row => (
              <tr key={row.name}>
                <td style={{ ...CELL, textAlign: 'left', verticalAlign: 'middle', padding: '8px 6px', height: 62, fontSize: 10, lineHeight: 1.25, color: '#000' }}>{row.label}</td>
                <td style={{ ...CELL, textAlign: 'center', verticalAlign: 'middle', padding: '8px 4px', fontSize: 11, color: BD }}>{row.spec}</td>
                <td style={{ ...ECELL, verticalAlign: 'middle', padding: 0 }}>
                  <input
                    disabled={!isEditable} value={val(row.name)} onChange={e => set(row.name, e.target.value)}
                    placeholder={isEditable ? 'Conforme' : ''}
                    style={{ ...BASE, color: BD, fontWeight: 700 }}
                  />
                </td>
              </tr>
            ))}

            {/* ── Microbiológicos – select ── */}
            {MICRO_SEL.map(row => (
              <tr key={row.name}>
                <td style={{ ...CELL, textAlign: 'left', verticalAlign: 'middle', padding: '8px 6px', height: 62, fontSize: 10, lineHeight: 1.25, color: BD }}>{row.label}</td>
                <td style={{ ...CELL, textAlign: 'center', verticalAlign: 'middle', padding: '8px 4px', fontSize: 11, color: BD }}>{row.spec}</td>
                <td style={{ ...ECELL, verticalAlign: 'middle', padding: 0 }}>
                  <select
                    disabled={!isEditable} value={val(row.name)} onChange={e => set(row.name, e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', textAlign: 'center', fontSize: 11, color: BD, background: 'transparent', padding: '4px 2px', cursor: isEditable ? 'pointer' : 'default', fontFamily: 'Arial, Helvetica, sans-serif' }}
                  >
                    <option value="">— Seleccionar —</option>
                    {microOpts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ════════════ PIE ════════════ */}
        <div style={{ padding: '8px 2px 0', fontSize: 11 }}>
          {isEditable ? (
            <textarea value={val('observaciones')} onChange={e => set('observaciones', e.target.value)} rows={2}
              placeholder="El resultado corresponde únicamente a la muestra referida"
              style={{ width: '100%', border: '1px solid #f59e0b', borderRadius: 4, padding: '4px 6px', fontSize: 11, resize: 'vertical', fontFamily: 'Arial, Helvetica, sans-serif', marginBottom: 8, background: '#fffde7' }} />
          ) : (
            <div style={{ marginBottom: 8 }}>{val('observaciones') || 'El resultado corresponde únicamente a la muestra referida'}</div>
          )}

          {isEditable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: BL, whiteSpace: 'nowrap' }}>DECISIÓN / RESULTADO FINAL:</span>
              <select value={val('resultado_final')} onChange={e => set('resultado_final', e.target.value)}
                style={{ border: '1px solid #f59e0b', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontFamily: 'Arial, Helvetica, sans-serif', background: '#fffde7' }}>
                <option value="">— Seleccionar —</option>
                <option value="APROBADO">APROBADO</option>
                <option value="RECHAZADO">RECHAZADO</option>
                <option value="EN REVISIÓN">EN REVISIÓN</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 110, padding: '0 6px' }}>
            <div style={{ flex: 1 }}>
              <div>F.________________________</div>
              <div style={{ marginTop: 2 }}>Analista de Control de Calidad</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>F.________________________</div>
              <div style={{ marginTop: 2 }}>Gerente de Control de Calidad</div>
            </div>
          </div>

          {!isEditable && val('resultado_final') && (
            <div style={{ marginTop: 70, paddingLeft: 60 }}>Decisión: <strong>{val('resultado_final')}</strong></div>
          )}
        </div>

        <div style={{ position: 'absolute', right: 14, bottom: 8, fontWeight: 700, fontSize: 11 }}>CC-F-063</div>
      </div>
    </div>
  );
}
