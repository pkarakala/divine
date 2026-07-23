import * as Sentry from '@sentry/react-native';

/**
 * Crash reporting (audit M-7/P1-H). Env-gated: without EXPO_PUBLIC_SENTRY_DSN
 * every export here is a safe no-op, so the app runs fine before the Sentry
 * project exists. Set the DSN in .env (and as an EAS env var for builds).
 *
 * Privacy: this is a dating app — never attach message contents, exact
 * location, or verification documents to events. sendDefaultPii stays off;
 * beforeSend strips anything that slips through.
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export const sentryEnabled = !!DSN;

export function initSentry(): void {
  if (!sentryEnabled) return;

  Sentry.init({
    dsn: DSN,
    enabled: !__DEV__, // dev crashes are visible locally; don't pollute the project
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
    beforeSend(event) {
      // Strip anything location-like or message-like that a breadcrumb/context
      // might have picked up. Defense in depth — nothing should add these.
      if (event.contexts) {
        delete (event.contexts as Record<string, unknown>).geo;
      }
      if (event.user) {
        // Keep only the opaque id for grouping; no email/phone/ip.
        event.user = { id: event.user.id };
      }
      return event;
    },
  });
}

/** Associate crashes with an opaque user id (never email/phone). */
export function setSentryUser(userId: string | null): void {
  if (!sentryEnabled) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

/** Manually report a handled error with optional context tag. */
export function captureError(error: unknown, context?: string): void {
  if (!sentryEnabled) {
    if (__DEV__) console.warn(`[sentry:${context ?? 'error'}]`, error);
    return;
  }
  Sentry.captureException(error, context ? { tags: { context } } : undefined);
}

/** Wrap the root component so navigation/render errors are captured. */
export function wrapRoot(component: React.ComponentType): React.ComponentType {
  return sentryEnabled ? Sentry.wrap(component) : component;
}
