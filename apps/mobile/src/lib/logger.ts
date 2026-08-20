// Lightweight logger for React Native
// Wraps console with structured output; silenced in production

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (isDev) console.log(`[MediLoop DEBUG] ${msg}`, ...args);
  },
  info: (msg: string, ...args: unknown[]) => {
    if (isDev) console.log(`[MediLoop INFO]  ${msg}`, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(`[MediLoop WARN]  ${msg}`, ...args);
  },
  error: (msg: string, err?: unknown) => {
    console.error(`[MediLoop ERROR] ${msg}`, err ?? '');
  },
};
