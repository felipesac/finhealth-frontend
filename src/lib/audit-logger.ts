import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuditEntry {
  action: string;
  resource: string;
  resource_id?: string;
  organizationId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

/**
 * Log an audit event (write operation). Fire-and-forget — never blocks the response.
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
      organization_id: entry.organizationId || null,
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
 * Log a data read event for LGPD compliance.
 * Tracks who accessed PII data, when, and what filters were applied.
 * Fire-and-forget — never blocks the response.
 */
export function auditRead(
  supabase: SupabaseClient,
  userId: string,
  entry: {
    resource: string;
    organizationId?: string;
    filters?: Record<string, unknown>;
    recordCount?: number;
    ip?: string;
    containsPii?: boolean;
  }
): void {
  supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action: 'data.read',
      resource: entry.resource,
      organization_id: entry.organizationId || null,
      details: {
        type: 'read',
        filters: entry.filters || {},
        record_count: entry.recordCount,
        contains_pii: entry.containsPii ?? false,
      },
      ip: entry.ip || null,
    })
    .then(({ error }) => {
      if (error && error.code !== '42P01') {
        console.error('[audit] Failed to log read:', error.message);
      }
    });
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
