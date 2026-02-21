-- ============================================
-- Migration 007: Add classification columns to sus_procedures
-- ============================================

ALTER TABLE sus_procedures ADD COLUMN IF NOT EXISTS grupo VARCHAR(100);
ALTER TABLE sus_procedures ADD COLUMN IF NOT EXISTS subgrupo VARCHAR(150);
ALTER TABLE sus_procedures ADD COLUMN IF NOT EXISTS forma_organizacao VARCHAR(150);
ALTER TABLE sus_procedures ADD COLUMN IF NOT EXISTS tipo VARCHAR(30);
ALTER TABLE sus_procedures ADD COLUMN IF NOT EXISTS codigo_grupo VARCHAR(2);
ALTER TABLE sus_procedures ADD COLUMN IF NOT EXISTS codigo_subgrupo VARCHAR(2);
ALTER TABLE sus_procedures ADD COLUMN IF NOT EXISTS codigo_forma_organizacao VARCHAR(2);

CREATE INDEX IF NOT EXISTS idx_sus_procedures_grupo ON sus_procedures(codigo_grupo);
CREATE INDEX IF NOT EXISTS idx_sus_procedures_tipo ON sus_procedures(tipo);
CREATE INDEX IF NOT EXISTS idx_sus_procedures_complexidade ON sus_procedures(complexidade);
