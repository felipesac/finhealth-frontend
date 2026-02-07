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
