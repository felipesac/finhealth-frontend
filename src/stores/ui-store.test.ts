import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarCollapsed: false });
  });

  it('starts with sidebar expanded', () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('toggles sidebar', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it('toggles back', () => {
    useUIStore.getState().toggleSidebar();
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });
});
