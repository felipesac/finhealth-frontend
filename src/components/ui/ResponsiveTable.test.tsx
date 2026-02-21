import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveTable } from './ResponsiveTable';

describe('ResponsiveTable', () => {
  it('renders both table and cards containers', () => {
    render(
      <ResponsiveTable
        table={<div data-testid="table-view">Table</div>}
        cards={<div data-testid="cards-view">Cards</div>}
      />
    );
    expect(screen.getByTestId('table-view')).toBeInTheDocument();
    expect(screen.getByTestId('cards-view')).toBeInTheDocument();
  });

  it('table container has hidden md:block classes', () => {
    const { container } = render(
      <ResponsiveTable
        table={<div>Table</div>}
        cards={<div>Cards</div>}
      />
    );
    // Fragment renders two divs as direct children of the render container
    const tableWrapper = container.children[0] as HTMLElement;
    expect(tableWrapper.className).toContain('hidden');
    expect(tableWrapper.className).toContain('md:block');
  });

  it('cards container has block md:hidden classes', () => {
    const { container } = render(
      <ResponsiveTable
        table={<div>Table</div>}
        cards={<div>Cards</div>}
      />
    );
    const cardsWrapper = container.children[1] as HTMLElement;
    expect(cardsWrapper.className).toContain('block');
    expect(cardsWrapper.className).toContain('md:hidden');
  });
});
