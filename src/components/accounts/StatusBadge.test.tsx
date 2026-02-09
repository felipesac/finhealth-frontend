import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import type { AccountStatus } from '@/types';

describe('StatusBadge', () => {
  const statusLabels: Record<AccountStatus, string> = {
    pending: 'Pendente',
    validated: 'Validada',
    sent: 'Enviada',
    paid: 'Paga',
    glosa: 'Glosada',
    appeal: 'Em Recurso',
  };

  it.each(Object.entries(statusLabels))(
    'renders correct label for status "%s"',
    (status, label) => {
      render(<StatusBadge status={status as AccountStatus} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  );
});
