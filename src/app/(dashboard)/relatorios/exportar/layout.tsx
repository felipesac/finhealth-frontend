import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exportar Dados | FinHealth',
  description: 'Exporte dados do sistema para CSV',
};

export default function ExportarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
