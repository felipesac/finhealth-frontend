type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level: LogLevel): boolean {
  const minLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
  return LOG_LEVELS[level] >= (LOG_LEVELS[minLevel] ?? 1);
}

function emit(entry: LogEntry): void {
  const output = JSON.stringify(entry);
  if (entry.level === 'error') console.error(output);
  else if (entry.level === 'warn') console.warn(output);
  else console.log(output);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('debug')) emit({ level: 'debug', message, timestamp: new Date().toISOString(), ...meta });
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('info')) emit({ level: 'info', message, timestamp: new Date().toISOString(), ...meta });
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('warn')) emit({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta });
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    if (shouldLog('error')) {
      const errorInfo = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error != null ? { message: String(error) } : undefined;
      emit({ level: 'error', message, timestamp: new Date().toISOString(), error: errorInfo, ...meta });
    }
  },
};

export function createRequestLogger(requestId: string, route: string) {
  return {
    info: (msg: string, meta?: Record<string, unknown>) => logger.info(msg, { requestId, route, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(msg, { requestId, route, ...meta }),
    error: (msg: string, err?: unknown, meta?: Record<string, unknown>) => logger.error(msg, err, { requestId, route, ...meta }),
  };
}
