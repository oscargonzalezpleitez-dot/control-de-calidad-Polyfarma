# Handoff: Certificado de Análisis de Agua Purificada (PharmaQMS)

## Overview
Formato imprimible (tamaño carta vertical) que certifica el análisis de control de
calidad de **agua purificada** en un laboratorio farmacéutico. Reproduce un formato
pre-impreso oficial: cabecera con logo y títulos, una tabla de identificación de la
muestra, una tabla de determinaciones (especificación vs. resultado), zona de firmas
y código de documento. Se llena con los datos de cada análisis y se imprime / exporta a PDF.

## About the Design Files
Los archivos de este paquete son **referencias de diseño creadas en HTML** — un
prototipo que muestra el aspecto y comportamiento deseados, **no** código de producción
para copiar tal cual. La tarea es **recrear este diseño dentro del entorno existente de
PharmaQMS** (React/Vue/lo que use el proyecto), reutilizando sus patrones, librerías y
sistema de impresión/PDF ya establecidos. Si el proyecto no tiene aún un entorno
definido, elegir el framework más apropiado e implementarlo allí.

Incluido:
- `Certificado Agua Purificada.dc.html` — el prototipo original (componente con datos
  por props). Es la **fuente de verdad** del layout, medidas y colores.
- `CertificadoAguaPurificada.reference.jsx` — el mismo componente portado a **React puro**
  (sin dependencias del runtime del prototipo) listo para adaptar al proyecto.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, tamaños, anchos de columna y espaciados
son finales y deben reproducirse con precisión. Reusa las librerías/estilos del codebase,
pero respeta los valores exactos documentados abajo (es un formato controlado).

## Screens / Views

### Vista única: Certificado (1 página carta vertical)
- **Propósito:** mostrar y/o imprimir el certificado de un análisis de agua purificada.
- **Contenedor de página:**
  - `width: 780px` (pantalla), `min-height: 1009px`, fondo `#ffffff`.
  - Borde exterior `1.5px solid #000` que encierra TODO el contenido.
  - `padding: 12px 12px 16px`. `position: relative` (para fijar el código abajo-derecha).
  - Centrada sobre fondo gris `#6f6f6f` en pantalla; sombra `0 6px 28px rgba(0,0,0,.35)`
    (se elimina al imprimir).
  - Fuente base: `'Arimo', Arial, Helvetica, sans-serif`, color `#000`.

- **1. Cabecera** (`display:flex; align-items:flex-start; gap:8px; padding:2px 2px 10px`)
  - Columna izquierda `width:96px`: logo (img máx 88×66px, `object-fit:contain`). Si no hay
    logo, marcador 78×60px con borde `1px solid #9aa`, fondo de rayas diagonales
    (`repeating-linear-gradient(45deg,#eef2f6,#eef2f6 6px,#e2e8ee 6px,#e2e8ee 12px)`),
    texto monospace 9px `#6b7785` centrado: "LOGO".
  - Centro (`flex:1; text-align:center; padding-top:4px`), 3 líneas en **negrita negro**:
    - "LABORATORIOS FARMACEUTICOS POLYFARMA" — 13px, `letter-spacing:.2px`
    - "LABORATORIO DE CONTROL DE CALIDAD" — 12px, `margin-top:2px`
    - "CERTIFICADO DE ANALISIS DE AGUA PURIFICADA" — 12px, `margin-top:2px`
  - Columna derecha `width:96px` vacía (equilibra el centrado del título).

- **2. Tabla A — Identificación** (`width:100%; border-collapse:collapse; table-layout:fixed`)
  - 5 columnas, anchos: **24% / 22% / 15% / 20% / 19%**.
  - Toda celda: `border:1px solid #000`, `text-align:center` (salvo se indique).
  - Fila 1 (encabezados, **azul `#1f4e79` negrita**, `padding:3px 2px`):
    `PUNTO DE USO` (11px) · `UBICACIÓN DEL PUNTO DE USO` (7.5px, `line-height:1.1`) ·
    `N° DE CONTROL` (9px) · `N° DE  LOTE INTERNO` (9px) · `FECHA DE ANALISIS` (9px)
  - Fila 2 (datos, **negro negrita 11px**, `padding:4px 2px`):
    `puntoDeUso` · `ubicacion` · `nControl` · `nLote` · `fechaAnalisis`
  - Fila 3 (encabezados azul `#1f4e79` negrita 10px): `RESPONSABLE DE MUESTREO` ·
    `F. FAB.` *(colspan 2)* · `FECHA DE EMISION` *(colspan 2)*
  - Fila 4 (datos negro negrita 11px): `responsable` · `fFab` *(colspan 2)* ·
    `fechaEmision` *(colspan 2)*
  - Fila 5: `REFERENCIAS UTILIZADAS:` *(colspan 3, `text-align:left`, `padding:3px 6px`,
    azul `#1f4e79` negrita 10px)* · `referencias` *(colspan 2, centro, negro negrita 11px)*

- **3. Tabla B — Determinaciones** (`width:100%; border-collapse:collapse; table-layout:fixed`)
  - 3 columnas, anchos: **31% / 37% / 32%**. Toda celda `border:1px solid #000`.
  - Fila encabezado (azul `#1f4e79` negrita 11px, centro, `padding:4px 2px`):
    `DETERMINACIONES` · `ESPECIFICACIONES` · `RESULTADOS`
  - **4 filas cortas** (centradas, 11px, `padding:4px 4px`). Nombre col 1 azul `#2b6cb0`;
    especificación y resultado azul `#2b6cb0`:
    | Nombre (col1) | Especificación (col2, fija) | Resultado (col3, dato) |
    |---|---|---|
    | TEMPERATURA | No mayor a 40°C | `rTemperatura` (ej. 25.40 °C) |
    | CONDUCTIVIDAD | no mayor a 1.3 µS/cm | `rConductividad` (ej. 0.65 µS/cm) |
    | TOC | No mayor a 500 ppb | `rToc` (ej. 18.00 ppb) |
    | pH | 5.0-7.0 | `rPh` (ej. 5.3) |
  - **4 filas altas** (`height:62px`, `vertical-align:middle`, `padding:8px 6px`/`8px 4px`).
    Nombre col 1 alineado a la **izquierda**, 10px, `line-height:1.25`. Especificación y
    resultado centrados, 11px, azul `#2b6cb0`:
    | Nombre (col1) | Color nombre | Especificación (col2) | Resultado (col3) |
    |---|---|---|---|
    | Recuento total de bacterias aerobias mesofilas | **negro** `#000` | <100 UFC | `rBacterias` |
    | Recuento total de hongos filamentosos y levaduras | **negro** `#000` | <100 UFC | `rHongos` |
    | Escherichia Coli, (Examen microbiologico de productos no esteriles: pruebas de microorganismos especificos | azul `#2b6cb0` | Ausencia/100mL de muestra | `rEcoli` |
    | Pseudomona Aeruginosa, (Examen microbiologico de productos no esteriles: pruebas de microorganismos especificos | azul `#2b6cb0` | Ausencia/100mL de muestra | `rPseudomona` |

- **4. Pie** (`padding:8px 2px 0; font-size:11px`)
  - Línea: `notaMuestra` (default "El resultado corresponde únicamente a la muestra referida").
  - Bloque de firmas: `display:flex; justify-content:space-between; gap:40px; margin-top:150px;
    padding:0 6px`. Dos columnas iguales (`flex:1`):
    - "F.________________________" + (2px) "Analista de Control de Calidad"
    - "F.________________________" + (2px) "Gerente de Control de Calidad"
  - "Decisión:" — `margin-top:90px; padding-left:60px`.
  - Código de documento: `position:absolute; right:14px; bottom:8px; font-weight:700;
    font-size:11px` → `codigo` (default "CC-F-063").

## Interactions & Behavior
- Estático/sólo lectura + impresión. No hay navegación interna ni estados hover.
- **Impresión / PDF:** `@page { size: letter portrait; margin: 0 }`. En `@media print`
  poner fondo blanco y quitar la sombra/márgenes del contenedor para que ocupe
  exactamente UNA hoja carta.
- **Regla de color (clave del formato):** el texto **pre-impreso** del formato va en
  **azul**; los **datos llenados** de identificación van en **negro negrita**. Los valores
  de la tabla de determinaciones (especificaciones y resultados) van en azul `#2b6cb0`.
- (Opcional, si el proyecto lo desea) lógica automática Conforme/No Conforme comparando
  resultado numérico vs. especificación; **no** está implementada en el prototipo.

## State Management
- Sin estado interno. El componente es **presentacional**: recibe todos los valores por
  props (ver tabla de Design Tokens / props). Las especificaciones (columna 2 de la tabla
  de determinaciones) son **texto fijo del formato**, no props.

## Design Tokens

### Colores
| Token | Hex | Uso |
|---|---|---|
| Azul etiqueta | `#1f4e79` | Encabezados de tabla, "REFERENCIAS UTILIZADAS:" |
| Azul dato | `#2b6cb0` | Especificaciones y resultados; nombres de determinación (excepto los 2 "Recuento total") |
| Negro | `#000000` | Datos de identificación (negrita), nombres "Recuento total", bordes, títulos |
| Blanco | `#ffffff` | Fondo de página |
| Gris fondo | `#6f6f6f` | Fondo de pantalla (no se imprime) |
| Marcador logo borde | `#9aa…` (`#99aaaa`) | Borde del placeholder de logo |
| Marcador logo rayas | `#eef2f6` / `#e2e8ee` | Fondo a rayas del placeholder |
| Marcador logo texto | `#6b7785` | Texto "LOGO" |

### Tipografía
- Familia: `'Arimo', Arial, Helvetica, sans-serif` (Arimo = métrica equivalente a Arial).
- Tamaños: 7.5px (encabezado ubicación), 9px (encabezados estrechos), 10px (encabezados
  fila 3/5 y nombres de filas altas), 11px (base de datos y resultados), 12px (subtítulos),
  13px (título principal).
- Pesos: 700 (encabezados, datos de identificación, título, código); 400 (especificaciones,
  resultados, nota, firmas).

### Bordes / espaciado
- Borde exterior: `1.5px solid #000`. Bordes de celda: `1px solid #000`. `border-collapse:collapse`.
- Sin border-radius. Sombra de pantalla: `0 6px 28px rgba(0,0,0,.35)` (se quita al imprimir).
- Anchos de columna Tabla A: 24/22/15/20/19%. Tabla B: 31/37/32%.
- Altura de filas microbiológicas: `62px`.

### Props (interfaz de datos — todas string)
`logoUrl?` (vacío → placeholder), `puntoDeUso`, `ubicacion`, `nControl`, `nLote`,
`fechaAnalisis`, `responsable`, `fFab`, `fechaEmision`, `referencias`, `rTemperatura`,
`rConductividad`, `rToc`, `rPh`, `rBacterias`, `rHongos`, `rEcoli`, `rPseudomona`,
`notaMuestra`, `codigo`. Defaults del ejemplo en `CertificadoAguaPurificada.reference.jsx`.

## Assets
- **Logo:** no incluido. Pasar la URL real del logo de Polyfarma en `logoUrl`; si está vacío
  se muestra un placeholder a rayas. Sustituir por el sistema de assets/branding del codebase.
- No se usan iconos ni imágenes adicionales. No hay SVG hechos a mano.

## Files
- `Certificado Agua Purificada.dc.html` — prototipo original (fuente de verdad del diseño).
- `CertificadoAguaPurificada.reference.jsx` — port a React puro, listo para adaptar.
- `README.md` — este documento (autosuficiente).
