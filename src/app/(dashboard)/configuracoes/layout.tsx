import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuracoes | FinHealth',
  description: 'Gerencie as configuracoes do sistema',
};

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
