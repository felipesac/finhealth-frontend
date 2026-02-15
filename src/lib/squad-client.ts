import { spawn } from 'child_process';
import path from 'path';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface SquadRequest {
  agentId: string;
  taskName: string;
  parameters: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface SquadResponse {
  success: boolean;
  output: unknown;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

interface SquadClientConfig {
  squadPath: string;
  mode: 'process' | 'http';
  httpBaseUrl?: string;
  timeout: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  /** Injectable sleep for testability */
  sleepFn?: (ms: number) => Promise<void>;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_TIMEOUT = 60_000;
const ENTRY_POINT = 'src/entry.ts';

function resolveDefaults(): SquadClientConfig {
  return {
    squadPath: process.env.SQUAD_PATH || path.resolve(process.cwd(), '..', 'aios-core', 'squads', 'finhealth-squad'),
    mode: (process.env.SQUAD_MODE as 'process' | 'http') || 'process',
    httpBaseUrl: process.env.SQUAD_HTTP_URL,
    timeout: Number(process.env.SQUAD_TIMEOUT) || DEFAULT_TIMEOUT,
    maxRetries: Number(process.env.SQUAD_MAX_RETRIES) || 2,
    retryBaseDelayMs: Number(process.env.SQUAD_RETRY_DELAY) || 1000,
  };
}

// ============================================================================
// Retry helpers
// ============================================================================

const TRANSIENT_PATTERNS = [
  'timed out', 'timeout', 'econnreset', 'econnrefused',
  'spawn', 'process exited', 'no output',
];

function isTransientError(response: SquadResponse): boolean {
  if (response.success) return false;
  if (response.metadata?.timeout) return true;
  if (response.metadata?.spawnError) return true;
  const errorText = (response.errors || []).join(' ').toLowerCase();
  return TRANSIENT_PATTERNS.some((p) => errorText.includes(p));
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Process transport
// ============================================================================

function executeViaProcess(
  config: SquadClientConfig,
  request: SquadRequest,
  timeout: number,
): Promise<SquadResponse> {
  return new Promise((resolve) => {
    const entryPoint = path.join(config.squadPath, ENTRY_POINT);
    const payload = JSON.stringify(request);

    const isWindows = process.platform === 'win32';
    const child = spawn('npx', ['tsx', entryPoint], {
      cwd: config.squadPath,
      env: {
        ...process.env,
        AIOS_SQUAD_BRIDGE: 'true',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows,
      timeout,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.stdin.write(payload);
    child.stdin.end();

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        success: false,
        output: null,
        errors: [`Squad task timed out after ${timeout}ms`],
        metadata: { timeout: true },
      });
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);

      const trimmed = stdout.trim();
      if (!trimmed) {
        resolve({
          success: false,
          output: null,
          errors: [
            `Squad process exited with code ${code} and no output`,
            stderr ? `stderr: ${stderr.substring(0, 500)}` : '',
          ].filter(Boolean),
          metadata: { exitCode: code },
        });
        return;
      }

      try {
        const lines = trimmed.split('\n');
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        resolve(result);
      } catch (parseError) {
        resolve({
          success: false,
          output: null,
          errors: [
            `Failed to parse squad output as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown'}`,
            `Raw output: ${trimmed.substring(0, 500)}`,
          ],
          metadata: { exitCode: code, parseError: true },
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        output: null,
        errors: [`Failed to spawn squad process: ${err.message}`],
        metadata: { spawnError: true },
      });
    });
  });
}

// ============================================================================
// HTTP transport (future)
// ============================================================================

async function executeViaHttp(
  config: SquadClientConfig,
  request: SquadRequest,
  timeout: number,
): Promise<SquadResponse> {
  if (!config.httpBaseUrl) {
    return {
      success: false,
      output: null,
      errors: ['SQUAD_HTTP_URL not configured'],
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${config.httpBaseUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    return {
      success: false,
      output: null,
      errors: [`HTTP request failed: ${err instanceof Error ? err.message : 'Unknown'}`],
    };
  }
}

// ============================================================================
// Public API
// ============================================================================

export class SquadClient {
  private config: SquadClientConfig;
  private sleepFn: (ms: number) => Promise<void>;

  constructor(config?: Partial<SquadClientConfig>) {
    const defaults = resolveDefaults();
    this.config = { ...defaults, ...config };
    this.sleepFn = this.config.sleepFn ?? defaultSleep;
  }

  async execute(request: SquadRequest, timeout?: number): Promise<SquadResponse> {
    const effectiveTimeout = timeout || this.config.timeout;
    const maxAttempts = this.config.maxRetries + 1;

    let lastResponse: SquadResponse | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = this.config.mode === 'http'
        ? await executeViaHttp(this.config, request, effectiveTimeout)
        : await executeViaProcess(this.config, request, effectiveTimeout);

      if (response.success || !isTransientError(response) || attempt === maxAttempts) {
        return response;
      }

      lastResponse = response;
      const delay = this.config.retryBaseDelayMs * Math.pow(2, attempt - 1);
      logger.warn(`[squad-client] Transient error, retrying (attempt ${attempt}/${this.config.maxRetries})`, {
        errors: response.errors,
        delay,
      });
      await this.sleepFn(delay);
    }

    return lastResponse!;
  }
}

export function createSquadClient(config?: Partial<SquadClientConfig>): SquadClient {
  return new SquadClient(config);
}
