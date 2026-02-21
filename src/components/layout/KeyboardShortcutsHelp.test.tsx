import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

describe('KeyboardShortcutsHelp', () => {
  it('renders ? button with aria-label "Atalhos de teclado"', () => {
    render(<KeyboardShortcutsHelp />);
    const button = screen.getByRole('button', { name: 'Atalhos de teclado' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('?');
  });

  it('shows shortcuts card when clicked', () => {
    render(<KeyboardShortcutsHelp />);
    const button = screen.getByRole('button', { name: 'Atalhos de teclado' });
    fireEvent.click(button);
    expect(screen.getByText('Atalhos de Teclado')).toBeInTheDocument();
  });

  it('shows "Dashboard" shortcut in the list', () => {
    render(<KeyboardShortcutsHelp />);
    const button = screen.getByRole('button', { name: 'Atalhos de teclado' });
    fireEvent.click(button);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
