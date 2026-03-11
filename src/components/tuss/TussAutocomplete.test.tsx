import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TussAutocomplete } from './TussAutocomplete';

describe('TussAutocomplete', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnSelect.mockReset();
  });

  it('renders search input with placeholder', () => {
    render(<TussAutocomplete onSelect={mockOnSelect} />);
    expect(screen.getByPlaceholderText('Buscar procedimento por codigo ou nome...')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<TussAutocomplete onSelect={mockOnSelect} placeholder="Custom search" />);
    expect(screen.getByPlaceholderText('Custom search')).toBeInTheDocument();
  });

  it('shows clear button when text is entered', () => {
    render(<TussAutocomplete onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText('Buscar procedimento por codigo ou nome...');
    fireEvent.change(input, { target: { value: 'consulta' } });
    // Clear button should appear
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('fetches results after typing 2+ characters', async () => {
    const mockProcedures = [
      {
        id: '1',
        code: '10101012',
        description: 'Consulta em consultorio',
        unit_price: 50,
        procedure_type: 'consulta',
        group_name: 'Consultas',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: mockProcedures }),
    });

    render(<TussAutocomplete onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText('Buscar procedimento por codigo ou nome...');
    fireEvent.change(input, { target: { value: 'con' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tuss?search=con&limit=10');
    });

    await waitFor(() => {
      expect(screen.getByText('10101012')).toBeInTheDocument();
      expect(screen.getByText('Consulta em consultorio')).toBeInTheDocument();
    });
  });

  it('calls onSelect when a result is clicked', async () => {
    const mockProcedure = {
      id: '1',
      code: '10101012',
      description: 'Consulta em consultorio',
      unit_price: 50,
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: [mockProcedure] }),
    });

    render(<TussAutocomplete onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText('Buscar procedimento por codigo ou nome...');
    fireEvent.change(input, { target: { value: 'con' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('10101012')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Consulta em consultorio'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockProcedure);
  });

  it('shows empty message for no results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    render(<TussAutocomplete onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText('Buscar procedimento por codigo ou nome...');
    fireEvent.change(input, { target: { value: 'xyz' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Nenhum procedimento encontrado')).toBeInTheDocument();
    });
  });

  it('clears results on clear button click', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: [{ id: '1', code: '123', description: 'Test', unit_price: 10 }] }),
    });

    render(<TussAutocomplete onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText('Buscar procedimento por codigo ou nome...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    // Click clear button
    const clearBtn = screen.getAllByRole('button').find(
      btn => btn.querySelector('.lucide-x')
    );
    if (clearBtn) {
      fireEvent.click(clearBtn);
      expect(input).toHaveValue('');
    }
  });
});
