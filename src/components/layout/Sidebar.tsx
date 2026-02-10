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
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

interface SubItem {
  href: string;
  labelKey: string;
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  {
    href: '/contas',
    labelKey: 'accounts',
    icon: FileText,
    subItems: [
      { href: '/contas', labelKey: 'accountsList' },
      { href: '/contas/nova', labelKey: 'newAccount' },
    ],
  },
  {
    href: '/glosas',
    labelKey: 'glosas',
    icon: AlertCircle,
    subItems: [
      { href: '/glosas', labelKey: 'panel' },
      { href: '/glosas/operadora', labelKey: 'byInsurer' },
      { href: '/glosas/faturamento', labelKey: 'billing' },
    ],
  },
  {
    href: '/pagamentos',
    labelKey: 'payments',
    icon: CreditCard,
    subItems: [
      { href: '/pagamentos', labelKey: 'panel' },
      { href: '/pagamentos/conciliacao', labelKey: 'reconciliation' },
      { href: '/pagamentos/inadimplencia', labelKey: 'delinquency' },
    ],
  },
  {
    href: '/tiss',
    labelKey: 'tiss',
    icon: Upload,
    subItems: [
      { href: '/tiss', labelKey: 'guides' },
      { href: '/tiss/upload', labelKey: 'upload' },
      { href: '/tiss/validacao', labelKey: 'validation' },
      { href: '/tiss/lotes', labelKey: 'batches' },
      { href: '/tiss/certificados', labelKey: 'certificates' },
    ],
  },
  {
    href: '/sus',
    labelKey: 'sus',
    icon: Building2,
    subItems: [
      { href: '/sus/bpa', labelKey: 'bpa' },
      { href: '/sus/aih', labelKey: 'aih' },
      { href: '/sus/sigtap', labelKey: 'sigtap' },
      { href: '/sus/remessa', labelKey: 'remessa' },
    ],
  },
  { href: '/relatorios', labelKey: 'reports', icon: BarChart3 },
  {
    href: '/configuracoes',
    labelKey: 'settings',
    icon: Settings,
    subItems: [
      { href: '/configuracoes', labelKey: 'general' },
      { href: '/configuracoes/usuarios', labelKey: 'users' },
      { href: '/configuracoes/operadoras', labelKey: 'insurers' },
      { href: '/configuracoes/pacientes', labelKey: 'patients' },
      { href: '/configuracoes/auditoria', labelKey: 'audit' },
    ],
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const t = useTranslations('nav');
  const ts = useTranslations('sidebar');
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
          aria-label={sidebarCollapsed ? ts('expand') : ts('collapse')}
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
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label={t('mainNav')}>
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
                  <span className="flex-1 text-left">{t(item.labelKey)}</span>
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
                          {t(sub.labelKey)}
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
              title={sidebarCollapsed ? t(item.labelKey) : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-[1.125rem] w-[1.125rem] flex-shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { navItems };
