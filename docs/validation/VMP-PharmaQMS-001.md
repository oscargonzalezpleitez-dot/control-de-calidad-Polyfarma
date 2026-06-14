# PLAN MAESTRO DE VALIDACIÓN
## PharmaQMS v1.0.0

---

| Documento | VMP-PharmaQMS-001 |
|-----------|-------------------|
| Versión | 1.0 |
| Fecha | 2026-06-13 |
| Estado | BORRADOR |
| Clasificación GAMP 5 | Categoría 4 — Software Configurable |

---

## 1. ALCANCE Y OBJETIVOS

### 1.1 Descripción del Sistema
PharmaQMS es un sistema computerizado de gestión de calidad farmacéutica diseñado para:
- Gestión de formatos y plantillas de documentación GxP
- Captura electrónica de datos con audit trail inmutable
- Generación de registros electrónicos conforme a 21 CFR Part 11
- Firmas electrónicas conforme a 21 CFR Part 11 §11.100 y §11.200
- Gestión del ciclo de vida de registros de calidad

### 1.2 Objetivos de Validación
1. Demostrar que el sistema cumple con todos los requisitos de usuario (URS)
2. Verificar que los controles para registros electrónicos y firmas electrónicas cumplen 21 CFR Part 11
3. Confirmar que el sistema implementa los principios ALCOA+
4. Establecer el estado validado del sistema para uso en producción
5. Proporcionar evidencia documentada para inspecciones regulatorias (FDA, EMA, INVIMA, DIGEMID, MINSAL)

---

## 2. MARCO REGULATORIO

### 2.1 Regulaciones Aplicables
| Regulación | Descripción | Aplicabilidad |
|-----------|-------------|---------------|
| FDA 21 CFR Part 11 | Registros electrónicos y firmas electrónicas | OBLIGATORIA |
| EU GMP Annex 11 | Sistemas computarizados en manufactura | OBLIGATORIA |
| GAMP 5 2da Ed. | Buenas prácticas automatizadas de manufactura | GUÍA |
| ALCOA+ | Principios de integridad de datos | OBLIGATORIA |
| ISO/IEC 27001 | Seguridad de la información | APLICABLE |
| ISO 9001:2015 | Sistema de gestión de calidad | APLICABLE |
| 21 CFR Part 820 | QSR — Quality System Regulation | REFERENCIA |
| ICH Q10 | Sistema de calidad farmacéutico | APLICABLE |

### 2.2 Clasificación GAMP 5
**Categoría 4: Software Configurable**
- El sistema es software comercial que requiere configuración y validación
- Requiere: URS, FS, DS, IQ, OQ, PQ
- Nivel de riesgo: ALTO (impacto directo en calidad del producto)

---

## 3. ORGANIZACIÓN DE LA VALIDACIÓN

### 3.1 Roles y Responsabilidades
| Rol | Responsabilidad |
|-----|----------------|
| Propietario del Sistema | Aprobación final, responsabilidad del estado validado |
| Director de Calidad | Supervisión del proceso de validación |
| Responsable de TI | Validación técnica (IQ/OQ) |
| Usuarios Clave | Validación funcional (OQ/PQ) |
| Asuntos Regulatorios | Revisión de cumplimiento |
| Auditoría | Revisión independiente |

---

## 4. ENTREGABLES DE VALIDACIÓN

### 4.1 Documentos Requeridos
| Documento | Código | Estado |
|-----------|--------|--------|
| Plan Maestro de Validación (VMP) | VMP-001 | Presente |
| Especificación de Requisitos de Usuario (URS) | URS-001 | Incluido §5 |
| Especificación Funcional (FS) | FS-001 | Incluido §6 |
| Especificación de Diseño (DS) | DS-001 | Incluido §7 |
| Análisis de Riesgos | RA-001 | Incluido §8 |
| Matriz de Trazabilidad | RTM-001 | Incluido §9 |
| Protocolo IQ | IQ-001 | Incluido §10 |
| Protocolo OQ | OQ-001 | Incluido §11 |
| Protocolo PQ | PQ-001 | Incluido §12 |
| Plan de Mantenimiento del Estado Validado | MV-001 | Incluido §13 |

---

## 5. ESPECIFICACIÓN DE REQUISITOS DE USUARIO (URS)

### 5.1 Requisitos Funcionales
| ID | Requisito | Prioridad | Regulación |
|----|-----------|-----------|------------|
| URS-F-001 | El sistema debe crear y gestionar formatos de documentos electrónicos | CRÍTICO | GMP Annex 11 §4 |
| URS-F-002 | Todos los campos de datos deben incluir timestamp automático del servidor | CRÍTICO | ALCOA+ (Contemporaneous) |
| URS-F-003 | Cada usuario debe tener ID único, no compartible | CRÍTICO | 21 CFR Part 11 §11.300 |
| URS-F-004 | El sistema debe registrar quién ingresó cada dato (atribución) | CRÍTICO | ALCOA+ (Attributable) |
| URS-F-005 | Las firmas electrónicas deben vincularse permanentemente al registro | CRÍTICO | 21 CFR Part 11 §11.70 |
| URS-F-006 | El audit trail debe capturar: usuario, fecha/hora, valor anterior, valor nuevo | CRÍTICO | 21 CFR Part 11 §11.10(e) |
| URS-F-007 | Los registros no deben poder eliminarse físicamente | CRÍTICO | ALCOA+ (Enduring) |
| URS-F-008 | El sistema debe generar reportes en PDF, DOCX y XLSX | IMPORTANTE | GMP GDP |
| URS-F-009 | Debe existir control de versiones de formatos | CRÍTICO | GMP §4.4 |
| URS-F-010 | El flujo de aprobación debe requerir identidad verificada | CRÍTICO | 21 CFR Part 11 §11.200 |
| URS-F-011 | Los datos deben ser legibles durante todo el período de retención | CRÍTICO | ALCOA+ (Legible) |
| URS-F-012 | El sistema debe soportar roles y permisos granulares | IMPORTANTE | 21 CFR Part 11 §11.10(g) |
| URS-F-013 | MFA opcional para mayor seguridad de identidad | IMPORTANTE | 21 CFR Part 11 §11.100(b) |
| URS-F-014 | Bloqueo automático tras intentos fallidos de login | CRÍTICO | 21 CFR Part 11 §11.300(d) |
| URS-F-015 | Sesiones con timeout automático | IMPORTANTE | 21 CFR Part 11 §11.300 |

### 5.2 Requisitos No Funcionales
| ID | Requisito | Criterio de Aceptación |
|----|-----------|------------------------|
| URS-NF-001 | Disponibilidad del sistema ≥ 99.5% | Medición mensual |
| URS-NF-002 | Tiempo de respuesta < 3 segundos para operaciones normales | Prueba de carga |
| URS-NF-003 | Cifrado AES-256 para datos en tránsito y reposo | Revisión de configuración |
| URS-NF-004 | Backup automático diario con retención 90 días | Verificación del proceso |
| URS-NF-005 | Retención de datos ≥ 10 años | Configuración del sistema |
| URS-NF-006 | Compatible con navegadores: Chrome, Edge, Firefox (últimas 2 versiones) | Pruebas de compatibilidad |

---

## 6. ESPECIFICACIÓN FUNCIONAL (FS)

### 6.1 Módulo de Autenticación y Sesiones
**FS-AUTH-001:** Autenticación mediante email + contraseña (mínimo 12 caracteres con complejidad)
**FS-AUTH-002:** JWT con expiración de 15 minutos; refresh token 8 horas
**FS-AUTH-003:** Bloqueo de cuenta tras 5 intentos fallidos; desbloqueo manual por admin o automático tras 30 minutos
**FS-AUTH-004:** MFA con TOTP (RFC 6238) mediante aplicaciones estándar
**FS-AUTH-005:** Historial de contraseñas — prevenir reutilización de las últimas 10
**FS-AUTH-006:** Expiración de contraseñas cada 90 días

### 6.2 Módulo de Audit Trail
**FS-AUDIT-001:** Registro automático e inmutable de todas las operaciones CRUD
**FS-AUDIT-002:** Campos obligatorios: userId, timestamp (UTC), acción, módulo, entidad, IP, userAgent
**FS-AUDIT-003:** Para modificaciones: valor anterior, valor nuevo, motivo del cambio
**FS-AUDIT-004:** Hash SHA-256 por registro para verificación de integridad
**FS-AUDIT-005:** Trigger de base de datos previene UPDATE/DELETE en tabla audit_logs
**FS-AUDIT-006:** Retención mínima 10 años

### 6.3 Módulo de Firmas Electrónicas (21 CFR Part 11)
**FS-SIG-001:** Autenticación de identidad mediante contraseña en el momento de la firma
**FS-SIG-002:** Campos obligatorios de firma: significado, propósito, timestamp, IP, userAgent
**FS-SIG-003:** Hash del contenido firmado para non-repudiation
**FS-SIG-004:** Tipos: Elaborado por, Revisado por, Aprobado por, Verificado por
**FS-SIG-005:** Las firmas no pueden eliminarse; solo revocarse con auditoría

---

## 7. ESPECIFICACIÓN DE DISEÑO (DS)

### 7.1 Arquitectura del Sistema
```
Frontend: Next.js 14 + React 18 + TypeScript
Backend: NestJS 10 + TypeScript
Base de Datos: PostgreSQL 16 (ACID compliant)
ORM: Prisma 5 (type-safe, migrations)
Cache/Sesiones: Redis 7
Autenticación: JWT + Passport.js + bcryptjs (SALT_ROUNDS=12)
Cifrado: AES-256-CBC para datos sensibles
Hashing: SHA-256 para integridad de audit trail
Contenedores: Docker + Docker Compose
```

### 7.2 Modelo de Datos Crítico
- **users:** Gestión de identidades con hash de contraseña bcrypt
- **sessions:** Control de sesiones activas con revocación
- **audit_logs:** INMUTABLE — triggers de BD previenen modificaciones
- **electronic_signatures:** Hash de integridad, datos de autenticación
- **records/record_field_values:** Trazabilidad ALCOA+ por campo

---

## 8. ANÁLISIS DE RIESGOS (GAMP 5)

| ID | Riesgo | Probabilidad | Impacto | Nivel | Control |
|----|--------|-------------|---------|-------|---------|
| R-001 | Acceso no autorizado | Medio | Alto | ALTO | MFA, bloqueo por intentos, RBAC |
| R-002 | Pérdida de datos de audit trail | Bajo | Crítico | ALTO | Triggers BD inmutables, backup |
| R-003 | Manipulación de registros | Bajo | Crítico | ALTO | Hash SHA-256, audit trail, no-delete |
| R-004 | Firma electrónica comprometida | Bajo | Alto | ALTO | Verificación de identidad, hash |
| R-005 | Pérdida de disponibilidad | Medio | Medio | MEDIO | HA, backup, disaster recovery |
| R-006 | Fuga de datos sensibles | Bajo | Alto | ALTO | AES-256, TLS, acceso mínimo |
| R-007 | Incumplimiento de retención | Bajo | Alto | MEDIO | Config retención, alertas |
| R-008 | Pérdida de integridad de datos | Muy Bajo | Crítico | ALTO | Checksum, ACID transactions |

---

## 9. MATRIZ DE TRAZABILIDAD (RTM)

| URS ID | FS ID | DS ID | Caso de Prueba | Estado |
|--------|-------|-------|----------------|--------|
| URS-F-001 | FS-FORMAT-001 | DS-DB-FORMAT | TC-001 a TC-010 | Pendiente |
| URS-F-002 | FS-AUDIT-001 | DS-DB-AUDIT | TC-011 a TC-015 | Pendiente |
| URS-F-003 | FS-AUTH-001 | DS-AUTH | TC-020 a TC-025 | Pendiente |
| URS-F-004 | FS-AUDIT-001 | DS-DB-RFV | TC-030 a TC-035 | Pendiente |
| URS-F-005 | FS-SIG-001 | DS-SIG | TC-040 a TC-050 | Pendiente |
| URS-F-006 | FS-AUDIT-001 a 006 | DS-DB-AUDIT | TC-060 a TC-075 | Pendiente |
| URS-F-007 | FS-AUDIT-005 | DS-DB-TRIGGER | TC-080 a TC-085 | Pendiente |
| URS-F-014 | FS-AUTH-003 | DS-AUTH | TC-090 a TC-095 | Pendiente |

---

## 10. PROTOCOLO IQ (CALIFICACIÓN DE INSTALACIÓN)

### IQ-001: Verificación del Entorno
| Prueba | Criterio | Resultado | Estado |
|--------|----------|-----------|--------|
| IQ-001 | Node.js ≥ v20 instalado | node --version | ☐ |
| IQ-002 | PostgreSQL 16 configurado | psql --version | ☐ |
| IQ-003 | Redis 7 disponible | redis-cli ping | ☐ |
| IQ-004 | Variables de entorno configuradas | Revisión .env | ☐ |
| IQ-005 | Conexión a BD exitosa | Prisma migrate | ☐ |
| IQ-006 | Certificados SSL instalados | openssl verify | ☐ |
| IQ-007 | Docker/contenedores operativos | docker ps | ☐ |
| IQ-008 | Backup configurado | Revisión cron | ☐ |
| IQ-009 | Logs del sistema configurados | Revisión archivos | ☐ |
| IQ-010 | HTTPS habilitado en producción | curl https://... | ☐ |

---

## 11. PROTOCOLO OQ (CALIFICACIÓN DE OPERACIÓN)

### OQ-AUTH: Autenticación
| TC | Descripción | Pasos | Resultado Esperado | Estado |
|----|-------------|-------|-------------------|--------|
| TC-020 | Login con credenciales válidas | POST /auth/login | Token JWT retornado, audit registrado | ☐ |
| TC-021 | Login con contraseña incorrecta | POST /auth/login (pass erróneo) | Error 401, intento registrado en audit | ☐ |
| TC-022 | Bloqueo tras 5 intentos | 5x POST /auth/login (pass erróneo) | Cuenta bloqueada, notificación | ☐ |
| TC-023 | Logout y revocación de token | POST /auth/logout | Token revocado, sesión cerrada | ☐ |
| TC-024 | Configuración y activación MFA | GET /auth/mfa/setup + POST /auth/mfa/enable | QR generado, MFA habilitado | ☐ |
| TC-025 | Login con MFA activo | POST /auth/login + mfaToken | Autenticación en 2 pasos exitosa | ☐ |

### OQ-AUDIT: Audit Trail
| TC | Descripción | Resultado Esperado | Estado |
|----|-------------|-------------------|--------|
| TC-060 | Creación de registro genera audit | Registro con timestamp, userId, IP | ☐ |
| TC-061 | Modificación de campo genera audit | oldValue, newValue, changeReason | ☐ |
| TC-062 | No se puede DELETE en audit_logs | Error de BD al intentar eliminar | ☐ |
| TC-063 | No se puede UPDATE en audit_logs | Error de BD al intentar modificar | ☐ |
| TC-064 | Verificación de integridad hash | GET /audit/verify/:id = true | ☐ |
| TC-065 | Hash detecta registro manipulado | Modificación directa en BD = hash inválido | ☐ |

### OQ-SIG: Firmas Electrónicas
| TC | Descripción | Resultado Esperado | Estado |
|----|-------------|-------------------|--------|
| TC-040 | Firma con contraseña correcta | Firma creada con hash, registrada en audit | ☐ |
| TC-041 | Firma con contraseña incorrecta | Error 401, intento en audit | ☐ |
| TC-042 | Firma incluye significado | Campo meaning obligatorio (min 5 chars) | ☐ |
| TC-043 | Verificación de firma | GET /signatures/:id/verify = válida | ☐ |
| TC-044 | Revocación de firma | PATCH /signatures/:id/revoke registra audit | ☐ |

---

## 12. PROTOCOLO PQ (CALIFICACIÓN DE PERFORMANCE)

### PQ-001: Flujo Completo de Registro de Calidad
**Objetivo:** Verificar que el ciclo completo de un registro GMP funciona correctamente en producción.

**Escenario:** Control de Temperatura de Almacén

| Paso | Acción | Resultado Esperado | Ejecutado por | Fecha |
|------|--------|-------------------|---------------|-------|
| 1 | Admin crea formato REG-TEMP | Formato en BORRADOR | | |
| 2 | Admin envía a aprobación | Estado: UNDER_REVIEW | | |
| 3 | Calidad aprueba formato | Estado: APPROVED, firma registrada | | |
| 4 | Analista crea registro | Código único generado, IN_PROGRESS | | |
| 5 | Analista ingresa datos | Valores guardados, audit por campo | | |
| 6 | Analista completa registro | Estado: COMPLETED | | |
| 7 | Jefe Calidad revisa | Firma electrónica aplicada | | |
| 8 | Sistema genera reporte PDF | PDF con firmas, hashes, conforme | | |
| 9 | Verificar audit trail completo | Todos los eventos registrados | | |
| 10 | Verificar integridad datos | Hash válido en audit_logs | | |

**Criterio de Aceptación:** Todos los pasos completados sin desviaciones. Audit trail completo e íntegro.

---

## 13. MANTENIMIENTO DEL ESTADO VALIDADO

### 13.1 Change Control
Todo cambio al sistema requiere:
1. Solicitud de cambio documentada
2. Análisis de impacto en validación
3. Re-validación proporcional al riesgo (IQ/OQ/PQ según aplique)
4. Aprobación por Calidad y Propietario del Sistema

### 13.2 Revisión Periódica
- Revisión anual del estado validado
- Verificación de integridad de audit trail (trimestral)
- Revisión de gestión de accesos (semestral)
- Prueba de recuperación ante desastres (anual)

### 13.3 Gestión de Incidentes
- Registro inmediato de desviaciones
- Análisis de impacto en integridad de datos
- Notificación a Calidad en < 24 horas para incidentes críticos
- CAPA documentada y seguimiento

---

## 14. FIRMAS DE APROBACIÓN

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Propietario del Sistema | | | |
| Director de Calidad | | | |
| Responsable de TI | | | |
| Asuntos Regulatorios | | | |

---

*Documento generado por PharmaQMS — Conforme con GAMP 5 Segunda Edición*
*Código: VMP-PharmaQMS-001 | Versión: 1.0 | Clasificación: Restringido*
