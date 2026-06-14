/**
 * Seed: Formatos de Control de Calidad Farmacéutico
 * - Liberación de Lote de Agua
 * - Análisis de Producto Semiterminado
 * - Análisis de Producto Terminado
 */

import { PrismaClient, FormatType, FormatStatus, FieldType, ApprovalRole, ApprovalStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creando formatos de Control de Calidad...\n');

  // Obtener usuario admin como creador
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', isDeleted: false } });
  const calidad = await prisma.user.findFirst({ where: { role: 'QUALITY', isDeleted: false } });
  if (!admin) throw new Error('No se encontró usuario ADMIN. Ejecute el seed principal primero.');

  const aprobadorId = calidad?.id ?? admin.id;

  // ═══════════════════════════════════════════════════════════════
  // 1. LIBERACIÓN DE LOTE DE AGUA
  // ═══════════════════════════════════════════════════════════════
  const agua = await prisma.format.upsert({
    where: { code: 'QC-AGUA-001' },
    update: {},
    create: {
      code: 'QC-AGUA-001',
      name: 'Liberación de Lote de Agua Purificada / WFI',
      description: 'Registro de análisis y liberación de agua purificada (PW) y agua para inyectables (WFI) según USP <1231> y EP 0169.',
      type: FormatType.BATCH_RECORD,
      status: FormatStatus.APPROVED,
      version: '1.0',
      department: 'Control de Calidad',
      effectiveDate: new Date(),
      retentionPeriod: 10,
      createdById: admin.id,
    },
  });

  // Eliminar secciones/campos previos si se re-ejecuta
  await prisma.formatField.deleteMany({ where: { formatId: agua.id } });
  await prisma.formatSection.deleteMany({ where: { formatId: agua.id } });
  await prisma.formatApproval.deleteMany({ where: { formatId: agua.id } });

  const aguaSec1 = await prisma.formatSection.create({
    data: { formatId: agua.id, name: 'Identificación del Lote', order: 1 },
  });
  const aguaSec2 = await prisma.formatSection.create({
    data: { formatId: agua.id, name: 'Parámetros Fisicoquímicos', order: 2 },
  });
  const aguaSec3 = await prisma.formatSection.create({
    data: { formatId: agua.id, name: 'Parámetros Microbiológicos', order: 3 },
  });
  const aguaSec4 = await prisma.formatSection.create({
    data: { formatId: agua.id, name: 'Decisión de Liberación', order: 4 },
  });

  await prisma.formatField.createMany({
    data: [
      // Sec 1 - Identificación
      { formatId: agua.id, sectionId: aguaSec1.id, label: 'Número de Lote', name: 'numero_lote', type: FieldType.TEXT, order: 1, isRequired: true, placeholder: 'Ej: PW-2024-001' },
      { formatId: agua.id, sectionId: aguaSec1.id, label: 'Tipo de Agua', name: 'tipo_agua', type: FieldType.SELECT, order: 2, isRequired: true, options: JSON.stringify(['Agua Purificada (PW)', 'Agua para Inyectables (WFI)', 'Agua de Alimentación']) },
      { formatId: agua.id, sectionId: aguaSec1.id, label: 'Fecha de Producción', name: 'fecha_produccion', type: FieldType.DATE, order: 3, isRequired: true },
      { formatId: agua.id, sectionId: aguaSec1.id, label: 'Punto de Muestreo', name: 'punto_muestreo', type: FieldType.TEXT, order: 4, isRequired: true, placeholder: 'Ej: Loop 1 - Salida destilador' },
      { formatId: agua.id, sectionId: aguaSec1.id, label: 'Equipo de Purificación', name: 'equipo', type: FieldType.TEXT, order: 5, placeholder: 'Código del equipo' },
      { formatId: agua.id, sectionId: aguaSec1.id, label: 'Analista Responsable', name: 'analista', type: FieldType.TEXT, order: 6, isRequired: true },
      // Sec 2 - Fisicoquímicos
      { formatId: agua.id, sectionId: aguaSec2.id, label: 'Apariencia', name: 'apariencia', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['Límpida y transparente ✓', 'Turbia ✗', 'Con partículas visibles ✗']) },
      { formatId: agua.id, sectionId: aguaSec2.id, label: 'pH (5.0 – 7.0)', name: 'ph', type: FieldType.NUMBER, order: 2, isRequired: true, minValue: 0, maxValue: 14, decimalPlaces: 2, unit: 'unidades pH', helpText: 'Límite de aceptación: 5.0 – 7.0' },
      { formatId: agua.id, sectionId: aguaSec2.id, label: 'Conductividad (≤ 1.3 μS/cm a 25 °C)', name: 'conductividad', type: FieldType.NUMBER, order: 3, isRequired: true, minValue: 0, maxValue: 999, decimalPlaces: 2, unit: 'μS/cm', helpText: 'Límite USP/Ph.Eur: ≤ 1.3 μS/cm' },
      { formatId: agua.id, sectionId: aguaSec2.id, label: 'TOC — Carbono Orgánico Total (≤ 500 ppb)', name: 'toc', type: FieldType.NUMBER, order: 4, isRequired: true, minValue: 0, decimalPlaces: 1, unit: 'ppb', helpText: 'Límite USP <643>: ≤ 500 ppb' },
      { formatId: agua.id, sectionId: aguaSec2.id, label: 'Temperatura de Muestreo', name: 'temperatura', type: FieldType.NUMBER, order: 5, isRequired: true, decimalPlaces: 1, unit: '°C' },
      { formatId: agua.id, sectionId: aguaSec2.id, label: 'Nitratos (≤ 0.2 ppm)', name: 'nitratos', type: FieldType.NUMBER, order: 6, decimalPlaces: 2, unit: 'ppm' },
      { formatId: agua.id, sectionId: aguaSec2.id, label: 'Metales Pesados (≤ 0.1 ppm)', name: 'metales_pesados', type: FieldType.NUMBER, order: 7, decimalPlaces: 2, unit: 'ppm' },
      // Sec 3 - Microbiológicos
      { formatId: agua.id, sectionId: aguaSec3.id, label: 'Recuento de Bacterias Aerobias (≤ 100 UFC/mL PW)', name: 'bioburden', type: FieldType.NUMBER, order: 1, isRequired: true, minValue: 0, decimalPlaces: 0, unit: 'UFC/mL', helpText: 'PW: ≤100 UFC/mL | WFI: ≤10 UFC/100mL' },
      { formatId: agua.id, sectionId: aguaSec3.id, label: 'Endotoxinas Bacterianas (≤ 0.25 EU/mL WFI)', name: 'endotoxinas', type: FieldType.NUMBER, order: 2, decimalPlaces: 3, unit: 'EU/mL', helpText: 'Aplica solo para WFI — Límite: ≤ 0.25 EU/mL' },
      { formatId: agua.id, sectionId: aguaSec3.id, label: 'Pseudomonas aeruginosa', name: 'pseudomonas', type: FieldType.SELECT, order: 3, isRequired: true, options: JSON.stringify(['Ausente ✓', 'Presente ✗']) },
      { formatId: agua.id, sectionId: aguaSec3.id, label: 'Staphylococcus aureus', name: 'staph_aureus', type: FieldType.SELECT, order: 4, isRequired: true, options: JSON.stringify(['Ausente ✓', 'Presente ✗']) },
      { formatId: agua.id, sectionId: aguaSec3.id, label: 'E. coli / Coliformes Totales', name: 'e_coli', type: FieldType.SELECT, order: 5, isRequired: true, options: JSON.stringify(['Ausente ✓', 'Presente ✗']) },
      { formatId: agua.id, sectionId: aguaSec3.id, label: 'Fecha de Resultado Microbiológico', name: 'fecha_micro', type: FieldType.DATE, order: 6, isRequired: true },
      // Sec 4 - Decisión
      { formatId: agua.id, sectionId: aguaSec4.id, label: 'Resultado Final', name: 'resultado_final', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['APROBADO — Cumple especificaciones', 'RECHAZADO — No cumple especificaciones', 'PENDIENTE — En investigación']) },
      { formatId: agua.id, sectionId: aguaSec4.id, label: 'Observaciones / Desviaciones', name: 'observaciones', type: FieldType.TEXTAREA, order: 2, placeholder: 'Registre cualquier desviación o comentario relevante' },
      { formatId: agua.id, sectionId: aguaSec4.id, label: 'Firma Analista de Control de Calidad', name: 'firma_analista', type: FieldType.SIGNATURE, order: 3, isRequired: true, helpText: 'Identidad verificada — 21 CFR Part 11' },
      { formatId: agua.id, sectionId: aguaSec4.id, label: 'Firma Supervisor / Jefe de Control de Calidad', name: 'firma_supervisor', type: FieldType.SIGNATURE, order: 4, isRequired: true, helpText: 'Aprobación de liberación del lote' },
    ],
  });

  await prisma.formatApproval.createMany({
    data: [
      { formatId: agua.id, userId: admin.id, role: ApprovalRole.ELABORATED_BY, status: ApprovalStatus.APPROVED, order: 1, signedAt: new Date(), comments: 'Elaborado en el sistema' },
      { formatId: agua.id, userId: aprobadorId, role: ApprovalRole.APPROVED_BY, status: ApprovalStatus.APPROVED, order: 2, signedAt: new Date(), comments: 'Aprobado — Cumple requisitos GxP' },
    ],
  });

  console.log('✓ QC-AGUA-001 — Liberación de Lote de Agua creado');

  // ═══════════════════════════════════════════════════════════════
  // 2. ANÁLISIS DE PRODUCTO SEMITERMINADO
  // ═══════════════════════════════════════════════════════════════
  const semi = await prisma.format.upsert({
    where: { code: 'QC-SEMI-001' },
    update: {},
    create: {
      code: 'QC-SEMI-001',
      name: 'Análisis de Producto Semiterminado',
      description: 'Control de calidad en proceso (IPC) y análisis de producto semiterminado antes del acondicionamiento final.',
      type: FormatType.BATCH_RECORD,
      status: FormatStatus.APPROVED,
      version: '1.0',
      department: 'Control de Calidad',
      effectiveDate: new Date(),
      retentionPeriod: 10,
      createdById: admin.id,
    },
  });

  await prisma.formatField.deleteMany({ where: { formatId: semi.id } });
  await prisma.formatSection.deleteMany({ where: { formatId: semi.id } });
  await prisma.formatApproval.deleteMany({ where: { formatId: semi.id } });

  const semiSec1 = await prisma.formatSection.create({ data: { formatId: semi.id, name: 'Identificación', order: 1 } });
  const semiSec2 = await prisma.formatSection.create({ data: { formatId: semi.id, name: 'Parámetros Organolépticos', order: 2 } });
  const semiSec3 = await prisma.formatSection.create({ data: { formatId: semi.id, name: 'Parámetros Fisicoquímicos', order: 3 } });
  const semiSec4 = await prisma.formatSection.create({ data: { formatId: semi.id, name: 'Valoración y Pureza (HPLC/UV)', order: 4 } });
  const semiSec5 = await prisma.formatSection.create({ data: { formatId: semi.id, name: 'Decisión del Analista', order: 5 } });

  await prisma.formatField.createMany({
    data: [
      // Sec 1 - Identificación
      { formatId: semi.id, sectionId: semiSec1.id, label: 'Nombre del Producto', name: 'nombre_producto', type: FieldType.TEXT, order: 1, isRequired: true },
      { formatId: semi.id, sectionId: semiSec1.id, label: 'Número de Lote', name: 'numero_lote', type: FieldType.TEXT, order: 2, isRequired: true },
      { formatId: semi.id, sectionId: semiSec1.id, label: 'Etapa de Proceso', name: 'etapa_proceso', type: FieldType.SELECT, order: 3, isRequired: true, options: JSON.stringify(['Granulación Húmeda', 'Granulación Seca', 'Mezclado/Blending', 'Compresión', 'Recubrimiento', 'Llenado Aséptico', 'Suspensión Bulk', 'Crema/Ungüento Bulk']) },
      { formatId: semi.id, sectionId: semiSec1.id, label: 'Fecha de Análisis', name: 'fecha_analisis', type: FieldType.DATE, order: 4, isRequired: true },
      { formatId: semi.id, sectionId: semiSec1.id, label: 'Analista', name: 'analista', type: FieldType.TEXT, order: 5, isRequired: true },
      { formatId: semi.id, sectionId: semiSec1.id, label: 'Número de Orden de Producción', name: 'orden_produccion', type: FieldType.TEXT, order: 6 },
      { formatId: semi.id, sectionId: semiSec1.id, label: 'Tamaño de Lote (kg / L / unidades)', name: 'tamano_lote', type: FieldType.NUMBER, order: 7, isRequired: true, decimalPlaces: 2, unit: 'kg/L/uds' },
      // Sec 2 - Organolépticos
      { formatId: semi.id, sectionId: semiSec2.id, label: 'Aspecto Visual', name: 'aspecto', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['Conforme con especificación ✓', 'No conforme ✗']) },
      { formatId: semi.id, sectionId: semiSec2.id, label: 'Color', name: 'color', type: FieldType.TEXT, order: 2, isRequired: true, placeholder: 'Describir color observado' },
      { formatId: semi.id, sectionId: semiSec2.id, label: 'Olor', name: 'olor', type: FieldType.SELECT, order: 3, options: JSON.stringify(['Característico ✓', 'Sin olor', 'Olor extraño ✗']) },
      { formatId: semi.id, sectionId: semiSec2.id, label: 'Descripción Organoléptica', name: 'descripcion_organoleptica', type: FieldType.TEXTAREA, order: 4, placeholder: 'Descripción detallada según monografía' },
      // Sec 3 - Fisicoquímicos
      { formatId: semi.id, sectionId: semiSec3.id, label: 'pH', name: 'ph', type: FieldType.NUMBER, order: 1, decimalPlaces: 2, unit: 'unidades pH', helpText: 'Según especificación del producto' },
      { formatId: semi.id, sectionId: semiSec3.id, label: 'Densidad / Peso Específico', name: 'densidad', type: FieldType.NUMBER, order: 2, decimalPlaces: 4, unit: 'g/mL' },
      { formatId: semi.id, sectionId: semiSec3.id, label: 'Viscosidad', name: 'viscosidad', type: FieldType.NUMBER, order: 3, decimalPlaces: 1, unit: 'cP' },
      { formatId: semi.id, sectionId: semiSec3.id, label: 'Humedad / Pérdida por Secado (%)', name: 'humedad', type: FieldType.NUMBER, order: 4, decimalPlaces: 2, unit: '%', helpText: 'Límite habitual: ≤ 3.0%' },
      { formatId: semi.id, sectionId: semiSec3.id, label: 'Distribución de Tamaño de Partícula (D50)', name: 'tamaño_particula', type: FieldType.NUMBER, order: 5, decimalPlaces: 1, unit: 'μm' },
      { formatId: semi.id, sectionId: semiSec3.id, label: 'Densidad Aparente', name: 'densidad_aparente', type: FieldType.NUMBER, order: 6, decimalPlaces: 3, unit: 'g/mL' },
      { formatId: semi.id, sectionId: semiSec3.id, label: 'Índice de Compresibilidad (Carr %)', name: 'carr_index', type: FieldType.NUMBER, order: 7, decimalPlaces: 1, unit: '%', helpText: '≤ 15%: Excelente fluidez | > 25%: Pobre' },
      { formatId: semi.id, sectionId: semiSec3.id, label: 'Uniformidad de Mezcla (% RSD)', name: 'uniformidad_mezcla', type: FieldType.NUMBER, order: 8, decimalPlaces: 2, unit: '% RSD', helpText: 'Límite: ≤ 2.0% RSD' },
      // Sec 4 - HPLC
      { formatId: semi.id, sectionId: semiSec4.id, label: 'Método Analítico', name: 'metodo_analitico', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['HPLC-UV', 'HPLC-DAD', 'HPLC-MS', 'UV/Vis Espectrofotometría', 'Titulación', 'GC']) },
      { formatId: semi.id, sectionId: semiSec4.id, label: 'Número de Referencia del Método', name: 'ref_metodo', type: FieldType.TEXT, order: 2, placeholder: 'Ej: MA-CQ-012 Rev.3' },
      { formatId: semi.id, sectionId: semiSec4.id, label: 'Identidad del Principio Activo', name: 'identidad_pa', type: FieldType.SELECT, order: 3, isRequired: true, options: JSON.stringify(['Positivo — Tiempo retención conforme ✓', 'Negativo — No identificado ✗']) },
      { formatId: semi.id, sectionId: semiSec4.id, label: 'Valoración / Potencia (%)', name: 'valoracion', type: FieldType.NUMBER, order: 4, isRequired: true, minValue: 90, maxValue: 110, decimalPlaces: 2, unit: '%', helpText: 'Especificación típica: 98.0% – 102.0%' },
      { formatId: semi.id, sectionId: semiSec4.id, label: 'Impureza Conocida A (%)', name: 'impureza_a', type: FieldType.NUMBER, order: 5, decimalPlaces: 3, unit: '%' },
      { formatId: semi.id, sectionId: semiSec4.id, label: 'Impureza Conocida B (%)', name: 'impureza_b', type: FieldType.NUMBER, order: 6, decimalPlaces: 3, unit: '%' },
      { formatId: semi.id, sectionId: semiSec4.id, label: 'Impurezas Totales (%)', name: 'impurezas_totales', type: FieldType.NUMBER, order: 7, isRequired: true, decimalPlaces: 3, unit: '%', helpText: 'Límite ICH Q3B: ≤ 0.5%' },
      // Sec 5 - Decisión
      { formatId: semi.id, sectionId: semiSec5.id, label: 'Resultado del Análisis', name: 'resultado', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['CONFORME — Proceder a acondicionamiento', 'NO CONFORME — Retener lote', 'PENDIENTE — Resultados incompletos']) },
      { formatId: semi.id, sectionId: semiSec5.id, label: 'Observaciones / Desviaciones', name: 'observaciones', type: FieldType.TEXTAREA, order: 2 },
      { formatId: semi.id, sectionId: semiSec5.id, label: 'Firma Analista de Control de Calidad', name: 'firma_analista', type: FieldType.SIGNATURE, order: 3, isRequired: true, helpText: 'Verificación de identidad requerida — 21 CFR Part 11' },
      { formatId: semi.id, sectionId: semiSec5.id, label: 'Firma Jefe de Control de Calidad', name: 'firma_jefe_qc', type: FieldType.SIGNATURE, order: 4, isRequired: true, helpText: 'Revisión y aprobación del jefe de QC' },
    ],
  });

  await prisma.formatApproval.createMany({
    data: [
      { formatId: semi.id, userId: admin.id, role: ApprovalRole.ELABORATED_BY, status: ApprovalStatus.APPROVED, order: 1, signedAt: new Date(), comments: 'Elaborado en el sistema' },
      { formatId: semi.id, userId: aprobadorId, role: ApprovalRole.APPROVED_BY, status: ApprovalStatus.APPROVED, order: 2, signedAt: new Date(), comments: 'Aprobado — Cumple requisitos GxP' },
    ],
  });

  console.log('✓ QC-SEMI-001 — Análisis de Producto Semiterminado creado');

  // ═══════════════════════════════════════════════════════════════
  // 3. ANÁLISIS DE PRODUCTO TERMINADO
  // ═══════════════════════════════════════════════════════════════
  const term = await prisma.format.upsert({
    where: { code: 'QC-TERM-001' },
    update: {},
    create: {
      code: 'QC-TERM-001',
      name: 'Análisis de Producto Terminado — Certificado de Análisis',
      description: 'Análisis completo del producto terminado para liberación del lote. Genera el Certificado de Análisis (CoA) conforme a GMP/ICH Q6A.',
      type: FormatType.CERTIFICATE,
      status: FormatStatus.APPROVED,
      version: '1.0',
      department: 'Control de Calidad',
      effectiveDate: new Date(),
      retentionPeriod: 10,
      createdById: admin.id,
    },
  });

  await prisma.formatField.deleteMany({ where: { formatId: term.id } });
  await prisma.formatSection.deleteMany({ where: { formatId: term.id } });
  await prisma.formatApproval.deleteMany({ where: { formatId: term.id } });

  const termSec1 = await prisma.formatSection.create({ data: { formatId: term.id, name: 'Identificación del Producto', order: 1 } });
  const termSec2 = await prisma.formatSection.create({ data: { formatId: term.id, name: 'Control Organoléptico', order: 2 } });
  const termSec3 = await prisma.formatSection.create({ data: { formatId: term.id, name: 'Control Fisicoquímico', order: 3 } });
  const termSec4 = await prisma.formatSection.create({ data: { formatId: term.id, name: 'Valoración y Pureza', order: 4 } });
  const termSec5 = await prisma.formatSection.create({ data: { formatId: term.id, name: 'Control Microbiológico', order: 5 } });
  const termSec6 = await prisma.formatSection.create({ data: { formatId: term.id, name: 'Decisión de Liberación del Lote', order: 6 } });

  await prisma.formatField.createMany({
    data: [
      // Sec 1 - Identificación
      { formatId: term.id, sectionId: termSec1.id, label: 'Nombre del Producto', name: 'nombre_producto', type: FieldType.TEXT, order: 1, isRequired: true },
      { formatId: term.id, sectionId: termSec1.id, label: 'Principio Activo (INN)', name: 'principio_activo', type: FieldType.TEXT, order: 2, isRequired: true },
      { formatId: term.id, sectionId: termSec1.id, label: 'Concentración / Potencia', name: 'concentracion', type: FieldType.TEXT, order: 3, isRequired: true, placeholder: 'Ej: 500 mg/tableta, 250 mg/5 mL' },
      { formatId: term.id, sectionId: termSec1.id, label: 'Forma Farmacéutica', name: 'forma_farmaceutica', type: FieldType.SELECT, order: 4, isRequired: true, options: JSON.stringify(['Tabletas recubiertas', 'Tabletas no recubiertas', 'Cápsulas duras', 'Cápsulas blandas', 'Solución oral', 'Suspensión oral', 'Solución inyectable', 'Polvo para inyección', 'Crema', 'Ungüento', 'Gel', 'Supositorio', 'Parche transdérmico']) },
      { formatId: term.id, sectionId: termSec1.id, label: 'Número de Lote', name: 'numero_lote', type: FieldType.TEXT, order: 5, isRequired: true },
      { formatId: term.id, sectionId: termSec1.id, label: 'Número de Registro Sanitario', name: 'registro_sanitario', type: FieldType.TEXT, order: 6, isRequired: true, placeholder: 'INVIMA/FDA/EMA' },
      { formatId: term.id, sectionId: termSec1.id, label: 'Fecha de Fabricación', name: 'fecha_fabricacion', type: FieldType.DATE, order: 7, isRequired: true },
      { formatId: term.id, sectionId: termSec1.id, label: 'Fecha de Vencimiento', name: 'fecha_vencimiento', type: FieldType.DATE, order: 8, isRequired: true },
      { formatId: term.id, sectionId: termSec1.id, label: 'Tamaño de Lote (unidades)', name: 'tamano_lote', type: FieldType.NUMBER, order: 9, isRequired: true, decimalPlaces: 0, unit: 'unidades' },
      { formatId: term.id, sectionId: termSec1.id, label: 'Monografía de Referencia', name: 'monografia', type: FieldType.SELECT, order: 10, isRequired: true, options: JSON.stringify(['USP/NF', 'Ph.Eur. (Farmacopea Europea)', 'BP (British Pharmacopoeia)', 'JP (Japanese Pharmacopoeia)', 'FU (Farmacopea de los EE.UU.)', 'Farmacopea Colombiana', 'Especificación Propia del Fabricante']) },
      // Sec 2 - Organoléptico
      { formatId: term.id, sectionId: termSec2.id, label: 'Aspecto / Descripción', name: 'aspecto', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['Conforme con especificación ✓', 'No conforme ✗']) },
      { formatId: term.id, sectionId: termSec2.id, label: 'Color', name: 'color', type: FieldType.TEXT, order: 2, isRequired: true },
      { formatId: term.id, sectionId: termSec2.id, label: 'Olor', name: 'olor', type: FieldType.SELECT, order: 3, options: JSON.stringify(['Característico ✓', 'Inodoro', 'Olor extraño ✗']) },
      { formatId: term.id, sectionId: termSec2.id, label: 'Descripción Completa', name: 'descripcion', type: FieldType.TEXTAREA, order: 4, isRequired: true, placeholder: 'Describir según monografía o especificación registrada' },
      // Sec 3 - Fisicoquímico
      { formatId: term.id, sectionId: termSec3.id, label: 'Uniformidad de Contenido (% RSD)', name: 'uniformidad_contenido', type: FieldType.NUMBER, order: 1, decimalPlaces: 2, unit: '% RSD', helpText: 'Ph.Eur. 2.9.6: AV ≤ 15' },
      { formatId: term.id, sectionId: termSec3.id, label: 'Variación de Peso (% RSD)', name: 'variacion_peso', type: FieldType.NUMBER, order: 2, decimalPlaces: 2, unit: '% RSD' },
      { formatId: term.id, sectionId: termSec3.id, label: 'Dureza', name: 'dureza', type: FieldType.NUMBER, order: 3, decimalPlaces: 1, unit: 'N o kP', helpText: 'Según especificación del producto' },
      { formatId: term.id, sectionId: termSec3.id, label: 'Friabilidad (≤ 1.0%)', name: 'friabilidad', type: FieldType.NUMBER, order: 4, decimalPlaces: 2, unit: '%', helpText: 'USP <1216>: ≤ 1.0%' },
      { formatId: term.id, sectionId: termSec3.id, label: 'Desintegración', name: 'desintegracion', type: FieldType.NUMBER, order: 5, decimalPlaces: 1, unit: 'minutos', helpText: 'USP <701>: según forma farmacéutica' },
      { formatId: term.id, sectionId: termSec3.id, label: 'Disolución — Q (%) a los 30 min', name: 'disolucion', type: FieldType.NUMBER, order: 6, decimalPlaces: 1, unit: '%', helpText: 'USP <711>: Q ≥ 80% en 30 min (típico)' },
      { formatId: term.id, sectionId: termSec3.id, label: 'pH (para soluciones/suspensiones)', name: 'ph', type: FieldType.NUMBER, order: 7, decimalPlaces: 2, unit: 'unidades pH' },
      { formatId: term.id, sectionId: termSec3.id, label: 'Osmolalidad (para inyectables)', name: 'osmolalidad', type: FieldType.NUMBER, order: 8, decimalPlaces: 0, unit: 'mOsm/kg', helpText: 'Isotónico: 280–300 mOsm/kg' },
      { formatId: term.id, sectionId: termSec3.id, label: 'Humedad / Pérdida por Secado (%)', name: 'humedad', type: FieldType.NUMBER, order: 9, decimalPlaces: 2, unit: '%' },
      { formatId: term.id, sectionId: termSec3.id, label: 'Particulado (inyectables) — ≥ 10 μm', name: 'particulado_10', type: FieldType.NUMBER, order: 10, decimalPlaces: 0, unit: 'partículas/mL', helpText: 'USP <788>: ≤ 6000/contenedor' },
      // Sec 4 - Valoración
      { formatId: term.id, sectionId: termSec4.id, label: 'Método de Valoración', name: 'metodo_valoracion', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['HPLC-UV', 'HPLC-DAD', 'HPLC-MS/MS', 'UV/Vis', 'GC-FID', 'Titulación', 'Colorimetría']) },
      { formatId: term.id, sectionId: termSec4.id, label: 'Identidad del Principio Activo', name: 'identidad', type: FieldType.SELECT, order: 2, isRequired: true, options: JSON.stringify(['Positivo — Conforme ✓', 'Negativo — No conforme ✗']) },
      { formatId: term.id, sectionId: termSec4.id, label: 'Valoración / Potencia (%)', name: 'valoracion', type: FieldType.NUMBER, order: 3, isRequired: true, minValue: 90, maxValue: 115, decimalPlaces: 2, unit: '%', helpText: 'Especificación ICH Q6A: 98.0% – 102.0% (típico)' },
      { formatId: term.id, sectionId: termSec4.id, label: 'Impureza Especificada A (%)', name: 'impureza_a', type: FieldType.NUMBER, order: 4, decimalPlaces: 3, unit: '%' },
      { formatId: term.id, sectionId: termSec4.id, label: 'Impureza Especificada B (%)', name: 'impureza_b', type: FieldType.NUMBER, order: 5, decimalPlaces: 3, unit: '%' },
      { formatId: term.id, sectionId: termSec4.id, label: 'Impurezas No Especificadas (cada una, %)', name: 'impureza_no_espec', type: FieldType.NUMBER, order: 6, decimalPlaces: 3, unit: '%', helpText: 'ICH Q3B: ≤ 0.10% cada una' },
      { formatId: term.id, sectionId: termSec4.id, label: 'Impurezas Totales (%)', name: 'impurezas_totales', type: FieldType.NUMBER, order: 7, isRequired: true, decimalPlaces: 3, unit: '%', helpText: 'ICH Q3B: ≤ 2.0% total' },
      // Sec 5 - Microbiológico
      { formatId: term.id, sectionId: termSec5.id, label: '¿Aplica control microbiológico?', name: 'aplica_micro', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['Sí — Producto no estéril', 'Sí — Producto estéril (inyectable)', 'No aplica']) },
      { formatId: term.id, sectionId: termSec5.id, label: 'Recuento Total de Aerobios (UFC/g o mL)', name: 'recuento_aerobios', type: FieldType.NUMBER, order: 2, decimalPlaces: 0, unit: 'UFC/g o mL', helpText: 'Forma oral no estéril (USP <61>): ≤ 1000 UFC/g' },
      { formatId: term.id, sectionId: termSec5.id, label: 'Hongos y Levaduras (UFC/g o mL)', name: 'hongos_levaduras', type: FieldType.NUMBER, order: 3, decimalPlaces: 0, unit: 'UFC/g o mL', helpText: 'USP <61>: ≤ 100 UFC/g' },
      { formatId: term.id, sectionId: termSec5.id, label: 'Escherichia coli', name: 'e_coli', type: FieldType.SELECT, order: 4, options: JSON.stringify(['Ausente en 1 g/mL ✓', 'Presente ✗']) },
      { formatId: term.id, sectionId: termSec5.id, label: 'Salmonella spp.', name: 'salmonella', type: FieldType.SELECT, order: 5, options: JSON.stringify(['Ausente en 10 g/mL ✓', 'Presente ✗']) },
      { formatId: term.id, sectionId: termSec5.id, label: 'Pseudomonas aeruginosa', name: 'pseudomonas', type: FieldType.SELECT, order: 6, options: JSON.stringify(['Ausente en 1 g/mL ✓', 'Presente ✗']) },
      { formatId: term.id, sectionId: termSec5.id, label: 'Staphylococcus aureus', name: 'staph_aureus', type: FieldType.SELECT, order: 7, options: JSON.stringify(['Ausente en 1 g/mL ✓', 'Presente ✗']) },
      { formatId: term.id, sectionId: termSec5.id, label: 'Endotoxinas (para estériles, EU/mL)', name: 'endotoxinas', type: FieldType.NUMBER, order: 8, decimalPlaces: 3, unit: 'EU/mL', helpText: 'USP <85>: según especificación del producto' },
      { formatId: term.id, sectionId: termSec5.id, label: 'Esterilidad (para estériles)', name: 'esterilidad', type: FieldType.SELECT, order: 9, options: JSON.stringify(['Estéril — Conforme ✓', 'No estéril — No conforme ✗', 'No aplica']) },
      // Sec 6 - Decisión
      { formatId: term.id, sectionId: termSec6.id, label: 'Resultado Final del Lote', name: 'resultado_final', type: FieldType.SELECT, order: 1, isRequired: true, options: JSON.stringify(['APROBADO — Cumple todas las especificaciones', 'APROBADO CON OBSERVACIONES — Desviación menor documentada', 'RECHAZADO — No cumple especificaciones', 'EN CUARENTENA — Investigación en curso']) },
      { formatId: term.id, sectionId: termSec6.id, label: 'Número de Desviaciones / OOS Abiertas', name: 'num_desviaciones', type: FieldType.NUMBER, order: 2, decimalPlaces: 0, defaultValue: '0' },
      { formatId: term.id, sectionId: termSec6.id, label: 'Referencia CAPA (si aplica)', name: 'ref_capa', type: FieldType.TEXT, order: 3, placeholder: 'Ej: CAPA-2024-012' },
      { formatId: term.id, sectionId: termSec6.id, label: 'Observaciones y Justificación', name: 'observaciones', type: FieldType.TEXTAREA, order: 4, isRequired: true, placeholder: 'Registre observaciones, desviaciones o justificación de liberación' },
      { formatId: term.id, sectionId: termSec6.id, label: 'Firma Analista de Control de Calidad', name: 'firma_analista', type: FieldType.SIGNATURE, order: 5, isRequired: true, helpText: 'Analista responsable del análisis — 21 CFR Part 11' },
      { formatId: term.id, sectionId: termSec6.id, label: 'Firma Director Técnico / QP', name: 'firma_director', type: FieldType.SIGNATURE, order: 6, isRequired: true, helpText: 'Persona Cualificada responsable de la liberación del lote — GMP Annex 11' },
    ],
  });

  await prisma.formatApproval.createMany({
    data: [
      { formatId: term.id, userId: admin.id, role: ApprovalRole.ELABORATED_BY, status: ApprovalStatus.APPROVED, order: 1, signedAt: new Date(), comments: 'Elaborado en el sistema' },
      { formatId: term.id, userId: aprobadorId, role: ApprovalRole.APPROVED_BY, status: ApprovalStatus.APPROVED, order: 2, signedAt: new Date(), comments: 'Aprobado — Cumple requisitos GxP y ICH Q6A' },
    ],
  });

  console.log('✓ QC-TERM-001 — Análisis de Producto Terminado creado');

  console.log('\n══════════════════════════════════════════════════');
  console.log('Formatos creados y disponibles en el sistema:');
  console.log('  • QC-AGUA-001 — Liberación de Lote de Agua (23 campos)');
  console.log('  • QC-SEMI-001 — Análisis de Producto Semiterminado (28 campos)');
  console.log('  • QC-TERM-001 — Análisis de Producto Terminado (37 campos)');
  console.log('  Estado: APROBADO — Listos para crear registros');
  console.log('══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
