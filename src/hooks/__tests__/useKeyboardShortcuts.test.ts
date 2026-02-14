import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useKeyboardShortcuts', () => {
  it('navigates to dashboard on Alt+D', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', altKey: true }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to contas on Alt+C', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', altKey: true }));
    expect(mockPush).toHaveBeenCalledWith('/contas');
  });

  it('navigates to glosas on Alt+G', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', altKey: true }));
    expect(mockPush).toHaveBeenCalledWith('/glosas');
  });

  it('handles uppercase keys', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'P', altKey: true }));
    expect(mockPush).toHaveBeenCalledWith('/pagamentos');
  });

  it('ignores shortcuts when typing in input', () => {
    renderHook(() => useKeyboardShortcuts());

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'd', altKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    expect(mockPush).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('ignores shortcuts when typing in textarea', () => {
    renderHook(() => useKeyboardShortcuts());

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', { key: 'd', altKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea });
    window.dispatchEvent(event);

    expect(mockPush).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('does not navigate for unmapped keys', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', altKey: true }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('ignores when Ctrl is also pressed', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', altKey: true, ctrlKey: true }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('focuses main-content on Escape', () => {
    const main = document.createElement('div');
    main.id = 'main-content';
    main.tabIndex = -1;
    document.body.appendChild(main);
    const focusSpy = vi.spyOn(main, 'focus');

    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(focusSpy).toHaveBeenCalled();

    document.body.removeChild(main);
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });
});
