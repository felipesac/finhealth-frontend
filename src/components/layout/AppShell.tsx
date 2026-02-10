'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, navItems } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import dynamic from 'next/dynamic';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useTranslations } from 'next-intl';

const MobileBottomNav = dynamic(
  () => import('./MobileBottomNav').then((m) => ({ default: m.MobileBottomNav })),
  { ssr: false }
);

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarCollapsed } = useUIStore();
  const pathname = usePathname();
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  useKeyboardShortcuts();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!mounted) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden md:block w-64 border-r border-border/60 bg-card" />
        <div className="flex flex-1 flex-col">
          <div className="h-14 border-b border-border/60 sm:h-16" />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" />
        </div>
      </div>
    );
  }

  return (
    <>
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      {t('skipToContent')}
    </a>
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-14 items-center border-b border-border/60 px-5">
            <span className="text-lg font-semibold tracking-tight text-primary">
              FinHealth
            </span>
          </div>
          <nav className="space-y-0.5 px-3 py-3" aria-label={tNav('mainNav')}>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-[1.125rem] w-[1.125rem] flex-shrink-0" aria-hidden="true" />
                    <span>{tNav(item.labelKey)}</span>
                  </Link>
                  {hasSubItems && isActive && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/50 pl-3">
                      {item.subItems!.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'block rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                            pathname === sub.href
                              ? 'font-medium text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          {tNav(sub.labelKey)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          'md:ml-[4.5rem]',
          !sidebarCollapsed && 'md:ml-64'
        )}
      >
        <Header
          userEmail={userEmail}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main id="main-content" className="flex-1 overflow-auto p-4 pb-20 sm:p-6 sm:pb-6 md:pb-8 lg:p-8">
          <Breadcrumbs />
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
    <KeyboardShortcutsHelp />
    </>
  );
}
