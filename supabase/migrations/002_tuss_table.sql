-- TUSS Procedures Table
-- Contains the official TUSS (Terminologia Unificada da Saude Suplementar) codes

CREATE TABLE IF NOT EXISTS tuss_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  chapter VARCHAR(100),
  group_name VARCHAR(100),
  subgroup VARCHAR(100),
  procedure_type VARCHAR(50), -- 'consulta', 'exame', 'procedimento', 'terapia', 'cirurgia'
  unit_price DECIMAL(10, 2) DEFAULT 0,
  aux_price DECIMAL(10, 2) DEFAULT 0, -- preco auxiliar
  film_price DECIMAL(10, 2) DEFAULT 0, -- preco filme
  uco DECIMAL(6, 2) DEFAULT 1, -- Unidade de Custo Operacional
  active BOOLEAN DEFAULT true,
  ans_update_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_tuss_code ON tuss_procedures(code);
CREATE INDEX IF NOT EXISTS idx_tuss_description ON tuss_procedures USING gin(to_tsvector('portuguese', description));
CREATE INDEX IF NOT EXISTS idx_tuss_chapter ON tuss_procedures(chapter);
CREATE INDEX IF NOT EXISTS idx_tuss_type ON tuss_procedures(procedure_type);

-- Enable RLS
ALTER TABLE tuss_procedures ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON tuss_procedures
  FOR SELECT TO authenticated USING (true);

-- Allow full access for service role
CREATE POLICY "Allow full access for service role" ON tuss_procedures
  FOR ALL TO service_role USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_tuss_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tuss_procedures_updated_at ON tuss_procedures;
CREATE TRIGGER tuss_procedures_updated_at
  BEFORE UPDATE ON tuss_procedures
  FOR EACH ROW EXECUTE FUNCTION update_tuss_updated_at();

-- Insert common TUSS procedures
INSERT INTO tuss_procedures (code, description, chapter, group_name, procedure_type, unit_price) VALUES
-- Consultas
('10101012', 'Consulta em consultorio (no horario normal ou preestabelecido)', 'Procedimentos Gerais', 'Consultas', 'consulta', 150.00),
('10101020', 'Consulta em domicilio', 'Procedimentos Gerais', 'Consultas', 'consulta', 200.00),
('10101039', 'Consulta em pronto socorro', 'Procedimentos Gerais', 'Consultas', 'consulta', 180.00),
('10102019', 'Consulta medica em atencao primaria', 'Procedimentos Gerais', 'Consultas', 'consulta', 120.00),

-- Exames Laboratoriais - Hematologia
('40301010', 'Hemograma completo', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 25.00),
('40301028', 'Hemossedimentacao (VHS)', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 8.00),
('40301036', 'Hematocrito', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 6.00),
('40301044', 'Hemoglobina', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 6.00),
('40301052', 'Leucograma', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40301060', 'Contagem de plaquetas', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 8.00),
('40301079', 'Reticulocitos', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 12.00),

-- Exames Bioquimicos
('40302040', 'Glicose', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 12.00),
('40302059', 'Glicose pos-prandial', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 12.00),
('40302067', 'Hemoglobina glicada (HbA1c)', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 35.00),
('40302075', 'Curva glicemica (4 dosagens)', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 48.00),
('40302105', 'Ureia', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40302113', 'Creatinina', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40302121', 'Acido urico', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40302130', 'Colesterol total', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 12.00),
('40302148', 'Colesterol HDL', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40302156', 'Colesterol LDL', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40302164', 'Triglicerides', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40302172', 'Lipidograma', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 50.00),

-- Funcao Hepatica
('40302210', 'TGO (AST)', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 12.00),
('40302229', 'TGP (ALT)', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 12.00),
('40302237', 'Gama GT', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40302245', 'Fosfatase alcalina', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 12.00),
('40302253', 'Bilirrubinas totais e fracoes', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 18.00),
('40302261', 'Proteinas totais e fracoes', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40302270', 'Albumina', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 10.00),

-- Hormonios
('40302318', 'TSH', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 35.00),
('40302326', 'T4 livre', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 30.00),
('40302334', 'T3', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 30.00),
('40302342', 'PSA total', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 40.00),
('40302350', 'PSA livre', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 40.00),

-- Urina
('40311015', 'Urina tipo I (EAS)', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 10.00),
('40311023', 'Urina 24 horas - volume', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 8.00),
('40311031', 'Urocultura', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 25.00),

-- Fezes
('40312011', 'Parasitologico de fezes', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 12.00),
('40312020', 'Sangue oculto nas fezes', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 15.00),
('40312038', 'Coprocultura', 'Procedimentos Diagnosticos', 'Patologia Clinica', 'exame', 25.00),

-- Imagem - Radiografia
('41001010', 'Radiografia de torax (PA)', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 45.00),
('41001028', 'Radiografia de torax (PA e perfil)', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 60.00),
('41001036', 'Radiografia de abdomen simples', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 50.00),
('41001044', 'Radiografia de coluna cervical', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 55.00),
('41001052', 'Radiografia de coluna lombar', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 60.00),
('41001060', 'Radiografia de bacia', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 55.00),
('41001079', 'Radiografia de joelho', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 45.00),
('41001087', 'Radiografia de mao', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 40.00),

-- Ultrassonografia
('41101014', 'Ultrassonografia de abdomen total', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 120.00),
('41101022', 'Ultrassonografia de abdomen superior', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 100.00),
('41101030', 'Ultrassonografia pelvica', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 100.00),
('41101049', 'Ultrassonografia de tireoide', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 90.00),
('41101057', 'Ultrassonografia de mama', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 100.00),
('41101065', 'Ultrassonografia obstetrica', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 120.00),
('41101073', 'Ultrassonografia transvaginal', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 110.00),
('41101081', 'Ultrassonografia de prostata via abdominal', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 100.00),

-- Tomografia
('41201019', 'Tomografia de cranio', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 350.00),
('41201027', 'Tomografia de torax', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 400.00),
('41201035', 'Tomografia de abdomen', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 450.00),
('41201043', 'Tomografia de coluna', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 380.00),

-- Ressonancia
('41301017', 'Ressonancia magnetica de cranio', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 800.00),
('41301025', 'Ressonancia magnetica de coluna cervical', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 750.00),
('41301033', 'Ressonancia magnetica de coluna lombar', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 750.00),
('41301041', 'Ressonancia magnetica de joelho', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 700.00),
('41301050', 'Ressonancia magnetica de ombro', 'Procedimentos Diagnosticos', 'Diagnostico por Imagem', 'exame', 700.00),

-- Eletrocardiografia
('40101010', 'Eletrocardiograma (ECG)', 'Procedimentos Diagnosticos', 'Metodos Graficos', 'exame', 35.00),
('40101029', 'Holter 24 horas', 'Procedimentos Diagnosticos', 'Metodos Graficos', 'exame', 180.00),
('40101037', 'MAPA 24 horas', 'Procedimentos Diagnosticos', 'Metodos Graficos', 'exame', 180.00),
('40101045', 'Teste ergometrico', 'Procedimentos Diagnosticos', 'Metodos Graficos', 'exame', 200.00),

-- Ecocardiografia
('40102017', 'Ecocardiograma transtorácico', 'Procedimentos Diagnosticos', 'Metodos Graficos', 'exame', 250.00),
('40102025', 'Ecocardiograma com doppler', 'Procedimentos Diagnosticos', 'Metodos Graficos', 'exame', 300.00),

-- Endoscopia
('40201015', 'Endoscopia digestiva alta', 'Procedimentos Diagnosticos', 'Endoscopia', 'exame', 350.00),
('40201023', 'Colonoscopia', 'Procedimentos Diagnosticos', 'Endoscopia', 'exame', 500.00),
('40201031', 'Retossigmoidoscopia', 'Procedimentos Diagnosticos', 'Endoscopia', 'exame', 250.00),

-- Cirurgias Gerais
('31001010', 'Colecistectomia videolaparoscopica', 'Procedimentos Cirurgicos', 'Cirurgia Geral', 'cirurgia', 2500.00),
('31001029', 'Apendicectomia', 'Procedimentos Cirurgicos', 'Cirurgia Geral', 'cirurgia', 1800.00),
('31001037', 'Herniorrafia inguinal', 'Procedimentos Cirurgicos', 'Cirurgia Geral', 'cirurgia', 1500.00),
('31001045', 'Herniorrafia umbilical', 'Procedimentos Cirurgicos', 'Cirurgia Geral', 'cirurgia', 1200.00),

-- Fisioterapia
('50000012', 'Sessao de fisioterapia motora', 'Terapias', 'Fisioterapia', 'terapia', 50.00),
('50000020', 'Sessao de fisioterapia respiratoria', 'Terapias', 'Fisioterapia', 'terapia', 50.00),
('50000039', 'Sessao de RPG', 'Terapias', 'Fisioterapia', 'terapia', 80.00),
('50000047', 'Sessao de hidroterapia', 'Terapias', 'Fisioterapia', 'terapia', 70.00),

-- Diarias
('80001011', 'Diaria de enfermaria', 'Diarias', 'Internacao', 'procedimento', 350.00),
('80001020', 'Diaria de apartamento', 'Diarias', 'Internacao', 'procedimento', 500.00),
('80001038', 'Diaria de UTI adulto', 'Diarias', 'Internacao', 'procedimento', 2000.00),
('80001046', 'Diaria de UTI pediatrica', 'Diarias', 'Internacao', 'procedimento', 2200.00),
('80001054', 'Diaria de UTI neonatal', 'Diarias', 'Internacao', 'procedimento', 2500.00)

ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  chapter = EXCLUDED.chapter,
  group_name = EXCLUDED.group_name,
  procedure_type = EXCLUDED.procedure_type,
  unit_price = EXCLUDED.unit_price,
  updated_at = NOW();
