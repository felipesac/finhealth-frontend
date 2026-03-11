import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Upload, FileSearch, CreditCard } from 'lucide-react';

const actions = [
  { href: '/contas/nova', label: 'Nova Conta', icon: FilePlus },
  { href: '/tiss/upload', label: 'Upload TISS', icon: Upload },
  { href: '/glosas', label: 'Ver Glosas', icon: FileSearch },
  { href: '/pagamentos', label: 'Pagamentos', icon: CreditCard },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Acoes Rapidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {actions.map((action) => (
            <Button key={action.href} variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href={action.href}>
                <action.icon className="h-5 w-5" />
                <span className="text-xs">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
