-- Glosa Notifications table for n8n glosa alert workflow
CREATE TABLE IF NOT EXISTS glosa_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_account_id UUID REFERENCES medical_accounts(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICO', 'ALTO', 'MEDIO')),
  risk_score DECIMAL(5, 2) NOT NULL,
  potential_amount DECIMAL(12, 2) DEFAULT 0,
  notification_data JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'read', 'dismissed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_glosa_notifications_account ON glosa_notifications(medical_account_id);
CREATE INDEX IF NOT EXISTS idx_glosa_notifications_severity ON glosa_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_glosa_notifications_status ON glosa_notifications(status);
CREATE INDEX IF NOT EXISTS idx_glosa_notifications_created ON glosa_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE glosa_notifications ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated read" ON glosa_notifications
  FOR SELECT TO authenticated USING (true);

-- Service role full access (for n8n webhook)
CREATE POLICY "Service role" ON glosa_notifications
  FOR ALL TO service_role USING (true);

-- Trigger for updated_at
CREATE TRIGGER glosa_notifications_updated_at
  BEFORE UPDATE ON glosa_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
