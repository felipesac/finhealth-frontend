import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            FinHealth
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistema de Gestao Financeira Hospitalar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
