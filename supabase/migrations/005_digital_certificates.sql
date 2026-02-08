-- Digital Certificates table for A1 certificate management
-- Stores metadata and encrypted certificate content for TISS signing

-- ============================================
-- DIGITAL CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS digital_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  common_name TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  cnpj VARCHAR(14),
  cpf VARCHAR(11),
  certificate_type VARCHAR(10) NOT NULL DEFAULT 'A1' CHECK (certificate_type IN ('A1')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'replaced')),
  pfx_data BYTEA NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  fingerprint TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active certificate per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_active_user
  ON digital_certificates(user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_certificates_user ON digital_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON digital_certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_valid_to ON digital_certificates(valid_to);
CREATE INDEX IF NOT EXISTS idx_certificates_cnpj ON digital_certificates(cnpj);
CREATE INDEX IF NOT EXISTS idx_certificates_fingerprint ON digital_certificates(fingerprint);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE digital_certificates ENABLE ROW LEVEL SECURITY;

-- Users can only see their own certificates
CREATE POLICY "Own certificates read" ON digital_certificates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own certificates
CREATE POLICY "Own certificates insert" ON digital_certificates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own certificates
CREATE POLICY "Own certificates update" ON digital_certificates
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own certificates
CREATE POLICY "Own certificates delete" ON digital_certificates
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role" ON digital_certificates
  FOR ALL TO service_role USING (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER certificates_updated_at
  BEFORE UPDATE ON digital_certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
