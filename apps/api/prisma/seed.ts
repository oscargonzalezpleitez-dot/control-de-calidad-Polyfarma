import { PrismaClient, UserRole, UserStatus, FormatType, FormatStatus, FieldType, ApprovalRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de datos PharmaQMS...');

  // ============================================================
  // USUARIO ADMINISTRADOR
  // ============================================================
  const adminPassword = await bcrypt.hash('Admin@PharmaQMS2024!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pharma.com' },
    update: {},
    create: {
      email: 'admin@pharma.com',
      username: 'admin',
      firstName: 'Administrador',
      lastName: 'Sistema',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      signatureEnabled: true,
      employeeId: 'EMP-001',
      position: 'Administrador de Sistema',
      department: 'Sistemas',
    },
  });

  await prisma.passwordHistory.upsert({
    where: { id: 'seed-admin-history' },
    update: {},
    create: { id: 'seed-admin-history', userId: admin.id, passwordHash: adminPassword },
  });

  // ============================================================
  // USUARIOS DE EJEMPLO
  // ============================================================
  const users = [
    { email: 'calidad@pharma.com', username: 'jefe_calidad', firstName: 'Ana', lastName: 'García', role: UserRole.QUALITY, position: 'Jefe de Calidad', department: 'Control de Calidad', employeeId: 'EMP-002' },
    { email: 'produccion@pharma.com', username: 'jefe_produccion', firstName: 'Carlos', lastName: 'López', role: UserRole.PRODUCTION, position: 'Jefe de Producción', department: 'Producción', employeeId: 'EMP-003' },
    { email: 'microbiologia@pharma.com', username: 'jefe_micro', firstName: 'María', lastName: 'Rodríguez', role: UserRole.MICROBIOLOGY, position: 'Jefe de Microbiología', department: 'Microbiología', employeeId: 'EMP-004' },
    { email: 'auditor@pharma.com', username: 'auditor_interno', firstName: 'Roberto', lastName: 'Martínez', role: UserRole.AUDITOR, position: 'Auditor Interno', department: 'Auditoría', employeeId: 'EMP-005' },
    { email: 'regulatorio@pharma.com', username: 'asuntos_reg', firstName: 'Laura', lastName: 'Sánchez', role: UserRole.REGULATORY_AFFAIRS, position: 'Directora de Asuntos Regulatorios', department: 'Regulatorio', employeeId: 'EMP-006' },
    { email: 'control_calidad@pharma.com', username: 'analista_cc', firstName: 'Pedro', lastName: 'Jiménez', role: UserRole.QUALITY_CONTROL, position: 'Analista de Control de Calidad', department: 'Control de Calidad', employeeId: 'EMP-007' },
    { email: 'consulta@pharma.com', username: 'solo_lectura', firstName: 'Elena', lastName: 'Vargas', role: UserRole.VIEWER, position: 'Consultor', department: 'Consultoría', employeeId: 'EMP-008' },
  ];

  for (const userData of users) {
    const passwordHash = await bcrypt.hash('User@PharmaQMS2024!', 12);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: { ...userData, passwordHash, status: UserStatus.ACTIVE, signatureEnabled: true },
    });
  }

  console.log('Usuarios creados correctamente');

  // ============================================================
  // DEPARTAMENTOS
  // ============================================================
  const departments = [
    { code: 'QA', name: 'Aseguramiento de Calidad', description: 'Control y garantía de calidad de productos' },
    { code: 'QC', name: 'Control de Calidad', description: 'Análisis y liberación de materias primas y productos terminados' },
    { code: 'PROD', name: 'Producción', description: 'Fabricación de productos farmacéuticos' },
    { code: 'MICRO', name: 'Microbiología', description: 'Control microbiológico y ambiental' },
    { code: 'REG', name: 'Asuntos Regulatorios', description: 'Registros y cumplimiento regulatorio' },
    { code: 'DEV', name: 'Desarrollo', description: 'Investigación y desarrollo de formulaciones' },
    { code: 'SYS', name: 'Sistemas', description: 'Tecnología de información y sistemas informáticos' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }

  // ============================================================
  // FORMATO DE EJEMPLO: CONTROL DE TEMPERATURA
  // ============================================================
  const tempFormat = await prisma.format.upsert({
    where: { code: 'REG-TEMP-001' },
    update: {},
    create: {
      code: 'REG-TEMP-001',
      name: 'Registro de Control de Temperatura de Almacén',
      description: 'Registro diario de temperatura y humedad relativa en áreas de almacenamiento',
      type: FormatType.LOG,
      status: FormatStatus.APPROVED,
      version: '1.0',
      department: 'Almacén',
      effectiveDate: new Date(),
      retentionPeriod: 5,
      createdById: admin.id,
    },
  });

  const tempSection = await prisma.formatSection.upsert({
    where: { id: 'seed-section-temp' },
    update: {},
    create: {
      id: 'seed-section-temp',
      formatId: tempFormat.id,
      name: 'Datos de Monitoreo',
      order: 1,
      isRepeatable: true,
      maxRepeat: 24,
    },
  });

  const tempFields = [
    { label: 'Fecha y Hora de Medición', name: 'fecha_hora', type: FieldType.DATETIME, order: 1, isRequired: true },
    { label: 'Temperatura (°C)', name: 'temperatura', type: FieldType.NUMBER, order: 2, isRequired: true, minValue: -30, maxValue: 50, unit: '°C' },
    { label: 'Humedad Relativa (%)', name: 'humedad', type: FieldType.NUMBER, order: 3, isRequired: true, minValue: 0, maxValue: 100, unit: '%' },
    { label: 'Área de Almacenamiento', name: 'area', type: FieldType.SELECT, order: 4, isRequired: true, options: ['Almacén General', 'Cámara Fría 1', 'Cámara Fría 2', 'Área de Cuarentena', 'Área Seca'] },
    { label: '¿Dentro de Límites?', name: 'dentro_limites', type: FieldType.SELECT, order: 5, isRequired: true, options: ['Sí', 'No'] },
    { label: 'Acciones Correctivas (si aplica)', name: 'acciones', type: FieldType.TEXTAREA, order: 6, isRequired: false },
    { label: 'Firma del Analista', name: 'firma_analista', type: FieldType.SIGNATURE, order: 7, isRequired: true },
  ];

  for (const field of tempFields) {
    await prisma.formatField.create({
      data: {
        formatId: tempFormat.id,
        sectionId: tempSection.id,
        ...field,
        options: field.options ? field.options : undefined,
      },
    });
  }

  // ============================================================
  // FORMATO: CONTROL DE CALIDAD DE MATERIA PRIMA
  // ============================================================
  const mpFormat = await prisma.format.upsert({
    where: { code: 'REG-CCMP-001' },
    update: {},
    create: {
      code: 'REG-CCMP-001',
      name: 'Control de Calidad de Materia Prima',
      description: 'Protocolo de análisis y liberación de materias primas',
      type: FormatType.CHECKLIST,
      status: FormatStatus.APPROVED,
      version: '1.0',
      department: 'Control de Calidad',
      effectiveDate: new Date(),
      retentionPeriod: 10,
      createdById: admin.id,
    },
  });

  // ============================================================
  // CONFIGURACIÓN DEL SISTEMA
  // ============================================================
  const configs = [
    { key: 'COMPANY_NAME', value: 'Industrias Farmacéuticas S.A.', description: 'Nombre de la empresa' },
    { key: 'COMPANY_LOGO', value: '', description: 'URL del logo de la empresa' },
    { key: 'REGULATORY_ID', value: 'REG-PHARMA-2024', description: 'Número de registro regulatorio' },
    { key: 'GMP_CERTIFICATE', value: 'GMP-001-2024', description: 'Número de certificado GMP' },
    { key: 'AUDIT_TRAIL_ENABLED', value: 'true', description: 'Habilitar audit trail permanente' },
    { key: 'ELECTRONIC_SIGNATURES_REQUIRED', value: 'true', description: 'Requerir firmas electrónicas' },
    { key: 'MFA_REQUIRED_ROLES', value: 'ADMIN,QUALITY,AUDITOR', description: 'Roles que requieren MFA obligatorio' },
    { key: 'REPORT_HEADER', value: 'Sistema de Gestión de Calidad Farmacéutica', description: 'Encabezado de reportes' },
    { key: 'PASSWORD_EXPIRY_DAYS', value: '90', description: 'Días de expiración de contraseña' },
    { key: 'MAX_FILE_SIZE_MB', value: '50', description: 'Tamaño máximo de archivo en MB' },
    { key: 'DATA_RETENTION_YEARS', value: '10', description: 'Años de retención de datos (21 CFR Part 11)' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: { ...config, updatedById: admin.id },
    });
  }

  console.log('Seed completado exitosamente');
  console.log('-----------------------------------');
  console.log('Credenciales de acceso:');
  console.log('Admin: admin@pharma.com / Admin@PharmaQMS2024!');
  console.log('Calidad: calidad@pharma.com / User@PharmaQMS2024!');
  console.log('NOTA: Cambiar contraseñas en el primer acceso');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
