const levels = ['debug', 'info', 'warn', 'error'] as const;
type Level = (typeof levels)[number];

function pickLevel(): Level {
  const configured = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as Level;
  if ((levels as readonly string[]).includes(configured)) return configured;
  return 'info';
}

const currentLevel = pickLevel();

function shouldLog(level: Level): boolean {
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
}

function write(level: Level, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;
  const timestamp = new Date().toISOString();
  const metaPart = meta === undefined ? '' : ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaPart}`;
  if (level === 'error') {
    process.stderr.write(`${line}\n`);
  } else {
    process.stdout.write(`${line}\n`);
  }
}

export const logger = {
  debug: (message: string, meta?: unknown): void => write('debug', message, meta),
  info: (message: string, meta?: unknown): void => write('info', message, meta),
  warn: (message: string, meta?: unknown): void => write('warn', message, meta),
  error: (message: string, meta?: unknown): void => write('error', message, meta),
};