import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppealForm } from './AppealForm';

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('AppealForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRefresh.mockReset();
  });

  it('renders form title and description', () => {
    render(<AppealForm glosaId="g1" initialText="" appealStatus="pending" />);
    expect(screen.getByText('Texto do Recurso')).toBeInTheDocument();
    expect(screen.getByText('Edite o texto do recurso antes de enviar')).toBeInTheDocument();
  });

  it('renders textarea with initial text', () => {
    render(<AppealForm glosaId="g1" initialText="texto inicial" appealStatus="pending" />);
    const textarea = screen.getByPlaceholderText('Digite a fundamentacao do recurso...');
    expect(textarea).toHaveValue('texto inicial');
  });

  it('renders save draft and submit buttons when not sent', () => {
    render(<AppealForm glosaId="g1" initialText="" appealStatus="pending" />);
    expect(screen.getByText('Salvar Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Enviar Recurso')).toBeInTheDocument();
  });

  it('disables textarea and hides buttons when appeal is sent', () => {
    render(<AppealForm glosaId="g1" initialText="texto" appealStatus="sent" />);
    const textarea = screen.getByPlaceholderText('Digite a fundamentacao do recurso...');
    expect(textarea).toBeDisabled();
    expect(screen.queryByText('Salvar Rascunho')).not.toBeInTheDocument();
    expect(screen.queryByText('Enviar Recurso')).not.toBeInTheDocument();
    expect(screen.getByText('Recurso ja enviado')).toBeInTheDocument();
  });

  it('disables textarea when appeal is accepted', () => {
    render(<AppealForm glosaId="g1" initialText="texto" appealStatus="accepted" />);
    const textarea = screen.getByPlaceholderText('Digite a fundamentacao do recurso...');
    expect(textarea).toBeDisabled();
  });

  it('saves draft on button click', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    render(<AppealForm glosaId="g1" initialText="" appealStatus="pending" />);

    const textarea = screen.getByPlaceholderText('Digite a fundamentacao do recurso...');
    fireEvent.change(textarea, { target: { value: 'Fundamentacao do recurso' } });

    fireEvent.click(screen.getByText('Salvar Rascunho'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/appeals', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ glosaId: 'g1', text: 'Fundamentacao do recurso', action: 'save_draft' }),
      }));
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Rascunho salvo com sucesso' }));
    });
  });

  it('shows error when saving empty draft', async () => {
    const { toast } = await import('@/hooks/use-toast');

    render(<AppealForm glosaId="g1" initialText="" appealStatus="pending" />);
    fireEvent.click(screen.getByText('Salvar Rascunho'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Digite o texto do recurso', variant: 'destructive' })
      );
    });
  });

  it('shows confirmation dialog on submit click', () => {
    render(<AppealForm glosaId="g1" initialText="texto" appealStatus="pending" />);
    fireEvent.click(screen.getByText('Enviar Recurso'));
    expect(screen.getByText('Confirmar envio do recurso')).toBeInTheDocument();
  });
});
