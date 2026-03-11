import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import messages from '../../messages/pt-BR.json';

// Polyfill methods missing in jsdom (needed by Radix UI)
// Guard for tests running in node environment (e.g. squad-client)
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
}
if (typeof window !== 'undefined' && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Resolve a nested key like "statusLabels.pending" from a messages object
function resolve(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  return typeof cur === 'string' ? cur : key;
}

function createT(namespace?: string) {
  const ns = namespace
    ? (messages as Record<string, unknown>)[namespace] as Record<string, unknown> | undefined
    : undefined;

  const t = (key: string, params?: Record<string, unknown>) => {
    let value = ns ? resolve(ns, key) : key;
    if (params) {
      value = Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, String(v)),
        value,
      );
    }
    return value;
  };
  t.has = (key: string) => {
    if (!ns) return false;
    return resolve(ns, key) !== key;
  };
  t.raw = (key: string) => (ns ? resolve(ns, key) : key);
  return t;
}

// Global mock for next-intl — returns actual pt-BR translations
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => createT(namespace),
  useLocale: () => 'pt-BR',
  useMessages: () => messages,
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) => createT(namespace),
  getLocale: async () => 'pt-BR',
  getMessages: async () => messages,
}));
