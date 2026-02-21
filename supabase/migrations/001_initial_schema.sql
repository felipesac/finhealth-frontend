-- FinHealth Initial Schema
-- Core tables for healthcare financial management

-- ============================================
-- 1. PATIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  name TEXT NOT NULL,
  cpf VARCHAR(14),
  birth_date DATE,
  gender VARCHAR(20),
  phone VARCHAR(20),
  email TEXT,
  address JSONB DEFAULT '{}',
  health_insurance_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);

-- ============================================
-- 2. HEALTH INSURERS
-- ============================================
CREATE TABLE IF NOT EXISTS health_insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ans_code VARCHAR(20) NOT NULL,
  name TEXT NOT NULL,
  cnpj VARCHAR(18),
  tiss_version VARCHAR(10) DEFAULT '3.05.00',
  contact_email TEXT,
  api_endpoint TEXT,
  config JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurers_name ON health_insurers(name);
CREATE INDEX IF NOT EXISTS idx_insurers_active ON health_insurers(active);

-- ============================================
-- 3. MEDICAL ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS medical_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id),
  health_insurer_id UUID REFERENCES health_insurers(id),
  admission_date DATE,
  discharge_date DATE,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('internacao', 'ambulatorial', 'sadt', 'honorarios')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'sent', 'paid', 'glosa', 'appeal')),
  total_amount DECIMAL(12, 2) DEFAULT 0,
  approved_amount DECIMAL(12, 2) DEFAULT 0,
  glosa_amount DECIMAL(12, 2) DEFAULT 0,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  tiss_guide_number TEXT,
  tiss_guide_type TEXT,
  tiss_xml TEXT,
  tiss_validation_status VARCHAR(20) DEFAULT 'pending' CHECK (tiss_validation_status IN ('valid', 'invalid', 'pending')),
  tiss_validation_errors JSONB DEFAULT '[]',
  audit_score DECIMAL(5, 2),
  glosa_risk_score DECIMAL(5, 2),
  audit_issues JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_accounts_status ON medical_accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON medical_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_insurer ON medical_accounts(health_insurer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_patient ON medical_accounts(patient_id);
CREATE INDEX IF NOT EXISTS idx_accounts_created ON medical_accounts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_number ON medical_accounts(account_number);

-- ============================================
-- 4. PROCEDURES
-- ============================================
CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_account_id UUID NOT NULL REFERENCES medical_accounts(id) ON DELETE CASCADE,
  tuss_code VARCHAR(10),
  sigtap_code VARCHAR(10),
  cbhpm_code VARCHAR(10),
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(12, 2) DEFAULT 0,
  total_price DECIMAL(12, 2) DEFAULT 0,
  performed_at TIMESTAMPTZ,
  professional_id TEXT,
  professional_name TEXT,
  professional_council TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  glosa_code TEXT,
  glosa_reason TEXT,
  appeal_status VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procedures_account ON procedures(medical_account_id);
CREATE INDEX IF NOT EXISTS idx_procedures_tuss ON procedures(tuss_code);

-- ============================================
-- 5. GLOSAS
-- ============================================
CREATE TABLE IF NOT EXISTS glosas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_account_id UUID NOT NULL REFERENCES medical_accounts(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES procedures(id),
  glosa_code TEXT NOT NULL,
  glosa_description TEXT,
  glosa_type VARCHAR(20) CHECK (glosa_type IN ('administrativa', 'tecnica', 'linear')),
  original_amount DECIMAL(12, 2) DEFAULT 0,
  glosa_amount DECIMAL(12, 2) DEFAULT 0,
  appeal_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (appeal_status IN ('pending', 'in_progress', 'sent', 'accepted', 'rejected')),
  appeal_text TEXT,
  appeal_sent_at TIMESTAMPTZ,
  appeal_response TEXT,
  appeal_resolved_at TIMESTAMPTZ,
  ai_recommendation TEXT,
  success_probability DECIMAL(5, 4),
  priority_score DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_glosas_account ON glosas(medical_account_id);
CREATE INDEX IF NOT EXISTS idx_glosas_status ON glosas(appeal_status);
CREATE INDEX IF NOT EXISTS idx_glosas_priority ON glosas(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_glosas_type ON glosas(glosa_type);

-- ============================================
-- 6. PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_insurer_id UUID REFERENCES health_insurers(id),
  payment_date DATE NOT NULL,
  payment_reference TEXT,
  bank_account TEXT,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  matched_amount DECIMAL(12, 2) DEFAULT 0,
  unmatched_amount DECIMAL(12, 2) DEFAULT 0,
  reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'partial', 'matched')),
  reconciled_at TIMESTAMPTZ,
  payment_file_url TEXT,
  payment_file_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_insurer ON payments(health_insurer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(reconciliation_status);

-- ============================================
-- 7. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT false,
  href TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE glosas ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all data
CREATE POLICY "Authenticated read" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON health_insurers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON medical_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON procedures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON glosas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON payments FOR SELECT TO authenticated USING (true);

-- Authenticated users can modify data
CREATE POLICY "Authenticated write" ON medical_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write" ON procedures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write" ON glosas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notifications: users can only see their own
CREATE POLICY "Own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Mark own read" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role" ON patients FOR ALL TO service_role USING (true);
CREATE POLICY "Service role" ON health_insurers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role" ON medical_accounts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role" ON procedures FOR ALL TO service_role USING (true);
CREATE POLICY "Service role" ON glosas FOR ALL TO service_role USING (true);
CREATE POLICY "Service role" ON payments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role" ON notifications FOR ALL TO service_role USING (true);

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER insurers_updated_at BEFORE UPDATE ON health_insurers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON medical_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER glosas_updated_at BEFORE UPDATE ON glosas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
