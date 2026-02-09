'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const shortcuts: Record<string, string> = {
  'd': '/dashboard',
  'c': '/contas',
  'g': '/glosas',
  'p': '/pagamentos',
  't': '/tiss',
  'r': '/relatorios',
  's': '/configuracoes',
};

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire if user is typing in input/textarea/select or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Alt + key for navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const route = shortcuts[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
      }

      // Escape to close any open dialog (focus back to main)
      if (e.key === 'Escape') {
        const main = document.getElementById('main-content');
        if (main) main.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
