// =====================================================================
// Sentry initialization.
//
// Lazy / opt-in: if VITE_SENTRY_DSN is not set the SDK is never imported,
// so dev builds and unconfigured deploys pay zero bundle cost.
//
// Usage (called once from src/main.tsx, before <App /> renders):
//   import { initSentry } from "@/lib/sentry";
//   initSentry();
// =====================================================================

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const ENVIRONMENT =
  (import.meta.env.VITE_SENTRY_ENV as string | undefined) ??
  import.meta.env.MODE ??
  "development";
const RELEASE = import.meta.env.VITE_SENTRY_RELEASE as string | undefined;

let initialized = false;

export async function initSentry(): Promise<void> {
  if (initialized) return;
  if (!SENTRY_DSN) return;

  // Dynamic import keeps the SDK out of the main chunk when DSN is unset.
  const Sentry = await import("@sentry/react");

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    // Performance: 10% of transactions in prod, all in dev.
    tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,
    // Privacy: never capture PII automatically. Forms, inputs, cookies stay private.
    sendDefaultPii: false,
    // Filter out noise: extension errors, ResizeObserver warnings, etc.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications.",
      "Non-Error promise rejection captured",
      // Network failures are reported by Supabase / TanStack Query already.
      "Failed to fetch",
      "NetworkError when attempting to fetch resource.",
    ],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text + media to avoid leaking private data into replays.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Session replay: only on errors in prod (cheap), 10% of sessions in dev.
    replaysSessionSampleRate: ENVIRONMENT === "production" ? 0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  initialized = true;
}

/**
 * Manual capture for caught errors that the user has already been told about
 * but we still want to track. Safe to call when Sentry is not initialized.
 */
export async function reportError(
  err: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  if (!SENTRY_DSN) return;
  const Sentry = await import("@sentry/react");
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
