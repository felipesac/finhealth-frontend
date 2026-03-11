import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TissXmlActions } from './TissXmlActions';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('TissXmlActions', () => {
  const mockXml = '<xml>test content</xml>';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders copy and download buttons', () => {
    render(<TissXmlActions xml={mockXml} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('copies XML to clipboard on copy click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<TissXmlActions xml={mockXml} />);
    const copyBtn = screen.getAllByRole('button')[0];
    await fireEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith(mockXml);
  });

  it('downloads XML file on download click', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    // Render FIRST, then spy on appendChild/removeChild
    render(<TissXmlActions xml={mockXml} guideNumber="12345" />);

    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      // Only intercept anchor elements created by the download handler
      if (node instanceof HTMLAnchorElement && node.download) {
        return node;
      }
      return originalAppendChild(node);
    });
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement && node.download) {
        return node;
      }
      return originalRemoveChild(node);
    });

    const downloadBtn = screen.getAllByRole('button')[1];
    fireEvent.click(downloadBtn);

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
