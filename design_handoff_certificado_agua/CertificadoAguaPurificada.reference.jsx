// CertificadoAguaPurificada.reference.jsx
// -----------------------------------------------------------------------------
// Referencia en React PURO del "Certificado de Análisis de Agua Purificada".
// Portado desde el prototipo HTML (Certificado Agua Purificada.dc.html).
// Adaptar a las convenciones de PharmaQMS (CSS modules / styled-components /
// Tailwind / etc.). Aquí se usan estilos inline para que sea autosuficiente.
//
// Reglas de color del formato:
//   - Texto PRE-IMPRESO del formato -> AZUL (#1f4e79 etiquetas, #2b6cb0 valores tabla)
//   - DATOS de identificación llenados -> NEGRO negrita (#000)
//   Las "especificaciones" (col 2 de determinaciones) son TEXTO FIJO, no datos.
// -----------------------------------------------------------------------------
import React from 'react';

const BLUE_LABEL = '#1f4e79';
const BLUE_DATA = '#2b6cb0';

// Estilos de celda reutilizables ------------------------------------------------
const cell = { border: '1px solid #000' };
const thLabel = { ...cell, textAlign: 'center', padding: '3px 2px', fontWeight: 700, color: BLUE_LABEL };
const tdData = { ...cell, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11 };

export default function CertificadoAguaPurificada({
  logoUrl = '',
  puntoDeUso = '9C',
  ubicacion = 'Lavado',
  nControl = 'PW100',
  nLote = 'AP240126',
  fechaAnalisis = '24-01-26',
  responsable = 'Marisol Beltran',
  fFab = '24-01-26',
  fechaEmision = '24-01-26',
  referencias = 'USP 47- NF 42',
  rTemperatura = '25.40 °C',
  rConductividad = '0.65 µS/cm',
  rToc = '18.00 ppb',
  rPh = '5.3',
  rBacterias = 'Conforme',
  rHongos = 'Conforme',
  rEcoli = 'Conforme',
  rPseudomona = 'Conforme',
  notaMuestra = 'El resultado corresponde únicamente a la muestra referida',
  codigo = 'CC-F-063',
}) {
  // Filas cortas (centradas). Especificación = texto fijo del formato.
  const rowsTop = [
    { name: 'TEMPERATURA', spec: 'No mayor a 40°C', result: rTemperatura, nameColor: BLUE_DATA },
    { name: 'CONDUCTIVIDAD', spec: 'no mayor a 1.3 µS/cm', result: rConductividad, nameColor: BLUE_DATA },
    { name: 'TOC', spec: 'No mayor a 500 ppb', result: rToc, nameColor: BLUE_DATA },
    { name: 'pH', spec: '5.0-7.0', result: rPh, nameColor: BLUE_DATA },
  ];

  // Filas microbiológicas (altas, nombre alineado a la izquierda).
  const rowsMicro = [
    { name: 'Recuento total de bacterias aerobias mesofilas', spec: '<100 UFC', result: rBacterias, nameColor: '#000' },
    { name: 'Recuento total de hongos filamentosos y levaduras', spec: '<100 UFC', result: rHongos, nameColor: '#000' },
    { name: 'Escherichia Coli, (Examen microbiologico de productos no esteriles: pruebas de microorganismos especificos', spec: 'Ausencia/100mL de muestra', result: rEcoli, nameColor: BLUE_DATA },
    { name: 'Pseudomona Aeruginosa, (Examen microbiologico de productos no esteriles: pruebas de microorganismos especificos', spec: 'Ausencia/100mL de muestra', result: rPseudomona, nameColor: BLUE_DATA },
  ];

  return (
    <div style={{ padding: '18px 0', display: 'flex', justifyContent: 'center', background: '#6f6f6f' }}>
      <div
        className="coa-page"
        style={{
          position: 'relative',
          width: 780,
          minHeight: 1009,
          background: '#fff',
          border: '1.5px solid #000',
          padding: '12px 12px 16px',
          boxShadow: '0 6px 28px rgba(0,0,0,0.35)',
          fontFamily: "'Arimo', Arial, Helvetica, sans-serif",
          color: '#000',
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 2px 10px' }}>
          <div style={{ width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="logo" style={{ maxWidth: 88, maxHeight: 66, objectFit: 'contain' }} />
            ) : (
              <div
                style={{
                  width: 78,
                  height: 60,
                  border: '1px solid #9aa',
                  background:
                    'repeating-linear-gradient(45deg,#eef2f6,#eef2f6 6px,#e2e8ee 6px,#e2e8ee 12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontSize: 9,
                  color: '#6b7785',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                LOGO
              </div>
            )}
          </div>
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
          <div style={{ width: 96 }} />
        </div>

        {/* TABLA A: identificación */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '24%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '19%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ ...thLabel, fontSize: 11 }}>PUNTO DE USO</td>
              <td style={{ ...thLabel, fontSize: 7.5, lineHeight: 1.1 }}>UBICACIÓN DEL PUNTO DE USO</td>
              <td style={{ ...thLabel, fontSize: 9 }}>N° DE CONTROL</td>
              <td style={{ ...thLabel, fontSize: 9 }}>N° DE  LOTE INTERNO</td>
              <td style={{ ...thLabel, fontSize: 9 }}>FECHA DE ANALISIS</td>
            </tr>
            <tr>
              <td style={tdData}>{puntoDeUso}</td>
              <td style={tdData}>{ubicacion}</td>
              <td style={tdData}>{nControl}</td>
              <td style={tdData}>{nLote}</td>
              <td style={tdData}>{fechaAnalisis}</td>
            </tr>
            <tr>
              <td style={{ ...thLabel, fontSize: 10 }}>RESPONSABLE DE MUESTREO</td>
              <td colSpan={2} style={{ ...thLabel, fontSize: 10 }}>F. FAB.</td>
              <td colSpan={2} style={{ ...thLabel, fontSize: 10 }}>FECHA DE EMISION</td>
            </tr>
            <tr>
              <td style={tdData}>{responsable}</td>
              <td colSpan={2} style={tdData}>{fFab}</td>
              <td colSpan={2} style={tdData}>{fechaEmision}</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ ...cell, textAlign: 'left', padding: '3px 6px', fontWeight: 700, fontSize: 10, color: BLUE_LABEL }}>
                REFERENCIAS UTILIZADAS:
              </td>
              <td colSpan={2} style={tdData}>{referencias}</td>
            </tr>
          </tbody>
        </table>

        {/* TABLA B: determinaciones */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '31%' }} />
            <col style={{ width: '37%' }} />
            <col style={{ width: '32%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ ...cell, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11, color: BLUE_LABEL }}>DETERMINACIONES</td>
              <td style={{ ...cell, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11, color: BLUE_LABEL }}>ESPECIFICACIONES</td>
              <td style={{ ...cell, textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: 11, color: BLUE_LABEL }}>RESULTADOS</td>
            </tr>

            {rowsTop.map((row, i) => (
              <tr key={`top-${i}`}>
                <td style={{ ...cell, textAlign: 'center', padding: '4px 4px', fontSize: 11, color: row.nameColor }}>{row.name}</td>
                <td style={{ ...cell, textAlign: 'center', padding: '4px 4px', fontSize: 11, color: BLUE_DATA }}>{row.spec}</td>
                <td style={{ ...cell, textAlign: 'center', padding: '4px 4px', fontSize: 11, color: BLUE_DATA }}>{row.result}</td>
              </tr>
            ))}

            {rowsMicro.map((row, i) => (
              <tr key={`micro-${i}`}>
                <td style={{ ...cell, textAlign: 'left', verticalAlign: 'middle', padding: '8px 6px', height: 62, fontSize: 10, lineHeight: 1.25, color: row.nameColor }}>{row.name}</td>
                <td style={{ ...cell, textAlign: 'center', verticalAlign: 'middle', padding: '8px 4px', fontSize: 11, color: BLUE_DATA }}>{row.spec}</td>
                <td style={{ ...cell, textAlign: 'center', verticalAlign: 'middle', padding: '8px 4px', fontSize: 11, color: BLUE_DATA }}>{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER */}
        <div style={{ padding: '8px 2px 0', fontSize: 11 }}>
          <div>{notaMuestra}</div>

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

          <div style={{ marginTop: 90, paddingLeft: 60, fontSize: 11 }}>Decisión:</div>
        </div>

        <div style={{ position: 'absolute', right: 14, bottom: 8, fontWeight: 700, fontSize: 11 }}>{codigo}</div>
      </div>
    </div>
  );
}

/*
  IMPRESIÓN — añadir a la hoja de estilos global (o en el componente de impresión):

  @page { size: letter portrait; margin: 0; }
  @media print {
    body { background: #fff; }
    .coa-page { box-shadow: none !important; margin: 0 !important; }
  }

  Tip: cargar la fuente Arimo (Google Fonts) o sustituir por Arial/Helvetica del sistema.
*/
