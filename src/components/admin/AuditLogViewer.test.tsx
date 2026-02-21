import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuditLogViewer } from './AuditLogViewer';

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

describe('AuditLogViewer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [], pagination: { totalPages: 0 } }),
    });
  });

  it('renders title "Logs de Auditoria"', () => {
    render(<AuditLogViewer />);
    expect(screen.getByText('Logs de Auditoria')).toBeInTheDocument();
  });

  it('renders search input with placeholder "Filtrar por acao..."', () => {
    render(<AuditLogViewer />);
    expect(screen.getByPlaceholderText('Filtrar por acao...')).toBeInTheDocument();
  });

  it('shows empty state after loading', async () => {
    render(<AuditLogViewer />);
    await waitFor(() => {
      expect(screen.getByText('Nenhum log encontrado')).toBeInTheDocument();
    });
  });
});
