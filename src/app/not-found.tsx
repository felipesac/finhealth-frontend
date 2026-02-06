import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">Pagina nao encontrada</p>
      <Link
        href="/dashboard"
        className="mt-4 rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
