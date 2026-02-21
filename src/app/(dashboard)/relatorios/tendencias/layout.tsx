import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tendencias | FinHealth',
  description: 'Analise de tendencias e previsoes financeiras',
};

export default function TendenciasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
