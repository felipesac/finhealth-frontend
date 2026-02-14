import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, navItems } from './Sidebar';

const mockCollapsed = false;
const mockToggle = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/stores/ui-store', () => ({
  useUIStore: () => ({
    sidebarCollapsed: mockCollapsed,
    toggleSidebar: mockToggle,
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      nav: {
        dashboard: 'Dashboard',
        accounts: 'Contas Medicas',
        accountsList: 'Listagem',
        newAccount: 'Nova Conta',
        glosas: 'Glosas',
        panel: 'Painel',
        byInsurer: 'Por Operadora',
        billing: 'Faturamento',
        payments: 'Pagamentos',
        reconciliation: 'Conciliacao',
        delinquency: 'Inadimplencia',
        tiss: 'TISS',
        guides: 'Guias',
        upload: 'Upload',
        validation: 'Validacao',
        batches: 'Lotes',
        certificates: 'Certificados',
        sus: 'SUS',
        bpa: 'BPA',
        aih: 'AIH',
        sigtap: 'SIGTAP',
        remessa: 'Remessa',
        reports: 'Relatorios',
        settings: 'Configuracoes',
        general: 'Geral',
        users: 'Usuarios',
        insurers: 'Operadoras',
        patients: 'Pacientes',
        audit: 'Auditoria',
        mainNav: 'Navegacao principal',
      },
      sidebar: {
        expand: 'Expandir menu lateral',
        collapse: 'Recolher menu lateral',
      },
    };
    return (key: string) => translations[namespace]?.[key] ?? key;
  },
}));

// Map from labelKey to expected translated text for assertions
const navTranslations: Record<string, string> = {
  dashboard: 'Dashboard',
  accounts: 'Contas Medicas',
  glosas: 'Glosas',
  payments: 'Pagamentos',
  tiss: 'TISS',
  sus: 'SUS',
  reports: 'Relatorios',
  settings: 'Configuracoes',
};

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    render(<Sidebar />);
    for (const item of navItems) {
      const translatedLabel = navTranslations[item.labelKey] ?? item.labelKey;
      expect(screen.getByText(translatedLabel)).toBeInTheDocument();
    }
  });

  it('renders correct number of nav links and expandable buttons', () => {
    render(<Sidebar />);
    const links = screen.getAllByRole('link');
    const itemsWithSub = navItems.filter(i => i.subItems && i.subItems.length > 0);
    const itemsWithoutSub = navItems.filter(i => !i.subItems || i.subItems.length === 0);
    // Items with subItems render as buttons, not links
    expect(links).toHaveLength(itemsWithoutSub.length);
    for (const item of itemsWithSub) {
      const translatedLabel = navTranslations[item.labelKey] ?? item.labelKey;
      expect(screen.getByText(translatedLabel).closest('button')).toBeInTheDocument();
    }
  });

  it('highlights active nav item', () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('non-active items do not have aria-current', () => {
    render(<Sidebar />);
    const relatoriosLink = screen.getByText('Relatorios').closest('a');
    expect(relatoriosLink).not.toHaveAttribute('aria-current');
  });

  it('renders toggle button with correct aria-label', () => {
    render(<Sidebar />);
    const toggleBtn = screen.getByLabelText('Recolher menu lateral');
    expect(toggleBtn).toBeInTheDocument();
  });

  it('calls toggleSidebar on toggle button click', () => {
    render(<Sidebar />);
    const toggleBtn = screen.getByLabelText('Recolher menu lateral');
    fireEvent.click(toggleBtn);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('renders navigation landmark', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText('Navegacao principal')).toBeInTheDocument();
  });

  it('calls onNavigate when a link is clicked', () => {
    const onNavigate = vi.fn();
    render(<Sidebar onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Relatorios'));
    expect(onNavigate).toHaveBeenCalled();
  });
});
