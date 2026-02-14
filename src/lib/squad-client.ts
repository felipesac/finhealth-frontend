import { spawn } from 'child_process';
import path from 'path';

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
  };
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

  constructor(config?: Partial<SquadClientConfig>) {
    const defaults = resolveDefaults();
    this.config = { ...defaults, ...config };
  }

  async execute(request: SquadRequest, timeout?: number): Promise<SquadResponse> {
    const effectiveTimeout = timeout || this.config.timeout;

    if (this.config.mode === 'http') {
      return executeViaHttp(this.config, request, effectiveTimeout);
    }
    return executeViaProcess(this.config, request, effectiveTimeout);
  }
}

export function createSquadClient(config?: Partial<SquadClientConfig>): SquadClient {
  return new SquadClient(config);
}
