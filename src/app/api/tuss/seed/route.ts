import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Common TUSS procedures data
const TUSS_PROCEDURES = [
  // Consultas
  { code: '10101012', description: 'Consulta em consultorio (no horario normal ou preestabelecido)', chapter: 'Procedimentos Gerais', group_name: 'Consultas', procedure_type: 'consulta', unit_price: 150.00 },
  { code: '10101020', description: 'Consulta em domicilio', chapter: 'Procedimentos Gerais', group_name: 'Consultas', procedure_type: 'consulta', unit_price: 200.00 },
  { code: '10101039', description: 'Consulta em pronto socorro', chapter: 'Procedimentos Gerais', group_name: 'Consultas', procedure_type: 'consulta', unit_price: 180.00 },

  // Exames Hematologia
  { code: '40301010', description: 'Hemograma completo', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 25.00 },
  { code: '40301028', description: 'Hemossedimentacao (VHS)', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 8.00 },
  { code: '40301060', description: 'Contagem de plaquetas', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 8.00 },

  // Exames Bioquimicos
  { code: '40302040', description: 'Glicose', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 12.00 },
  { code: '40302067', description: 'Hemoglobina glicada (HbA1c)', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 35.00 },
  { code: '40302105', description: 'Ureia', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 15.00 },
  { code: '40302113', description: 'Creatinina', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 15.00 },
  { code: '40302121', description: 'Acido urico', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 15.00 },
  { code: '40302130', description: 'Colesterol total', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 12.00 },
  { code: '40302148', description: 'Colesterol HDL', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 15.00 },
  { code: '40302164', description: 'Triglicerides', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 15.00 },

  // Funcao Hepatica
  { code: '40302210', description: 'TGO (AST)', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 12.00 },
  { code: '40302229', description: 'TGP (ALT)', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 12.00 },
  { code: '40302237', description: 'Gama GT', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 15.00 },

  // Hormonios
  { code: '40302318', description: 'TSH', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 35.00 },
  { code: '40302326', description: 'T4 livre', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 30.00 },
  { code: '40302342', description: 'PSA total', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 40.00 },

  // Urina e Fezes
  { code: '40311015', description: 'Urina tipo I (EAS)', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 10.00 },
  { code: '40311031', description: 'Urocultura', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 25.00 },
  { code: '40312011', description: 'Parasitologico de fezes', chapter: 'Procedimentos Diagnosticos', group_name: 'Patologia Clinica', procedure_type: 'exame', unit_price: 12.00 },

  // Radiografia
  { code: '41001010', description: 'Radiografia de torax (PA)', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 45.00 },
  { code: '41001028', description: 'Radiografia de torax (PA e perfil)', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 60.00 },
  { code: '41001052', description: 'Radiografia de coluna lombar', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 60.00 },

  // Ultrassonografia
  { code: '41101014', description: 'Ultrassonografia de abdomen total', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 120.00 },
  { code: '41101049', description: 'Ultrassonografia de tireoide', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 90.00 },
  { code: '41101057', description: 'Ultrassonografia de mama', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 100.00 },

  // Tomografia
  { code: '41201019', description: 'Tomografia de cranio', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 350.00 },
  { code: '41201027', description: 'Tomografia de torax', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 400.00 },
  { code: '41201035', description: 'Tomografia de abdomen', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 450.00 },

  // Ressonancia
  { code: '41301017', description: 'Ressonancia magnetica de cranio', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 800.00 },
  { code: '41301041', description: 'Ressonancia magnetica de joelho', chapter: 'Procedimentos Diagnosticos', group_name: 'Diagnostico por Imagem', procedure_type: 'exame', unit_price: 700.00 },

  // Cardiologia
  { code: '40101010', description: 'Eletrocardiograma (ECG)', chapter: 'Procedimentos Diagnosticos', group_name: 'Metodos Graficos', procedure_type: 'exame', unit_price: 35.00 },
  { code: '40101029', description: 'Holter 24 horas', chapter: 'Procedimentos Diagnosticos', group_name: 'Metodos Graficos', procedure_type: 'exame', unit_price: 180.00 },
  { code: '40101045', description: 'Teste ergometrico', chapter: 'Procedimentos Diagnosticos', group_name: 'Metodos Graficos', procedure_type: 'exame', unit_price: 200.00 },
  { code: '40102017', description: 'Ecocardiograma transtorácico', chapter: 'Procedimentos Diagnosticos', group_name: 'Metodos Graficos', procedure_type: 'exame', unit_price: 250.00 },

  // Endoscopia
  { code: '40201015', description: 'Endoscopia digestiva alta', chapter: 'Procedimentos Diagnosticos', group_name: 'Endoscopia', procedure_type: 'exame', unit_price: 350.00 },
  { code: '40201023', description: 'Colonoscopia', chapter: 'Procedimentos Diagnosticos', group_name: 'Endoscopia', procedure_type: 'exame', unit_price: 500.00 },

  // Cirurgias
  { code: '31001010', description: 'Colecistectomia videolaparoscopica', chapter: 'Procedimentos Cirurgicos', group_name: 'Cirurgia Geral', procedure_type: 'cirurgia', unit_price: 2500.00 },
  { code: '31001029', description: 'Apendicectomia', chapter: 'Procedimentos Cirurgicos', group_name: 'Cirurgia Geral', procedure_type: 'cirurgia', unit_price: 1800.00 },
  { code: '31001037', description: 'Herniorrafia inguinal', chapter: 'Procedimentos Cirurgicos', group_name: 'Cirurgia Geral', procedure_type: 'cirurgia', unit_price: 1500.00 },

  // Fisioterapia
  { code: '50000012', description: 'Sessao de fisioterapia motora', chapter: 'Terapias', group_name: 'Fisioterapia', procedure_type: 'terapia', unit_price: 50.00 },
  { code: '50000020', description: 'Sessao de fisioterapia respiratoria', chapter: 'Terapias', group_name: 'Fisioterapia', procedure_type: 'terapia', unit_price: 50.00 },

  // Diarias
  { code: '80001011', description: 'Diaria de enfermaria', chapter: 'Diarias', group_name: 'Internacao', procedure_type: 'procedimento', unit_price: 350.00 },
  { code: '80001020', description: 'Diaria de apartamento', chapter: 'Diarias', group_name: 'Internacao', procedure_type: 'procedimento', unit_price: 500.00 },
  { code: '80001038', description: 'Diaria de UTI adulto', chapter: 'Diarias', group_name: 'Internacao', procedure_type: 'procedimento', unit_price: 2000.00 },
];

export async function POST() {
  try {
    // First, try to create the table if it doesn't exist
    // We'll use upsert to handle both insert and update cases

    const { data, error } = await supabaseAdmin
      .from('tuss_procedures')
      .upsert(
        TUSS_PROCEDURES.map(proc => ({
          ...proc,
          active: true,
          ans_update_date: new Date().toISOString().split('T')[0],
        })),
        { onConflict: 'code' }
      )
      .select();

    if (error) {
      // If table doesn't exist, we need to create it first
      if (error.code === '42P01') {
        return NextResponse.json(
          {
            error: 'Table tuss_procedures does not exist. Please run the migration first.',
            migration: 'Run the SQL in supabase/migrations/002_tuss_table.sql'
          },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      message: `Seeded ${data?.length || 0} TUSS procedures`
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err.message || 'Failed to seed TUSS procedures' },
      { status: 500 }
    );
  }
}
