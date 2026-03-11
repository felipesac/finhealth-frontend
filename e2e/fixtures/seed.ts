import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client for seeding test data.
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn('[seed] Missing SUPABASE_SERVICE_ROLE_KEY — seed helpers unavailable');
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Seed sample medical accounts for testing.
 * Returns the created account IDs for cleanup.
 */
export async function seedAccounts(client: SupabaseClient, count = 5): Promise<string[]> {
  const statuses = ['pending', 'validated', 'sent', 'paid', 'glosa'];
  const accounts = Array.from({ length: count }, (_, i) => ({
    account_number: `E2E-TEST-${Date.now()}-${i}`,
    account_type: 'ambulatorial',
    status: statuses[i % statuses.length],
    total_amount: (i + 1) * 1000,
    approved_amount: (i + 1) * 800,
    glosa_amount: (i + 1) * 200,
    admission_date: new Date().toISOString().split('T')[0],
  }));

  const { data, error } = await client
    .from('medical_accounts')
    .insert(accounts)
    .select('id');

  if (error) throw new Error(`[seed] Failed to seed accounts: ${error.message}`);
  return (data ?? []).map((row) => row.id);
}

/**
 * Seed sample glosas for testing.
 * Requires at least one account ID.
 */
export async function seedGlosas(
  client: SupabaseClient,
  accountId: string,
  count = 3,
): Promise<string[]> {
  const statuses = ['pending', 'in_progress', 'accepted'];
  const glosas = Array.from({ length: count }, (_, i) => ({
    medical_account_id: accountId,
    glosa_code: `E2E-G${i}`,
    glosa_description: `E2E test glosa ${i}`,
    glosa_type: 'administrativa',
    glosa_amount: (i + 1) * 500,
    original_amount: (i + 1) * 1000,
    appeal_status: statuses[i % statuses.length],
  }));

  const { data, error } = await client
    .from('glosas')
    .insert(glosas)
    .select('id');

  if (error) throw new Error(`[seed] Failed to seed glosas: ${error.message}`);
  return (data ?? []).map((row) => row.id);
}

/**
 * Cleanup test data by IDs.
 */
export async function cleanup(
  client: SupabaseClient,
  table: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await client.from(table).delete().in('id', ids);
  if (error) console.warn(`[seed] Cleanup failed for ${table}:`, error.message);
}
