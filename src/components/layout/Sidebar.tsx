'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  CreditCard,
  Upload,
  BarChart3,
  Settings,
  ChevronLeft,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SubItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/contas',
    label: 'Contas Medicas',
    icon: FileText,
    subItems: [
      { href: '/contas', label: 'Listagem' },
      { href: '/contas/nova', label: 'Nova Conta' },
    ],
  },
  {
    href: '/glosas',
    label: 'Glosas',
    icon: AlertCircle,
    subItems: [
      { href: '/glosas', label: 'Painel' },
      { href: '/glosas/operadora', label: 'Por Operadora' },
      { href: '/glosas/faturamento', label: 'Faturamento' },
    ],
  },
  {
    href: '/pagamentos',
    label: 'Pagamentos',
    icon: CreditCard,
    subItems: [
      { href: '/pagamentos', label: 'Painel' },
      { href: '/pagamentos/conciliacao', label: 'Conciliacao' },
      { href: '/pagamentos/inadimplencia', label: 'Inadimplencia' },
    ],
  },
  {
    href: '/tiss',
    label: 'TISS',
    icon: Upload,
    subItems: [
      { href: '/tiss', label: 'Guias' },
      { href: '/tiss/upload', label: 'Upload' },
      { href: '/tiss/validacao', label: 'Validacao' },
      { href: '/tiss/lotes', label: 'Lotes' },
      { href: '/tiss/certificados', label: 'Certificados' },
    ],
  },
  {
    href: '/sus',
    label: 'SUS',
    icon: Building2,
    subItems: [
      { href: '/sus/bpa', label: 'BPA' },
      { href: '/sus/aih', label: 'AIH' },
      { href: '/sus/sigtap', label: 'SIGTAP' },
      { href: '/sus/remessa', label: 'Remessa' },
    ],
  },
  { href: '/relatorios', label: 'Relatorios', icon: BarChart3 },
  {
    href: '/configuracoes',
    label: 'Configuracoes',
    icon: Settings,
    subItems: [
      { href: '/configuracoes', label: 'Geral' },
      { href: '/configuracoes/usuarios', label: 'Usuarios' },
      { href: '/configuracoes/operadoras', label: 'Operadoras' },
      { href: '/configuracoes/pacientes', label: 'Pacientes' },
      { href: '/configuracoes/auditoria', label: 'Auditoria' },
    ],
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand if currently on a sub-route
    return navItems
      .filter((item) => item.subItems && pathname.startsWith(item.href))
      .map((item) => item.href);
  });

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300',
        sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold tracking-tight text-primary">
            FinHealth
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            sidebarCollapsed && 'mx-auto'
          )}
          aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              sidebarCollapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Navegacao principal">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems.includes(item.href);

          if (hasSubItems && !sidebarCollapsed) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleExpanded(item.href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem] flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/50 pl-3">
                    {item.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onNavigate}
                          className={cn(
                            'block rounded-lg px-3 py-2 text-sm transition-all duration-200',
                            isSubActive
                              ? 'font-medium text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                          aria-current={isSubActive ? 'page' : undefined}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-[1.125rem] w-[1.125rem] flex-shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { navItems };
