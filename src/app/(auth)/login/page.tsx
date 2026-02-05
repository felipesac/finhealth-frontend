import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">FinHealth</h1>
          <p className="mt-2 text-muted-foreground">
            Sistema de Gestao Financeira Hospitalar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
