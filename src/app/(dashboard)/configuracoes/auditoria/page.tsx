import type { Metadata } from 'next';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export const metadata: Metadata = {
  title: 'Auditoria | FinHealth',
  description: 'Logs de auditoria do sistema',
};

export default function AuditoriaPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historico de acoes realizadas no sistema
        </p>
      </div>
      <AuditLogViewer />
    </div>
  );
}
