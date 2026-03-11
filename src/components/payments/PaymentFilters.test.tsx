import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentFilters } from './PaymentFilters';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/pagamentos',
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (val: string) => val,
}));

const mockInsurers = [
  { id: 'ins-1', name: 'Unimed', ans_code: '123' },
  { id: 'ins-2', name: 'Amil', ans_code: '456' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams = new URLSearchParams();
});

describe('PaymentFilters', () => {
  it('renders search input and filter dropdowns', () => {
    render(<PaymentFilters insurers={mockInsurers} />);

    expect(screen.getByPlaceholderText('Buscar por referencia...')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
  });

  it('renders insurer options from props when opened', async () => {
    const user = userEvent.setup();
    render(<PaymentFilters insurers={mockInsurers} />);

    // Click the insurer trigger (second combobox)
    const triggers = screen.getAllByRole('combobox');
    await user.click(triggers[1]);

    expect(screen.getByRole('option', { name: 'Unimed' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Amil' })).toBeInTheDocument();
  });

  it('has two select triggers when no filters active', () => {
    render(<PaymentFilters insurers={[]} />);

    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);
  });

  it('navigates with status filter selection', async () => {
    const user = userEvent.setup();
    render(<PaymentFilters insurers={mockInsurers} />);

    // Click the status trigger (first combobox)
    const triggers = screen.getAllByRole('combobox');
    await user.click(triggers[0]);

    await user.click(screen.getByRole('option', { name: 'Pendente' }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('status=pending')
    );
  });

  it('navigates with insurer filter selection', async () => {
    const user = userEvent.setup();
    render(<PaymentFilters insurers={mockInsurers} />);

    // Click the insurer trigger (second combobox)
    const triggers = screen.getAllByRole('combobox');
    await user.click(triggers[1]);

    await user.click(screen.getByRole('option', { name: 'Unimed' }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('insurerId=ins-1')
    );
  });

  it('shows reset button and resets when clicked', async () => {
    mockSearchParams = new URLSearchParams('status=pending');
    const user = userEvent.setup();
    render(<PaymentFilters insurers={mockInsurers} />);

    const buttons = screen.getAllByRole('button');
    const resetButton = buttons[buttons.length - 1];
    await user.click(resetButton);

    expect(mockPush).toHaveBeenCalledWith('/pagamentos');
  });
});
