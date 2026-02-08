import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <div className="text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-primary sm:text-6xl">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">Pagina nao encontrada</p>
      </div>
      <Link href="/dashboard">
        <Button variant="outline">Voltar ao Dashboard</Button>
      </Link>
    </div>
  );
}
