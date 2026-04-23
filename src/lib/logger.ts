// Dev-only logger. In production (import.meta.env.PROD) these calls are
// no-ops, keeping debug details out of the browser console where they
// could leak record ids, error shapes, or auth-related traces to users.
const isDev = import.meta.env.DEV;

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
};
