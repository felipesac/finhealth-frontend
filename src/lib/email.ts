import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FinHealth <noreply@finhealth.com.br>';

export type EmailType = 'glosa' | 'pagamento' | 'conta';

interface SendEmailParams {
  to: string;
  type: EmailType;
  subject: string;
  data: Record<string, string | number>;
}

const templates: Record<EmailType, (data: Record<string, string | number>) => string> = {
  glosa: (data) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Nova Glosa Registrada</h2>
      <p>Uma nova glosa foi registrada no sistema:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Conta</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.account_number || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Codigo</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.glosa_code || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Valor</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #dc2626;">R$ ${data.amount || '0,00'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Operadora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.insurer || '-'}</td></tr>
      </table>
      <a href="${data.url || '#'}" style="display: inline-block; padding: 10px 20px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 6px;">Ver Detalhes</a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">FinHealth - Sistema de Gestao Financeira em Saude</p>
    </div>
  `,
  pagamento: (data) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Pagamento Recebido</h2>
      <p>Um novo pagamento foi registrado:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Operadora</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.insurer || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Valor</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #16a34a;">R$ ${data.amount || '0,00'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Referencia</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.reference || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Conciliacao</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.status || 'Pendente'}</td></tr>
      </table>
      <a href="${data.url || '#'}" style="display: inline-block; padding: 10px 20px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 6px;">Ver Detalhes</a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">FinHealth - Sistema de Gestao Financeira em Saude</p>
    </div>
  `,
  conta: (data) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Status de Conta Atualizado</h2>
      <p>O status de uma conta medica foi alterado:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Conta</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.account_number || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Novo Status</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.status || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Valor</td><td style="padding: 8px; border-bottom: 1px solid #eee;">R$ ${data.amount || '0,00'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Paciente</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.patient || '-'}</td></tr>
      </table>
      <a href="${data.url || '#'}" style="display: inline-block; padding: 10px 20px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 6px;">Ver Detalhes</a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">FinHealth - Sistema de Gestao Financeira em Saude</p>
    </div>
  `,
};

export async function sendNotificationEmail({ to, type, subject, data }: SendEmailParams) {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const html = templates[type](data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[FinHealth] ${subject}`,
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('[email] Failed to send:', error.message);
    return { success: false, error: error.message };
  }
}
