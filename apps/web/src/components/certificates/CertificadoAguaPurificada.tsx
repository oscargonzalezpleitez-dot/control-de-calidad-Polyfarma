'use client';
/* eslint-disable @next/next/no-img-element */
// Implementación de alta fidelidad del Certificado de Análisis de Agua Purificada.
// Fuente de verdad: design_handoff_certificado_agua/README.md
// Regla de color: texto pre-impreso → azul; datos llenados identificación → negro negrita;
// especificaciones y resultados en tabla determinaciones → azul #2b6cb0.

const BLUE_LABEL = '#1f4e79';
const BLUE_DATA  = '#2b6cb0';

// ─── Estilos de celda reutilizables ───────────────────────────────────────────
const cellBase: React.CSSProperties = { border: '1px solid #000' };

const thLabel = (fontSize: number, extra?: React.CSSProperties): React.CSSProperties => ({
  ...cellBase,
  textAlign: 'center',
  padding: '3px 2px',
  fontWeight: 700,
  color: BLUE_LABEL,
  fontSize,
  ...extra,
});

const tdData: React.CSSProperties = {
  ...cellBase,
  textAlign: 'center',
  padding: '4px 2px',
  fontWeight: 700,
  fontSize: 11,
  color: '#000',
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface CertificadoAguaProps {
  logoUrl?:       string;
  puntoDeUso?:    string;
  ubicacion?:     string;
  nControl?:      string;
  nLote?:         string;
  fechaAnalisis?: string;
  responsable?:   string;
  fFab?:          string;
  fechaEmision?:  string;
  referencias?:   string;
  rTemperatura?:  string;
  rConductividad?:string;
  rToc?:          string;
  rPh?:           string;
  rBacterias?:    string;
  rHongos?:       string;
  rEcoli?:        string;
  rPseudomona?:   string;
  notaMuestra?:   string;
  codigo?:        string;
  resultadoFinal?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CertificadoAguaPurificada({
  logoUrl       = '',
  puntoDeUso    = '—',
  ubicacion     = '—',
  nControl      = '—',
  nLote         = '—',
  fechaAnalisis = '—',
  responsable   = '—',
  fFab          = '—',
  fechaEmision  = '—',
  referencias   = 'USP 47 - NF 42',
  rTemperatura  = '—',
  rConductividad = '—',
  rToc          = '—',
  rPh           = '—',
  rBacterias    = '—',
  rHongos       = '—',
  rEcoli        = '—',
  rPseudomona   = '—',
  notaMuestra   = 'El resultado corresponde únicamente a la muestra referida',
  codigo        = 'CC-F-063',
  resultadoFinal = '',
}: CertificadoAguaProps) {

  const rowsTop = [
    { name: 'TEMPERATURA',   spec: 'No mayor a 40°C',       result: rTemperatura,   nameColor: BLUE_DATA },
    { name: 'CONDUCTIVIDAD', spec: 'no mayor a 1.3 µS/cm',  result: rConductividad, nameColor: BLUE_DATA },
    { name: 'TOC',           spec: 'No mayor a 500 ppb',    result: rToc,           nameColor: BLUE_DATA },
    { name: 'pH',            spec: '5.0-7.0',               result: rPh,            nameColor: BLUE_DATA },
  ];

  const rowsMicro = [
    {
      name: 'Recuento total de bacterias aerobias mesofilas',
      spec: '<100 UFC',
      result: rBacterias,
      nameColor: '#000',
    },
    {
      name: 'Recuento total de hongos filamentosos y levaduras',
      spec: '<100 UFC',
      result: rHongos,
      nameColor: '#000',
    },
    {
      name: 'Escherichia Coli, (Examen microbiologico de productos no esteriles: pruebas de microorganismos especificos',
      spec: 'Ausencia/100mL de muestra',
      result: rEcoli,
      nameColor: BLUE_DATA,
    },
    {
      name: 'Pseudomona Aeruginosa, (Examen microbiologico de productos no esteriles: pruebas de microorganismos especificos',
      spec: 'Ausencia/100mL de muestra',
      result: rPseudomona,
      nameColor: BLUE_DATA,
    },
  ];

  return (
    // Fondo gris de pantalla — se elimina al imprimir vía @media print
    <div
      className="coa-screen-bg"
      style={{
        padding: '18px 0 32px',
        display: 'flex',
        justifyContent: 'center',
        background: '#6f6f6f',
        minHeight: '100vh',
      }}
    >
      {/* ── Página carta ── */}
      <div
        className="coa-page"
        style={{
          position: 'relative',
          width: 780,
          minHeight: 1009,
          background: '#fff',
          border: '1.5px solid #000',
          padding: '12px 12px 16px',
          boxShadow: '0 6px 28px rgba(0,0,0,.35)',
          fontFamily: "'Arimo', Arial, Helvetica, sans-serif",
          color: '#000',
        }}
      >

        {/* ──────────────── CABECERA ──────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 2px 10px' }}>
          {/* Logo */}
          <div style={{ width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ maxWidth: 88, maxHeight: 66, objectFit: 'contain' }} />
            ) : (
              <div style={{
                width: 78, height: 60,
                border: '1px solid #99aaaa',
                background: 'repeating-linear-gradient(45deg,#eef2f6,#eef2f6 6px,#e2e8ee 6px,#e2e8ee 12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'monospace', fontSize: 9, color: '#6b7785',
                textAlign: 'center', lineHeight: 1.2,
              }}>
                LOGO
              </div>
            )}
          </div>

          {/* Título central */}
          <div style={{ flex: 1, textAlign: 'center', paddingTop: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.2px' }}>
              LABORATORIOS FARMACEUTICOS POLYFARMA
            </div>
            <div style={{ fontWeight: 700, fontSize: 12, marginTop: 2 }}>
              LABORATORIO DE CONTROL DE CALIDAD
            </div>
            <div style={{ fontWeight: 700, fontSize: 12, marginTop: 2 }}>
              CERTIFICADO DE ANALISIS DE AGUA PURIFICADA
            </div>
          </div>

          {/* Columna derecha vacía (equilibra) */}
          <div style={{ width: 96 }} />
        </div>

        {/* ──────────────── TABLA A — Identificación ──────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '24%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '19%' }} />
          </colgroup>
          <tbody>
            {/* Fila 1 — Encabezados */}
            <tr>
              <td style={thLabel(11)}>PUNTO DE USO</td>
              <td style={thLabel(7.5, { lineHeight: '1.1' })}>UBICACIÓN DEL PUNTO DE USO</td>
              <td style={thLabel(9)}>N° DE CONTROL</td>
              <td style={thLabel(9)}>N° DE&nbsp; LOTE INTERNO</td>
              <td style={thLabel(9)}>FECHA DE ANALISIS</td>
            </tr>
            {/* Fila 2 — Datos */}
            <tr>
              <td style={tdData}>{puntoDeUso}</td>
              <td style={tdData}>{ubicacion}</td>
              <td style={tdData}>{nControl}</td>
              <td style={tdData}>{nLote}</td>
              <td style={tdData}>{fechaAnalisis}</td>
            </tr>
            {/* Fila 3 — Encabezados */}
            <tr>
              <td style={thLabel(10)}>RESPONSABLE DE MUESTREO</td>
              <td colSpan={2} style={thLabel(10)}>F. FAB.</td>
              <td colSpan={2} style={thLabel(10)}>FECHA DE EMISION</td>
            </tr>
            {/* Fila 4 — Datos */}
            <tr>
              <td style={tdData}>{responsable}</td>
              <td colSpan={2} style={tdData}>{fFab}</td>
              <td colSpan={2} style={tdData}>{fechaEmision}</td>
            </tr>
            {/* Fila 5 — Referencias */}
            <tr>
              <td
                colSpan={3}
                style={{ ...cellBase, textAlign: 'left', padding: '3px 6px', fontWeight: 700, fontSize: 10, color: BLUE_LABEL }}
              >
                REFERENCIAS UTILIZADAS:
              </td>
              <td colSpan={2} style={tdData}>{referencias}</td>
            </tr>
          </tbody>
        </table>

        {/* ──────────────── TABLA B — Determinaciones ──────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '31%' }} />
            <col style={{ width: '37%' }} />
            <col style={{ width: '32%' }} />
          </colgroup>
          <tbody>
            {/* Encabezado */}
            <tr>
              <td style={{ ...cellBase, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11, color: BLUE_LABEL }}>DETERMINACIONES</td>
              <td style={{ ...cellBase, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11, color: BLUE_LABEL }}>ESPECIFICACIONES</td>
              <td style={{ ...cellBase, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11, color: BLUE_LABEL }}>RESULTADOS</td>
            </tr>

            {/* Filas cortas — parámetros fisicoquímicos */}
            {rowsTop.map((row, i) => (
              <tr key={`top-${i}`}>
                <td style={{ ...cellBase, textAlign: 'center', padding: '4px 4px', fontSize: 11, color: row.nameColor }}>
                  {row.name}
                </td>
                <td style={{ ...cellBase, textAlign: 'center', padding: '4px 4px', fontSize: 11, color: BLUE_DATA }}>
                  {row.spec}
                </td>
                <td style={{ ...cellBase, textAlign: 'center', padding: '4px 4px', fontSize: 11, color: BLUE_DATA }}>
                  {row.result}
                </td>
              </tr>
            ))}

            {/* Filas altas — parámetros microbiológicos (height:62px) */}
            {rowsMicro.map((row, i) => (
              <tr key={`micro-${i}`}>
                <td style={{
                  ...cellBase,
                  textAlign: 'left', verticalAlign: 'middle',
                  padding: '8px 6px', height: 62, fontSize: 10, lineHeight: 1.25,
                  color: row.nameColor,
                }}>
                  {row.name}
                </td>
                <td style={{ ...cellBase, textAlign: 'center', verticalAlign: 'middle', padding: '8px 4px', fontSize: 11, color: BLUE_DATA }}>
                  {row.spec}
                </td>
                <td style={{ ...cellBase, textAlign: 'center', verticalAlign: 'middle', padding: '8px 4px', fontSize: 11, color: BLUE_DATA }}>
                  {row.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ──────────────── PIE ──────────────── */}
        <div style={{ padding: '8px 2px 0', fontSize: 11 }}>
          <div>{notaMuestra}</div>

          {/* Bloque de firmas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 150, padding: '0 6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11 }}>F.________________________</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>Analista de Control de Calidad</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11 }}>F.________________________</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>Gerente de Control de Calidad</div>
            </div>
          </div>

          <div style={{ marginTop: 90, paddingLeft: 60, fontSize: 11 }}>Decisión: {resultadoFinal && <strong>{resultadoFinal}</strong>}</div>
        </div>

        {/* Código de documento — esquina inferior derecha */}
        <div style={{ position: 'absolute', right: 14, bottom: 8, fontWeight: 700, fontSize: 11 }}>
          {codigo}
        </div>

      </div>
    </div>
  );
}
