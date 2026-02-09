import type { Metadata } from 'next';
import { UserManagement } from '@/components/admin/UserManagement';

export const metadata: Metadata = {
  title: 'Usuarios | FinHealth',
  description: 'Gerenciamento de usuarios do sistema',
};

export default function ConfigUsuariosPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Usuarios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie os usuarios com acesso ao sistema
        </p>
      </div>

      <UserManagement />
    </div>
  );
}
