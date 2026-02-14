import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReconciliationBadge } from './ReconciliationBadge';

describe('ReconciliationBadge', () => {
  it.each([
    ['pending', 'Pendente'],
    ['partial', 'Parcial'],
    ['matched', 'Conciliado'],
    ['divergent', 'Divergente'],
  ])('renders label "%s" as "%s"', (status, label) => {
    render(<ReconciliationBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders unknown status as-is', () => {
    render(<ReconciliationBadge status="custom_status" />);
    expect(screen.getByText('custom_status')).toBeInTheDocument();
  });
});
