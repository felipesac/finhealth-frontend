'use client';

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ApiRequestOptions extends RequestInit {
  showRateLimitToast?: boolean;
}

export function useApiRequest() {
  const { toast } = useToast();

  const request = useCallback(async (url: string, options: ApiRequestOptions = {}) => {
    const { showRateLimitToast = true, ...fetchOptions } = options;

    const res = await fetch(url, fetchOptions);

    if (res.status === 429 && showRateLimitToast) {
      toast({
        title: 'Muitas requisicoes',
        description: 'Aguarde alguns segundos antes de tentar novamente.',
        variant: 'destructive',
      });
    }

    return res;
  }, [toast]);

  return { request };
}
