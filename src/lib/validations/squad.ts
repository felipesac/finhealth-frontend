import { z } from 'zod';

// ============================================================================
// validate-tiss (billing-agent)
// ============================================================================

const procedimentoSchema = z.object({
  codigo_tuss: z.string().min(1, 'Codigo TUSS obrigatorio'),
  descricao: z.string().min(1, 'Descricao obrigatoria'),
  quantidade: z.number().int().positive('Quantidade deve ser positiva'),
  valor_unitario: z.number().nonnegative('Valor unitario deve ser positivo'),
  cid_principal: z.string().optional(),
  cid_secundario: z.string().optional(),
});

const materialMedicamentoSchema = z.object({
  codigo: z.string().min(1, 'Codigo obrigatorio'),
  descricao: z.string().min(1, 'Descricao obrigatoria'),
  quantidade: z.number().int().positive('Quantidade deve ser positiva'),
  valor_unitario: z.number().nonnegative('Valor deve ser positivo'),
});

export const validateTissSchema = z.object({
  guia: z.object({
    tipo: z.enum(['consulta', 'sp-sadt', 'internacao', 'honorarios', 'odontologia'], {
      message: 'Tipo de guia invalido',
    }),
    numero_guia: z.string().min(1, 'Numero da guia obrigatorio'),
    data_atendimento: z.string().min(1, 'Data do atendimento obrigatoria'),
    beneficiario: z.object({
      numero_carteira: z.string().min(1, 'Numero da carteira obrigatorio'),
      nome: z.string().min(1, 'Nome do beneficiario obrigatorio'),
      data_nascimento: z.string().min(1, 'Data de nascimento obrigatoria'),
    }),
    prestador: z.object({
      codigo_cnes: z.string().min(1, 'Codigo CNES obrigatorio'),
      nome: z.string().min(1, 'Nome do prestador obrigatorio'),
      tipo: z.enum(['hospital', 'clinica', 'laboratorio'], {
        message: 'Tipo de prestador invalido',
      }),
    }),
    procedimentos: z.array(procedimentoSchema).min(1, 'Pelo menos um procedimento obrigatorio'),
    materiais_medicamentos: z.array(materialMedicamentoSchema).optional(),
  }),
  operadora: z.object({
    codigo_ans: z.string().min(1, 'Codigo ANS obrigatorio'),
    nome: z.string().min(1, 'Nome da operadora obrigatorio'),
    regras_especificas: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type ValidateTissInput = z.infer<typeof validateTissSchema>;

// ============================================================================
// audit-account (auditor-agent)
// ============================================================================

const contaProcedimentoSchema = z.object({
  codigo_tuss: z.string().min(1),
  descricao: z.string().min(1),
  quantidade: z.number().int().positive(),
  valor: z.number().nonnegative(),
  data_execucao: z.string().min(1),
  profissional_executante: z.string().min(1),
});

const itemSchema = z.object({
  codigo: z.string().min(1),
  descricao: z.string().min(1),
  quantidade: z.number().int().positive(),
  valor: z.number().nonnegative(),
});

const diariaSchema = z.object({
  tipo: z.string().min(1),
  quantidade: z.number().int().nonnegative(),
  valor_unitario: z.number().nonnegative(),
});

export const auditAccountSchema = z.object({
  conta: z.object({
    id: z.string().min(1, 'ID da conta obrigatorio'),
    paciente: z.object({
      nome: z.string().min(1, 'Nome do paciente obrigatorio'),
      idade: z.number().int().nonnegative('Idade invalida'),
      sexo: z.enum(['M', 'F'], { message: 'Sexo deve ser M ou F' }),
    }),
    internacao: z.object({
      data_entrada: z.string().min(1),
      data_saida: z.string().min(1),
      tipo_leito: z.enum(['enfermaria', 'apartamento', 'uti', 'semi-uti']),
      cid_principal: z.string().min(1),
      cids_secundarios: z.array(z.string()),
    }).optional(),
    procedimentos: z.array(contaProcedimentoSchema),
    materiais: z.array(itemSchema),
    medicamentos: z.array(itemSchema),
    diarias: z.array(diariaSchema),
    valor_total: z.number().nonnegative('Valor total deve ser positivo'),
  }),
  operadora: z.object({
    codigo_ans: z.string().min(1, 'Codigo ANS obrigatorio'),
    nome: z.string().min(1, 'Nome da operadora obrigatorio'),
    historico_glosas: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
});

export type AuditAccountInput = z.infer<typeof auditAccountSchema>;

// ============================================================================
// reconcile-payment (reconciliation-agent)
// ============================================================================

const repasseItemSchema = z.object({
  numero_guia: z.string().min(1, 'Numero da guia obrigatorio'),
  numero_protocolo: z.string().optional(),
  valor_apresentado: z.number().nonnegative(),
  valor_pago: z.number().nonnegative(),
  codigo_glosa: z.string().optional(),
  justificativa_glosa: z.string().optional(),
});

const guiaEnviadaSchema = z.object({
  numero_guia: z.string().min(1),
  valor_apresentado: z.number().nonnegative(),
  data_envio: z.string().min(1),
  status: z.string().min(1),
});

export const reconcilePaymentSchema = z.object({
  repasse: z.object({
    operadora: z.object({
      codigo_ans: z.string().min(1, 'Codigo ANS obrigatorio'),
      nome: z.string().min(1, 'Nome da operadora obrigatorio'),
    }),
    competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Competencia deve ser YYYY-MM'),
    data_pagamento: z.string().min(1, 'Data do pagamento obrigatoria'),
    valor_total: z.number().nonnegative('Valor total deve ser positivo'),
    arquivo_xml: z.string().optional(),
    itens: z.array(repasseItemSchema).min(1, 'Pelo menos um item obrigatorio'),
  }),
  guias_enviadas: z.array(guiaEnviadaSchema).min(1, 'Pelo menos uma guia enviada obrigatoria'),
});

export type ReconcilePaymentInput = z.infer<typeof reconcilePaymentSchema>;

// ============================================================================
// forecast-cashflow (cashflow-agent)
// ============================================================================

const recebivelSchema = z.object({
  operadora: z.string().min(1),
  valor: z.number().nonnegative(),
  data_prevista: z.string().min(1),
  probabilidade: z.number().min(0).max(1).optional(),
});

const compromissoSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().nonnegative(),
  data_vencimento: z.string().min(1),
  tipo: z.enum(['fixo', 'variavel']),
});

export const forecastCashflowSchema = z.object({
  periodo_projecao: z.number().int().positive('Periodo deve ser positivo (dias)'),
  posicao_atual: z.object({
    saldo_caixa: z.number(),
    data_referencia: z.string().min(1, 'Data de referencia obrigatoria'),
  }),
  recebiveis: z.array(recebivelSchema),
  compromissos: z.array(compromissoSchema),
  historico: z.object({
    receitas_mensais: z.array(z.number()),
    despesas_mensais: z.array(z.number()),
    sazonalidade: z.record(z.string(), z.number()).optional(),
  }).optional(),
});

export type ForecastCashflowInput = z.infer<typeof forecastCashflowSchema>;

// ============================================================================
// route-request (supervisor-agent)
// ============================================================================

export const routeRequestSchema = z.object({
  requisicao: z.object({
    texto: z.string().min(1, 'Texto da requisicao obrigatorio'),
    contexto: z.string().optional(),
    usuario: z.object({
      id: z.string().min(1, 'ID do usuario obrigatorio'),
      perfil: z.string().min(1, 'Perfil do usuario obrigatorio'),
    }),
    historico_sessao: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
});

export type RouteRequestInput = z.infer<typeof routeRequestSchema>;
