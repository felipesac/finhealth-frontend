-- Performance indexes for common query patterns
-- Phase 2: Reliability & Robustness

-- Single-column indexes for common filters
CREATE INDEX IF NOT EXISTS idx_accounts_tiss_status ON medical_accounts(tiss_validation_status) WHERE tiss_validation_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_admission ON medical_accounts(admission_date DESC);
CREATE INDEX IF NOT EXISTS idx_glosas_code ON glosas(glosa_code);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_recon_status ON payments(reconciliation_status);

-- Composite indexes for dashboard queries (org-scoped aggregations)
CREATE INDEX IF NOT EXISTS idx_accounts_org_status_date ON medical_accounts(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_glosas_org_type_date ON glosas(organization_id, glosa_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_org_date ON payments(organization_id, payment_date DESC);

-- Patient name search (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON patients USING gin(name gin_trgm_ops);
