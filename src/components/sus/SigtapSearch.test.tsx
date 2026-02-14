import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SigtapSearch } from './SigtapSearch';

describe('SigtapSearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders search card title', () => {
    render(<SigtapSearch />);
    expect(screen.getByText('Busca SIGTAP')).toBeInTheDocument();
  });

  it('renders search input and button', () => {
    render(<SigtapSearch />);
    expect(screen.getByPlaceholderText('Buscar por codigo ou nome do procedimento...')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('disables search button when input is empty', () => {
    render(<SigtapSearch />);
    const button = screen.getAllByRole('button')[0];
    expect(button).toBeDisabled();
  });

  it('enables search button when input has text', () => {
    render(<SigtapSearch />);
    const input = screen.getByPlaceholderText('Buscar por codigo ou nome do procedimento...');
    fireEvent.change(input, { target: { value: 'consulta' } });
    const button = screen.getAllByRole('button')[0];
    expect(button).not.toBeDisabled();
  });

  it('fetches results on search click', async () => {
    const mockResults = [
      {
        id: '1',
        codigo_sigtap: '0301010072',
        nome: 'Consulta medica',
        competencia: '2024-01',
        valor_ambulatorial: 10,
        valor_hospitalar: 0,
        tipo: 'consulta',
        grupo: 'Atencao basica',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, procedures: mockResults }),
    });

    render(<SigtapSearch />);
    const input = screen.getByPlaceholderText('Buscar por codigo ou nome do procedimento...');
    fireEvent.change(input, { target: { value: 'consulta' } });
    fireEvent.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sus/sigtap?q=consulta');
    });

    await waitFor(() => {
      expect(screen.getByText('0301010072')).toBeInTheDocument();
      expect(screen.getByText('Consulta medica')).toBeInTheDocument();
      expect(screen.getByText('1 procedimento encontrado')).toBeInTheDocument();
    });
  });

  it('shows empty state when no results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, procedures: [] }),
    });

    render(<SigtapSearch />);
    const input = screen.getByPlaceholderText('Buscar por codigo ou nome do procedimento...');
    fireEvent.change(input, { target: { value: 'xyz' } });
    fireEvent.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum procedimento encontrado/)).toBeInTheDocument();
    });
  });

  it('searches on Enter key press', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, procedures: [] }),
    });

    render(<SigtapSearch />);
    const input = screen.getByPlaceholderText('Buscar por codigo ou nome do procedimento...');
    fireEvent.change(input, { target: { value: 'consulta' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
