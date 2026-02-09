import { z } from 'zod';

// ============================================
// Auth
// ============================================
export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha obrigatoria'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// Settings
// ============================================
export const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatoria'),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================
// Appeals (API)
// ============================================
export const appealSchema = z.object({
  glosaId: z.string().uuid('ID da glosa invalido'),
  text: z.string().trim().min(1, 'Texto do recurso obrigatorio'),
  action: z.enum(['save_draft', 'submit'], { message: 'Acao invalida' }),
});

export type AppealInput = z.infer<typeof appealSchema>;

// ============================================
// Reconciliation (API)
// ============================================
export const reconcileSchema = z.object({
  paymentId: z.string().uuid('ID do pagamento invalido'),
  accountId: z.string().uuid('ID da conta invalido'),
});

export type ReconcileInput = z.infer<typeof reconcileSchema>;

// ============================================
// Export (API)
// ============================================
export const exportSchema = z.object({
  types: z.array(z.enum(['accounts', 'glosas', 'payments', 'patients', 'insurers'])).min(1, 'Selecione pelo menos um tipo'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo;
    }
    return true;
  },
  { message: 'Data inicial deve ser anterior a data final', path: ['dateFrom'] }
);

export type ExportInput = z.infer<typeof exportSchema>;

// ============================================
// TISS Upload (API)
// ============================================
export const tissUploadSchema = z.object({
  xml: z.string().min(1, 'XML obrigatorio'),
  accountId: z.string().optional(),
});

export type TissUploadInput = z.infer<typeof tissUploadSchema>;

// ============================================
// Certificate Upload (API)
// ============================================
export const certificateUploadSchema = z.object({
  fileName: z.string().min(1, 'Nome do arquivo obrigatorio'),
  fileData: z.string().min(1, 'Dados do certificado obrigatorios'),
  password: z.string().min(1, 'Senha do certificado obrigatoria'),
  name: z.string().min(1, 'Nome de identificacao obrigatorio').max(100),
});

export type CertificateUploadInput = z.infer<typeof certificateUploadSchema>;

// ============================================
// SUS BPA (API)
// ============================================
export const susBpaSchema = z.object({
  cnes: z.string().min(1, 'CNES obrigatorio').max(7, 'CNES invalido'),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Competencia deve ser YYYY-MM'),
  cbo: z.string().min(1, 'CBO obrigatorio').max(6, 'CBO invalido'),
  procedimento: z.string().min(1, 'Procedimento obrigatorio').max(20),
  quantidade: z.number().int().min(1, 'Quantidade minima: 1'),
  cnpj_prestador: z.string().max(14).optional(),
  patient_id: z.string().uuid('ID do paciente invalido').optional(),
});

export type SusBpaInput = z.infer<typeof susBpaSchema>;

// ============================================
// SUS AIH (API)
// ============================================
export const susAihSchema = z.object({
  numero_aih: z.string().min(1, 'Numero AIH obrigatorio').max(13),
  patient_id: z.string().uuid('ID do paciente invalido').optional(),
  procedimento_principal: z.string().min(1, 'Procedimento principal obrigatorio').max(20),
  procedimento_secundario: z.string().max(20).optional(),
  data_internacao: z.string().min(1, 'Data de internacao obrigatoria'),
  data_saida: z.string().optional(),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  tipo_aih: z.enum(['1', '5'], { message: 'Tipo AIH invalido' }),
  cnes: z.string().min(1, 'CNES obrigatorio').max(7),
  cbo_medico: z.string().max(6).optional(),
  diarias: z.number().int().min(0).default(0),
});

export type SusAihInput = z.infer<typeof susAihSchema>;

// ============================================
// Medical Accounts (API)
// ============================================
export const createAccountSchema = z.object({
  account_number: z.string().trim().min(1, 'Numero da conta obrigatorio'),
  patient_id: z.string().uuid('ID do paciente invalido'),
  health_insurer_id: z.string().uuid('ID da operadora invalido'),
  account_type: z.enum(['internacao', 'ambulatorial', 'sadt', 'honorarios'], {
    message: 'Tipo de conta invalido',
  }),
  admission_date: z.string().min(1, 'Data de admissao obrigatoria'),
  discharge_date: z.string().optional(),
  total_amount: z.number().min(0, 'Valor deve ser positivo'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
