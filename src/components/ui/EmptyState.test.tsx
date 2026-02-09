import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import { FileText } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={FileText}
        title="Nenhum registro"
        description="Nao ha registros para exibir."
      />
    );
    expect(screen.getByText('Nenhum registro')).toBeInTheDocument();
    expect(screen.getByText('Nao ha registros para exibir.')).toBeInTheDocument();
  });

  it('renders action button when actionLabel and actionHref provided', () => {
    render(
      <EmptyState
        icon={FileText}
        title="Nenhum registro"
        description="Nao ha registros para exibir."
        actionLabel="Criar novo"
        actionHref="/novo"
      />
    );
    const link = screen.getByText('Criar novo');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/novo');
  });

  it('does not render action button when not provided', () => {
    render(
      <EmptyState
        icon={FileText}
        title="Nenhum registro"
        description="Nao ha registros para exibir."
      />
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
