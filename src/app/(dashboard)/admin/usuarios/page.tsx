import type { Metadata } from 'next';
import { UserManagement } from '@/components/admin/UserManagement';

export const metadata: Metadata = {
  title: 'Gerenciamento de Usuarios | FinHealth',
  description: 'Gerenciamento de usuarios e permissoes',
};

export default function AdminUsuariosPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Gerenciamento de Usuarios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie usuarios, perfis e permissoes do sistema
        </p>
      </div>
      <UserManagement />
    </div>
  );
}
