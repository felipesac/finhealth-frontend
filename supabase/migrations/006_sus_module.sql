-- ============================================
-- Migration 006: SUS Billing Module
-- Tables: sus_procedures, sus_bpa, sus_aih
-- ============================================

-- SUS Procedures (SIGTAP table)
CREATE TABLE IF NOT EXISTS sus_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_sigtap VARCHAR(20) NOT NULL,
  nome TEXT NOT NULL,
  competencia VARCHAR(7) NOT NULL, -- format: YYYY-MM
  valor_ambulatorial NUMERIC(12,2) DEFAULT 0,
  valor_hospitalar NUMERIC(12,2) DEFAULT 0,
  complexidade VARCHAR(20), -- 'basica', 'media', 'alta'
  modalidade VARCHAR(30), -- 'ambulatorial', 'hospitalar', 'ambos'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sus_procedures_codigo_comp
  ON sus_procedures(codigo_sigtap, competencia);
CREATE INDEX IF NOT EXISTS idx_sus_procedures_nome
  ON sus_procedures USING gin(to_tsvector('portuguese', nome));

-- BPA - Boletim de Producao Ambulatorial
CREATE TABLE IF NOT EXISTS sus_bpa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cnes VARCHAR(7) NOT NULL,
  competencia VARCHAR(7) NOT NULL, -- format: YYYY-MM
  cbo VARCHAR(6) NOT NULL,
  procedimento VARCHAR(20) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  cnpj_prestador VARCHAR(14),
  patient_id UUID REFERENCES patients(id),
  valor_unitario NUMERIC(12,2) DEFAULT 0,
  valor_total NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, validado, enviado, aprovado, rejeitado
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sus_bpa_user ON sus_bpa(user_id);
CREATE INDEX IF NOT EXISTS idx_sus_bpa_competencia ON sus_bpa(competencia);
CREATE INDEX IF NOT EXISTS idx_sus_bpa_cnes ON sus_bpa(cnes);
CREATE INDEX IF NOT EXISTS idx_sus_bpa_status ON sus_bpa(status);
CREATE INDEX IF NOT EXISTS idx_sus_bpa_created ON sus_bpa(created_at DESC);

-- AIH - Autorizacao de Internacao Hospitalar
CREATE TABLE IF NOT EXISTS sus_aih (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  numero_aih VARCHAR(13) NOT NULL,
  patient_id UUID REFERENCES patients(id),
  procedimento_principal VARCHAR(20) NOT NULL,
  procedimento_secundario VARCHAR(20),
  data_internacao DATE NOT NULL,
  data_saida DATE,
  valor NUMERIC(12,2) DEFAULT 0,
  tipo_aih VARCHAR(5) NOT NULL DEFAULT '1', -- 1=normal, 5=longa permanencia
  cnes VARCHAR(7) NOT NULL,
  cbo_medico VARCHAR(6),
  diarias INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, validado, enviado, aprovado, rejeitado
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sus_aih_numero ON sus_aih(numero_aih);
CREATE INDEX IF NOT EXISTS idx_sus_aih_user ON sus_aih(user_id);
CREATE INDEX IF NOT EXISTS idx_sus_aih_patient ON sus_aih(patient_id);
CREATE INDEX IF NOT EXISTS idx_sus_aih_internacao ON sus_aih(data_internacao DESC);
CREATE INDEX IF NOT EXISTS idx_sus_aih_status ON sus_aih(status);
CREATE INDEX IF NOT EXISTS idx_sus_aih_created ON sus_aih(created_at DESC);

-- Enable RLS
ALTER TABLE sus_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sus_bpa ENABLE ROW LEVEL SECURITY;
ALTER TABLE sus_aih ENABLE ROW LEVEL SECURITY;

-- RLS Policies: sus_procedures readable by all authenticated users
CREATE POLICY "Authenticated users can read sus_procedures"
  ON sus_procedures FOR SELECT TO authenticated
  USING (true);

-- RLS Policies: sus_bpa - users see own records
CREATE POLICY "Users read own BPA" ON sus_bpa
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own BPA" ON sus_bpa
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own BPA" ON sus_bpa
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies: sus_aih - users see own records
CREATE POLICY "Users read own AIH" ON sus_aih
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own AIH" ON sus_aih
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own AIH" ON sus_aih
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER sus_procedures_updated_at
  BEFORE UPDATE ON sus_procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sus_bpa_updated_at
  BEFORE UPDATE ON sus_bpa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sus_aih_updated_at
  BEFORE UPDATE ON sus_aih
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
