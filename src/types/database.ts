// User roles for RBAC
export type UserRole = 'admin' | 'finance_manager' | 'auditor' | 'tiss_operator';

// Organization types (multi-tenant)
export type OrganizationType = 'hospital' | 'ubs' | 'clinica';
export type OrganizationPlan = 'basic' | 'professional' | 'enterprise';
export type OrganizationMemberRole = 'admin' | 'billing' | 'auditor' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  plan: OrganizationPlan;
  settings: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: OrganizationMemberRole;
  invited_at: string;
  accepted_at?: string;
  organization?: Organization;
}

// Database entity types matching Supabase schema

export type AccountType = 'internacao' | 'ambulatorial' | 'sadt' | 'honorarios';

export type AccountStatus =
  | 'pending'
  | 'validated'
  | 'sent'
  | 'paid'
  | 'glosa'
  | 'appeal';

export type GlosaType = 'administrativa' | 'tecnica' | 'linear';

export type AppealStatus =
  | 'pending'
  | 'in_progress'
  | 'sent'
  | 'accepted'
  | 'rejected';

export interface Patient {
  id: string;
  external_id?: string;
  name: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: Record<string, unknown>;
  /** @deprecated Renamed to health_insurance_id_deprecated in DB. Use health_insurer_id via medical_accounts. */
  health_insurance_id_deprecated?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface HealthInsurer {
  id: string;
  ans_code: string;
  name: string;
  cnpj?: string;
  tiss_version: string;
  contact_email?: string;
  api_endpoint?: string;
  config: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicalAccount {
  id: string;
  account_number: string;
  patient_id?: string;
  health_insurer_id?: string;
  admission_date?: string;
  discharge_date?: string;
  account_type: AccountType;
  status: AccountStatus;
  total_amount: number;
  approved_amount: number;
  glosa_amount: number;
  paid_amount: number;
  tiss_guide_number?: string;
  tiss_guide_type?: string;
  tiss_xml?: string;
  tiss_validation_status?: string;
  tiss_validation_errors?: Record<string, unknown>;
  audit_score?: number;
  glosa_risk_score?: number;
  audit_issues?: Record<string, unknown>;
  organization_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  paid_at?: string;
  created_by?: string;
  // Joined relations
  patient?: Patient;
  health_insurer?: HealthInsurer;
  organization?: Organization;
}

export interface Procedure {
  id: string;
  medical_account_id: string;
  tuss_code?: string;
  sigtap_code?: string;
  cbhpm_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  performed_at?: string;
  professional_id?: string;
  professional_name?: string;
  professional_council?: string;
  status: string;
  glosa_code?: string;
  glosa_reason?: string;
  appeal_status?: string;
  organization_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Glosa {
  id: string;
  medical_account_id: string;
  procedure_id?: string;
  glosa_code: string;
  glosa_description?: string;
  glosa_type?: GlosaType;
  original_amount: number;
  glosa_amount: number;
  appeal_status: AppealStatus;
  appeal_text?: string;
  appeal_sent_at?: string;
  appeal_response?: string;
  appeal_resolved_at?: string;
  ai_recommendation?: string;
  success_probability?: number;
  priority_score?: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined relations
  medical_account?: MedicalAccount;
  procedure?: Procedure;
}

export interface Payment {
  id: string;
  health_insurer_id: string;
  payment_date: string;
  payment_reference?: string;
  bank_account?: string;
  total_amount: number;
  matched_amount: number;
  unmatched_amount: number;
  reconciliation_status: string;
  reconciled_at?: string;
  payment_file_url?: string;
  payment_file_type?: string;
  organization_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined relations
  health_insurer?: HealthInsurer;
}

// Dashboard metrics type
export interface DashboardMetrics {
  totalBilling: number;
  totalGlosas: number;
  totalPayments: number;
  pendingAccounts: number;
  appealSuccessRate: number;
  glosasBreakdown: {
    type: GlosaType;
    count: number;
    amount: number;
  }[];
}

export type CertificateStatus = 'active' | 'expired' | 'revoked' | 'replaced';

export interface DigitalCertificate {
  id: string;
  user_id: string;
  name: string;
  common_name: string;
  serial_number: string;
  issuer: string;
  subject: string;
  valid_from: string;
  valid_to: string;
  cnpj?: string;
  cpf?: string;
  certificate_type: 'A1';
  status: CertificateStatus;
  file_name: string;
  file_size: number;
  fingerprint: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// SUS types
export type SusStatus = 'rascunho' | 'validado' | 'enviado' | 'aprovado' | 'rejeitado';
export type AihTipo = '1' | '5'; // 1=normal, 5=longa permanencia
export type SusComplexidade = 'nao_se_aplica' | 'basica' | 'media' | 'alta';
export type SusModalidade = 'ambulatorial' | 'hospitalar' | 'ambos';
export type SusTipo = 'consulta' | 'exame' | 'procedimento' | 'terapia' | 'cirurgia' | 'medicamento';

export interface SusProcedure {
  id: string;
  codigo_sigtap: string;
  nome: string;
  competencia: string;
  valor_ambulatorial: number;
  valor_hospitalar: number;
  complexidade?: SusComplexidade;
  modalidade?: SusModalidade;
  grupo?: string;
  subgrupo?: string;
  forma_organizacao?: string;
  tipo?: SusTipo;
  codigo_grupo?: string;
  codigo_subgrupo?: string;
  codigo_forma_organizacao?: string;
  created_at: string;
  updated_at: string;
}

export interface SusBpa {
  id: string;
  user_id: string;
  cnes: string;
  competencia: string;
  cbo: string;
  procedimento: string;
  quantidade: number;
  cnpj_prestador?: string;
  patient_id?: string;
  valor_unitario: number;
  valor_total: number;
  status: SusStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  patient?: Patient;
  sus_procedure?: SusProcedure;
}

export interface SusAih {
  id: string;
  user_id: string;
  numero_aih: string;
  patient_id?: string;
  procedimento_principal: string;
  procedimento_secundario?: string;
  data_internacao: string;
  data_saida?: string;
  valor: number;
  tipo_aih: AihTipo;
  cnes: string;
  cbo_medico?: string;
  diarias: number;
  status: SusStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  patient?: Patient;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
