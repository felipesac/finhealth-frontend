import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env', () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it('requireEnv throws on missing required var', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { env } = await import('@/lib/env');
    expect(() => env.NEXT_PUBLIC_SUPABASE_URL).toThrow('Missing required environment variable');
  });

  it('optionalEnv returns undefined when not set', async () => {
    delete process.env.N8N_TISS_WEBHOOK_URL;
    const { env } = await import('@/lib/env');
    expect(env.N8N_TISS_WEBHOOK_URL).toBeUndefined();
  });

  it('NEXT_PUBLIC_APP_URL defaults to localhost', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { env } = await import('@/lib/env');
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });

  it('LOG_LEVEL defaults to info', async () => {
    delete process.env.LOG_LEVEL;
    const { env } = await import('@/lib/env');
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('validateEnvAtBoot warns on partial group config', async () => {
    process.env.RESEND_API_KEY = 'key';
    delete process.env.RESEND_FROM_EMAIL;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { validateEnvAtBoot } = await import('@/lib/env');
    validateEnvAtBoot();
    const calls = warnSpy.mock.calls.map((c) => c[0]);
    expect(calls.some((msg: string) => msg.includes('Email') && msg.includes('RESEND_FROM_EMAIL'))).toBe(true);
    warnSpy.mockRestore();
  });
});
