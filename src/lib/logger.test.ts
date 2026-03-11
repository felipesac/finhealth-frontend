import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createRequestLogger } from '@/lib/logger';

describe('logger', () => {
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalLogLevel !== undefined) {
      process.env.LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  it('outputs JSON-structured log entries', () => {
    logger.info('test message', { key: 'value' });
    expect(console.log).toHaveBeenCalledOnce();
    const output = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe('info');
    expect(output.message).toBe('test message');
    expect(output.key).toBe('value');
    expect(output.timestamp).toBeDefined();
  });

  it('routes error level to console.error', () => {
    logger.error('fail', new Error('oops'));
    expect(console.error).toHaveBeenCalledOnce();
    const output = JSON.parse((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe('error');
    expect(output.error.message).toBe('oops');
    expect(output.error.stack).toBeDefined();
  });

  it('routes warn level to console.warn', () => {
    logger.warn('warning');
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('filters debug messages when LOG_LEVEL is info', () => {
    process.env.LOG_LEVEL = 'info';
    logger.debug('should not appear');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('shows debug messages when LOG_LEVEL is debug', () => {
    process.env.LOG_LEVEL = 'debug';
    logger.debug('should appear');
    expect(console.log).toHaveBeenCalledOnce();
  });

  it('createRequestLogger adds requestId and route to entries', () => {
    const reqLogger = createRequestLogger('req-123', '/api/test');
    reqLogger.info('request started', { extra: true });
    const output = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.requestId).toBe('req-123');
    expect(output.route).toBe('/api/test');
    expect(output.extra).toBe(true);
  });
});
