import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PatientManagement } from './PatientManagement';

const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: mockToast,
}));

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (val: string) => val,
}));

describe('PatientManagement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [], pagination: { totalPages: 0 } }),
    });
  });

  it('renders Novo Paciente button', () => {
    render(<PatientManagement />);
    expect(screen.getByText('Novo Paciente')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<PatientManagement />);
    expect(screen.getByPlaceholderText('Buscar por nome ou CPF...')).toBeInTheDocument();
  });

  it('shows empty state after loading', async () => {
    render(<PatientManagement />);
    await waitFor(() => {
      expect(screen.getByText('Nenhum paciente encontrado')).toBeInTheDocument();
    });
  });
});
