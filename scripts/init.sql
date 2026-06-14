-- ============================================================
-- PharmaQMS - Script de Inicialización PostgreSQL
-- 21 CFR Part 11 / EU GMP Annex 11 Compliant
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función de timestamp inmutable para audit trail
CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'El Audit Trail es inmutable. No se permiten modificaciones (21 CFR Part 11).';
END;
$$ LANGUAGE plpgsql;

-- Función de timestamp inmutable para firmas electrónicas
CREATE OR REPLACE FUNCTION prevent_signature_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo permitir actualización de campos de revocación
  IF OLD.data_hash != NEW.data_hash OR OLD.signature_hash != NEW.signature_hash THEN
    RAISE EXCEPTION 'Las firmas electrónicas no pueden modificarse (21 CFR Part 11).';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Los triggers se aplican después de que Prisma crea las tablas
-- Ejecutar manualmente después del primer migrate:

-- TRIGGER: Audit Trail inmutable
-- CREATE TRIGGER audit_trail_immutable
--   BEFORE UPDATE OR DELETE ON audit_logs
--   FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

-- TRIGGER: Firmas electrónicas inmutables
-- CREATE TRIGGER signature_immutable
--   BEFORE UPDATE ON electronic_signatures
--   FOR EACH ROW EXECUTE FUNCTION prevent_signature_update();

-- Índices adicionales para performance
-- (Prisma crea los básicos, estos son adicionales para reporting)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp_module
--   ON audit_logs (timestamp DESC, module);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_records_format_status
--   ON records (format_id, status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signatures_record_type
--   ON electronic_signatures (record_id, type, signed_at);

-- Comentario de cumplimiento
COMMENT ON DATABASE pharma_qms IS
  'Base de datos PharmaQMS - Sistema de Gestión de Calidad Farmacéutica.
   Cumple con: FDA 21 CFR Part 11, EU GMP Annex 11, GAMP 5, ALCOA+.
   Retención de datos: 10 años mínimo.';

SELECT 'PharmaQMS Database inicializada correctamente' AS status;
