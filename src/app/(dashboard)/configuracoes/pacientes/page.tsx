import type { Metadata } from 'next';
import { PatientManagement } from '@/components/admin/PatientManagement';

export const metadata: Metadata = {
  title: 'Pacientes | FinHealth',
  description: 'Gerenciamento de pacientes',
};

export default function PacientesPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pacientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerenciamento de cadastro de pacientes</p>
      </div>
      <PatientManagement />
    </div>
  );
}
