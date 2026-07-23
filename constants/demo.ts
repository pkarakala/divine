/**
 * Demo/reviewer account access.
 *
 * Credentials come from env vars — never hardcode them (audit H-4: real
 * account credentials were previously committed here and shipped in the
 * bundle). If the vars are unset, demo login is unavailable and the login
 * screen hides the "Try Demo Account" button.
 *
 * Set in .env (gitignored):
 *   EXPO_PUBLIC_DEMO_EMAIL=...
 *   EXPO_PUBLIC_DEMO_PASSWORD=...
 */
export const DEMO_CREDENTIALS = {
  email: process.env.EXPO_PUBLIC_DEMO_EMAIL || '',
  password: process.env.EXPO_PUBLIC_DEMO_PASSWORD || '',
} as const;

export const DEMO_AVAILABLE = !!(DEMO_CREDENTIALS.email && DEMO_CREDENTIALS.password);
