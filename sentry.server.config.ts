import * as Sentry from '@sentry/nextjs';
import { SENTRY_PII_CONFIG } from './src/lib/error-tracking';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
  ...SENTRY_PII_CONFIG,
});
