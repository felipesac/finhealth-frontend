import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire squad-client module at a high level for route tests,
// but for this test we import it directly to test config and HTTP path.
// Process spawn path is tested by aios-core/tests/integration/squad-runtime-bridge.test.js

// We can't mock child_process in jsdom environment, so we mock the module
// to avoid the import error and test what we can.
const { mockSpawn } = vi.hoisted(() => ({
  mockSpawn: vi.fn(() => {
    throw new Error('child_process.spawn not available in jsdom');
  }),
}));

vi.mock('child_process', () => {
  const mod = { spawn: mockSpawn };
  return { ...mod, default: mod };
});

import { SquadClient, createSquadClient } from './squad-client';

describe('SquadClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor and config', () => {
    it('should create client with factory function', () => {
      const client = createSquadClient();
      expect(client).toBeInstanceOf(SquadClient);
    });

    it('should accept custom config', () => {
      const client = new SquadClient({
        squadPath: '/custom/path',
        mode: 'http',
        httpBaseUrl: 'http://localhost:3001',
        timeout: 5000,
      });
      expect(client).toBeInstanceOf(SquadClient);
    });

    it('should default to process mode', () => {
      const client = createSquadClient();
      expect(client).toBeInstanceOf(SquadClient);
    });
  });

  describe('HTTP mode', () => {
    it('should return error when httpBaseUrl is not configured', async () => {
      const client = createSquadClient({ mode: 'http', httpBaseUrl: undefined });
      const result = await client.execute({
        agentId: 'billing-agent',
        taskName: 'validate-tiss',
        parameters: {},
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('SQUAD_HTTP_URL not configured'));
    });

    it('should handle HTTP fetch errors', async () => {
      // Mock fetch to fail
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const client = createSquadClient({
        mode: 'http',
        httpBaseUrl: 'http://localhost:9999',
      });
      const result = await client.execute({
        agentId: 'billing-agent',
        taskName: 'validate-tiss',
        parameters: { guia: {} },
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Connection refused'));

      globalThis.fetch = originalFetch;
    });

    it('should call correct HTTP endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, output: { valida: true } }),
      });
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch;

      const client = createSquadClient({
        mode: 'http',
        httpBaseUrl: 'http://localhost:3001',
      });
      const result = await client.execute({
        agentId: 'billing-agent',
        taskName: 'validate-tiss',
        parameters: { guia: {} },
      });

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ valida: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/execute',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      // Verify payload
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.agentId).toBe('billing-agent');
      expect(body.taskName).toBe('validate-tiss');
      expect(body.parameters).toEqual({ guia: {} });

      globalThis.fetch = originalFetch;
    });
  });

  describe('request format', () => {
    it('should accept all request fields', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, output: {} }),
      });
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch;

      const client = createSquadClient({ mode: 'http', httpBaseUrl: 'http://localhost:3001' });
      await client.execute({
        agentId: 'auditor-agent',
        taskName: 'audit-account',
        parameters: { conta: { id: '123' } },
        context: { orchestration: true },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.agentId).toBe('auditor-agent');
      expect(body.taskName).toBe('audit-account');
      expect(body.parameters.conta.id).toBe('123');
      expect(body.context.orchestration).toBe(true);

      globalThis.fetch = originalFetch;
    });
  });
});
