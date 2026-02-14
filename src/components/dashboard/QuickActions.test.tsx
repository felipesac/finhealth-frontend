import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickActions } from './QuickActions';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FilePlus: () => <span data-testid="icon-file-plus" />,
  Upload: () => <span data-testid="icon-upload" />,
  FileSearch: () => <span data-testid="icon-file-search" />,
  CreditCard: () => <span data-testid="icon-credit-card" />,
}));

describe('QuickActions', () => {
  it('renders title', () => {
    render(<QuickActions />);
    expect(screen.getByText('Acoes Rapidas')).toBeInTheDocument();
  });

  it('renders all 4 action buttons', () => {
    render(<QuickActions />);
    expect(screen.getByText('Nova Conta')).toBeInTheDocument();
    expect(screen.getByText('Upload TISS')).toBeInTheDocument();
    expect(screen.getByText('Ver Glosas')).toBeInTheDocument();
    expect(screen.getByText('Pagamentos')).toBeInTheDocument();
  });

  it('links have correct hrefs', () => {
    render(<QuickActions />);
    expect(screen.getByText('Nova Conta').closest('a')).toHaveAttribute('href', '/contas/nova');
    expect(screen.getByText('Upload TISS').closest('a')).toHaveAttribute('href', '/tiss/upload');
    expect(screen.getByText('Ver Glosas').closest('a')).toHaveAttribute('href', '/glosas');
    expect(screen.getByText('Pagamentos').closest('a')).toHaveAttribute('href', '/pagamentos');
  });
});
