'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Upload,
  FileKey,
  XCircle,
  AlertTriangle,
  Shield,
  Trash2,
  Loader2,
  CalendarClock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { DigitalCertificate } from '@/types/database';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface CertificateUploadProps {
  className?: string;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:application/...;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getDaysUntilExpiry(validTo: string): number {
  const now = new Date();
  const expiry = new Date(validTo);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status, validTo }: { status: string; validTo: string }) {
  const days = getDaysUntilExpiry(validTo);

  if (status === 'active' && days > 60) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>;
  }
  if (status === 'active' && days > 0) {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expira em {days}d</Badge>;
  }
  if (status === 'expired' || days <= 0) {
    return <Badge variant="destructive">Expirado</Badge>;
  }
  if (status === 'replaced') {
    return <Badge variant="secondary">Substituido</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

export function CertificateUpload({ className }: CertificateUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [certName, setCertName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      const response = await fetch('/api/certificates');
      const data = await response.json();
      if (data.success) {
        setCertificates(data.certificates || []);
      }
    } catch {
      // Silently fail on fetch - table may not exist yet
    } finally {
      setLoadingCerts(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const certFile = acceptedFiles[0];
    if (certFile) {
      setFile(certFile);
      setUploadError(null);
      setUploadWarnings([]);
      // Auto-fill name from filename without extension
      if (!certName) {
        const nameWithoutExt = certFile.name.replace(/\.(pfx|p12)$/i, '');
        setCertName(nameWithoutExt);
      }
    }
  }, [certName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-pkcs12': ['.pfx', '.p12'],
      'application/pkcs12': ['.pfx', '.p12'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho maximo permitido e 2MB.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Arquivo invalido',
          description: 'Selecione um arquivo .pfx ou .p12.',
          variant: 'destructive',
        });
      }
    },
  });

  const handleUpload = async () => {
    if (!file || !password || !certName) return;

    setUploading(true);
    setProgress(0);
    setUploadError(null);
    setUploadWarnings([]);

    try {
      // Stage 1: Read file (0-30%)
      setProgress(10);
      const fileData = await readFileAsBase64(file);
      setProgress(30);

      // Stage 2: Upload and validate (30-80%)
      setProgress(40);
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData,
          password,
          name: certName,
        }),
      });
      setProgress(80);

      // Stage 3: Process response (80-100%)
      const result = await response.json();
      setProgress(100);

      if (!response.ok || !result.success) {
        setUploadError(result.error || `Erro ${response.status}`);
        if (result.errors?.length > 1) {
          setUploadWarnings(result.errors.slice(1));
        }
        return;
      }

      if (result.warnings?.length > 0) {
        setUploadWarnings(result.warnings);
      }

      toast({ title: 'Certificado cadastrado com sucesso' });

      // Reset form
      setFile(null);
      setPassword('');
      setCertName('');

      // Refresh list
      fetchCertificates();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setUploadError(err.message || 'Erro de conexao com o servidor');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (certId: string) => {
    setDeletingId(certId);
    try {
      const response = await fetch(`/api/certificates?id=${certId}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        toast({
          title: 'Erro ao remover certificado',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Certificado removido' });
      fetchCertificates();
    } catch {
      toast({
        title: 'Erro ao remover certificado',
        description: 'Falha na conexao',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const canSubmit = file && password && certName && !uploading;
  const activeCert = certificates.find((c) => c.status === 'active');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Certificado Digital
        </CardTitle>
        <CardDescription>
          Gerencie seu certificado digital A1 para assinatura de guias TISS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active certificate display */}
        {loadingCerts ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando certificados...
          </div>
        ) : activeCert ? (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileKey className="h-5 w-5 text-primary" />
                <span className="font-medium">{activeCert.name}</span>
              </div>
              <StatusBadge status={activeCert.status} validTo={activeCert.valid_to} />
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Titular:</span>
                {activeCert.common_name}
              </div>
              {activeCert.cnpj && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">CNPJ:</span>
                  {activeCert.cnpj}
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>
                  Valido de {formatDate(activeCert.valid_from)} ate {formatDate(activeCert.valid_to)}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(activeCert.id)}
              disabled={deletingId === activeCert.id}
            >
              {deletingId === activeCert.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remover Certificado
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum certificado configurado
          </p>
        )}

        <Separator />

        {/* Upload form */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">
            {activeCert ? 'Substituir Certificado' : 'Adicionar Certificado'}
          </h4>

          <div className="space-y-2">
            <Label htmlFor="cert-name">Nome de identificacao</Label>
            <Input
              id="cert-name"
              placeholder="Ex: Certificado Clinica ABC"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div
            {...getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50',
              uploading && 'pointer-events-none opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary text-sm">Solte o arquivo aqui...</p>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Arraste um arquivo .pfx ou .p12 ou clique para selecionar
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Certificado digital A1 (max 2MB)
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="flex items-center gap-2 rounded-md bg-muted p-3">
              <FileKey className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          {file && (
            <div className="space-y-2">
              <Label htmlFor="cert-password">Senha do certificado</Label>
              <Input
                id="cert-password"
                type="password"
                placeholder="Digite a senha do certificado"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={uploading}
              />
            </div>
          )}

          {file && (
            <Button onClick={handleUpload} disabled={!canSubmit} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando certificado...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Validar e Salvar
                </>
              )}
            </Button>
          )}

          {uploading && (
            <Progress value={progress} className="h-2" aria-label="Progresso do upload" />
          )}

          {uploadError && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300" role="alert" aria-live="polite">
              <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {uploadWarnings.length > 0 && (
            <div className="space-y-1 rounded-md bg-yellow-50 p-4 dark:bg-yellow-950">
              {uploadWarnings.map((warning, i) => (
                <div key={i} className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-sm">{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificate history */}
        {certificates.length > 1 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Historico</h4>
              {certificates
                .filter((c) => c.status !== 'active')
                .map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileKey className="h-4 w-4 text-muted-foreground" />
                      <span>{cert.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={cert.status} validTo={cert.valid_to} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(cert.id)}
                        disabled={deletingId === cert.id}
                      >
                        {deletingId === cert.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
