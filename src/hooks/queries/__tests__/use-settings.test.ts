import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useTissSettings,
  useNotificationPreferences,
  useUpdateTissSettings,
  useUpdateNotificationPreferences,
} from '../use-settings';
import React from 'react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'QueryWrapper';
  return { Wrapper, queryClient };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useTissSettings', () => {
  it('fetches TISS settings', async () => {
    const settings = { tiss_version: '3.05.00', cnes: '1234567' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: settings }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTissSettings(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(settings);
  });

  it('returns defaults when data is null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTissSettings(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ tiss_version: '3.05.00', cnes: '' });
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTissSettings(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useNotificationPreferences', () => {
  it('fetches notification preferences', async () => {
    const prefs = { email_glosas: true, email_pagamentos: false, email_contas: true, push_enabled: true };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: prefs }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(prefs);
  });

  it('returns defaults when data is null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      email_glosas: true, email_pagamentos: true, email_contas: false, push_enabled: false,
    });
  });
});

describe('useUpdateTissSettings', () => {
  it('sends PUT and invalidates tiss settings', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTissSettings(), { wrapper: Wrapper });
    await result.current.mutateAsync({ tiss_version: '4.00.00', cnes: '9999999' });

    expect(fetch).toHaveBeenCalledWith('/api/settings/tiss', expect.objectContaining({ method: 'PUT' }));
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTissSettings(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({ tiss_version: '3.05.00', cnes: '' })
    ).rejects.toThrow('Erro ao salvar');
  });
});

describe('useUpdateNotificationPreferences', () => {
  it('sends PUT and sets query data directly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const newPrefs = { email_glosas: false, email_pagamentos: true, email_contas: true, push_enabled: true };
    const { Wrapper, queryClient } = createWrapper();
    const setDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper: Wrapper });
    await result.current.mutateAsync(newPrefs);

    expect(fetch).toHaveBeenCalledWith('/api/notifications/preferences', expect.objectContaining({ method: 'PUT' }));
    expect(setDataSpy).toHaveBeenCalled();
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({ email_glosas: true, email_pagamentos: true, email_contas: false, push_enabled: false })
    ).rejects.toThrow('Erro ao salvar');
  });
});
