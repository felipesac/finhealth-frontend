import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">
          Gerencie as configuracoes do sistema
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Atualize suas informacoes pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" />
              </div>
            </div>
            <Button>Salvar Alteracoes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguranca</CardTitle>
            <CardDescription>
              Altere sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" />
              </div>
            </div>
            <Button>Alterar Senha</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integracao TISS</CardTitle>
            <CardDescription>
              Configure a versao do padrao TISS utilizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Versao do Padrao TISS</Label>
              <p className="text-sm text-muted-foreground">3.05.00</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Certificado Digital</Label>
              <p className="text-sm text-muted-foreground">
                Nenhum certificado configurado
              </p>
              <Button variant="outline" size="sm">
                Configurar Certificado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
