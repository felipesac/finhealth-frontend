'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const shortcutsList = [
  { keys: ['Alt', 'D'], description: 'Dashboard' },
  { keys: ['Alt', 'C'], description: 'Contas Medicas' },
  { keys: ['Alt', 'G'], description: 'Glosas' },
  { keys: ['Alt', 'P'], description: 'Pagamentos' },
  { keys: ['Alt', 'T'], description: 'TISS' },
  { keys: ['Alt', 'R'], description: 'Relatorios' },
  { keys: ['Alt', 'S'], description: 'Configuracoes' },
  { keys: ['Esc'], description: 'Fechar dialogos' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <>
      {/* Help button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-20 right-4 md:bottom-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Atalhos de teclado"
        aria-expanded={open}
      >
        <span className="text-lg font-bold">?</span>
      </button>

      {/* Shortcuts overlay */}
      {open && (
        <Card
          ref={cardRef}
          className="fixed bottom-32 right-4 md:bottom-16 z-50 w-72 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Atalhos de Teclado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {shortcutsList.map((shortcut) => (
                <li
                  key={shortcut.description}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <span className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-muted-foreground text-xs">+</span>
                        )}
                        <Kbd>{key}</Kbd>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
