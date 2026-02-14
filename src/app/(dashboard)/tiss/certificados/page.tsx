import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CertificateUpload } from '@/components/certificates/CertificateUpload';

export const metadata: Metadata = {
  title: 'Certificados Digitais | FinHealth',
  description: 'Gerenciamento de certificados digitais para assinatura TISS',
};

export default function TissCertificadosPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Certificados Digitais
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerenciamento de certificados digitais para assinatura de guias TISS
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <CertificateUpload />

        <Card>
          <CardHeader>
            <CardTitle>Sobre Certificados Digitais</CardTitle>
            <CardDescription>
              Informacoes sobre o uso de certificados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-1">Certificado A1</h3>
                <p className="text-sm text-muted-foreground">
                  Arquivo digital (.pfx/.p12) armazenado no computador. Validade de 1 ano.
                  Recomendado para sistemas automatizados.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-1">Certificado A3</h3>
                <p className="text-sm text-muted-foreground">
                  Armazenado em token USB ou smartcard. Validade de 1 a 3 anos.
                  Recomendado para assinatura manual de guias.
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-medium mb-1">Requisitos</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Certificado digital ICP-Brasil valido</li>
                <li>Formato PFX ou P12 para upload</li>
                <li>CNPJ do prestador deve constar no certificado</li>
                <li>Certificado deve estar dentro do prazo de validade</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
