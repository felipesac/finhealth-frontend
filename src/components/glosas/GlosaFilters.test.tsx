import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlosaFilters } from './GlosaFilters';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/glosas',
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (val: string) => val,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams = new URLSearchParams();
});

describe('GlosaFilters', () => {
  it('renders search input and type filter', () => {
    render(<GlosaFilters />);

    expect(screen.getByPlaceholderText('Buscar por codigo ou conta...')).toBeInTheDocument();
    expect(screen.getByText('Todos os Tipos')).toBeInTheDocument();
  });

  it('does not show reset button when no filters active', () => {
    const { container } = render(<GlosaFilters />);

    // No ghost button (reset) should be present
    const ghostButtons = container.querySelectorAll('button[data-variant="ghost"]');
    expect(ghostButtons).toHaveLength(0);
  });

  it('updates search input value', async () => {
    const user = userEvent.setup();
    render(<GlosaFilters />);

    const input = screen.getByPlaceholderText('Buscar por codigo ou conta...');
    await user.type(input, 'GA001');

    expect(input).toHaveValue('GA001');
  });

  it('navigates with type filter selection', async () => {
    const user = userEvent.setup();
    render(<GlosaFilters />);

    // Click the select trigger to open
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Click an option
    const option = screen.getByRole('option', { name: 'Administrativa' });
    await user.click(option);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('glosaType=administrativa')
    );
  });

  it('shows reset button when search filter is active', () => {
    mockSearchParams = new URLSearchParams('search=test');
    render(<GlosaFilters />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('resets filters to base path', async () => {
    mockSearchParams = new URLSearchParams('search=test');
    const user = userEvent.setup();
    render(<GlosaFilters />);

    const buttons = screen.getAllByRole('button');
    const resetButton = buttons[buttons.length - 1];
    await user.click(resetButton);

    expect(mockPush).toHaveBeenCalledWith('/glosas');
  });
});
