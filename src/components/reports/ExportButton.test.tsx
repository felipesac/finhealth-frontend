import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from './ExportButton';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('ExportButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders export button', () => {
    render(<ExportButton dataType="accounts" />);
    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('calls fetch on click and triggers download', async () => {
    const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
      headers: new Headers({ 'Content-Disposition': 'attachment; filename="export.csv"' }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    // Render first, then set up spies
    render(<ExportButton dataType="accounts" />);

    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement && node.download) return node;
      return originalAppendChild(node);
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement && node.download) return node;
      return originalRemoveChild(node);
    });

    fireEvent.click(screen.getByText('Exportar'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/export', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ types: ['accounts'] }),
      }));
    });

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
    });
  });

  it('shows error toast on fetch failure', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Server error' }),
    });

    render(<ExportButton dataType="accounts" />);
    fireEvent.click(screen.getByText('Exportar'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Erro na exportacao', variant: 'destructive' })
      );
    });
  });
});
