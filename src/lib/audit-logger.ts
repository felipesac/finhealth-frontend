import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuditEntry {
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

/**
 * Log an audit event. Fire-and-forget — never blocks the response.
 */
export function auditLog(
  supabase: SupabaseClient,
  userId: string,
  entry: AuditEntry
): void {
  supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      details: entry.details || {},
      ip: entry.ip || null,
    })
    .then(({ error }) => {
      if (error && error.code !== '42P01') {
        // 42P01 = table does not exist — ignore in dev
        console.error('[audit] Failed to log:', error.message);
      }
    });
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
