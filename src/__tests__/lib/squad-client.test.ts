// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return { ...actual, spawn: vi.fn() };
});

import { SquadClient } from '@/lib/squad-client';
import type { SquadResponse } from '@/lib/squad-client';
import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

function createMockChild(response: SquadResponse | null, options?: { error?: Error }): ChildProcess {
  const child = new EventEmitter() as unknown as ChildProcess & EventEmitter;
  Object.assign(child, {
    stdin: { write: vi.fn(), end: vi.fn() },
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn(),
  });

  // Simulate async response
  setTimeout(() => {
    if (options?.error) {
      child.emit('error', options.error);
    } else if (response) {
      (child.stdout as EventEmitter).emit('data', Buffer.from(JSON.stringify(response) + '\n'));
      child.emit('close', 0);
    }
  }, 0);

  return child;
}

describe('SquadClient', () => {
  const sleepFn = vi.fn().mockResolvedValue(undefined);
  const request = { agentId: 'test-agent', taskName: 'test-task', parameters: {} };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createClient(overrides?: Record<string, unknown>) {
    return new SquadClient({
      squadPath: '/fake/path',
      mode: 'process',
      maxRetries: 2,
      retryBaseDelayMs: 100,
      sleepFn,
      ...overrides,
    });
  }

  it('returns success on first attempt without retrying', async () => {
    const successResponse: SquadResponse = { success: true, output: { data: 'ok' } };
    vi.mocked(spawn).mockImplementation(() => createMockChild(successResponse) as ChildProcess);

    const client = createClient();
    const result = await client.execute(request);

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ data: 'ok' });
    expect(sleepFn).not.toHaveBeenCalled();
  });

  it('does NOT retry permanent errors (parse error)', async () => {
    const parseErrorResponse: SquadResponse = {
      success: false,
      output: null,
      errors: ['Failed to parse squad output as JSON: Unexpected token'],
      metadata: { parseError: true },
    };
    vi.mocked(spawn).mockImplementation(() => createMockChild(parseErrorResponse) as ChildProcess);

    const client = createClient();
    const result = await client.execute(request);

    expect(result.success).toBe(false);
    expect(sleepFn).not.toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('retries transient errors up to maxRetries', async () => {
    const timeoutResponse: SquadResponse = {
      success: false,
      output: null,
      errors: ['Squad task timed out after 60000ms'],
      metadata: { timeout: true },
    };
    vi.mocked(spawn).mockImplementation(() => createMockChild(timeoutResponse) as ChildProcess);

    const client = createClient({ timeout: 30_000 });
    const result = await client.execute(request);

    expect(result.success).toBe(false);
    expect(spawn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    expect(sleepFn).toHaveBeenCalledTimes(2);
  });

  it('returns success when retry succeeds', async () => {
    const spawnError: SquadResponse = {
      success: false,
      output: null,
      errors: ['Failed to spawn squad process: ENOENT'],
      metadata: { spawnError: true },
    };
    const successResponse: SquadResponse = { success: true, output: { recovered: true } };

    let callCount = 0;
    vi.mocked(spawn).mockImplementation(() => {
      callCount++;
      return createMockChild(callCount === 1 ? spawnError : successResponse) as ChildProcess;
    });

    const client = createClient();
    const result = await client.execute(request);

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ recovered: true });
    expect(sleepFn).toHaveBeenCalledTimes(1);
  });

  it('applies exponential backoff delays', async () => {
    const transientError: SquadResponse = {
      success: false,
      output: null,
      errors: ['Squad task timed out after 60000ms'],
      metadata: { timeout: true },
    };
    vi.mocked(spawn).mockImplementation(() => createMockChild(transientError) as ChildProcess);

    const client = createClient({ retryBaseDelayMs: 1000, timeout: 30_000 });
    await client.execute(request);

    expect(sleepFn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenNthCalledWith(1, 1000); // 1000 * 2^0
    expect(sleepFn).toHaveBeenNthCalledWith(2, 2000); // 1000 * 2^1
  });

  it('does not retry when maxRetries is 0', async () => {
    const timeoutResponse: SquadResponse = {
      success: false,
      output: null,
      errors: ['Squad task timed out after 60000ms'],
      metadata: { timeout: true },
    };
    vi.mocked(spawn).mockImplementation(() => createMockChild(timeoutResponse) as ChildProcess);

    const client = createClient({ maxRetries: 0 });
    const result = await client.execute(request);

    expect(result.success).toBe(false);
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(sleepFn).not.toHaveBeenCalled();
  });
});
