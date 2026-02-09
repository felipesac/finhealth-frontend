'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, AlertCircle, CreditCard, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/contas', label: 'Contas', icon: FileText },
  { href: '/glosas', label: 'Glosas', icon: AlertCircle },
  { href: '/pagamentos', label: 'Pagam.', icon: CreditCard },
  { href: '/relatorios', label: 'Relat.', icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden" aria-label="Navegacao mobile">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
