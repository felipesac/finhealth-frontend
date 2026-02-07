'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  guideNumber?: string;
}

interface AccountOption {
  id: string;
  account_number: string;
  patient_name?: string;
}

interface TissUploadFormProps {
  accounts: AccountOption[];
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function TissUploadForm({ accounts }: TissUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const xmlFile = acceptedFiles[0];
    if (xmlFile) {
      setFile(xmlFile);
      setValidationResult(null);
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/xml': ['.xml'], 'application/xml': ['.xml'] },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho maximo permitido e 5MB.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Arquivo invalido',
          description: error?.message || 'Selecione um arquivo XML valido.',
          variant: 'destructive',
        });
      }
    },
  });

  const handleUpload = async () => {
    if (!file || !selectedAccountId) return;

    setUploading(true);
    setProgress(0);
    setValidationResult(null);
    setUploadError(null);

    try {
      // Stage 1: Read file (0-30%)
      setProgress(10);
      const xmlContent = await readFileAsText(file);
      setProgress(30);

      // Stage 2: Upload to server (30-70%)
      setProgress(40);
      const response = await fetch('/api/tiss/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: xmlContent, accountId: selectedAccountId }),
      });
      setProgress(70);

      // Stage 3: Process response (70-100%)
      setProgress(85);
      const result = await response.json();
      setProgress(100);

      if (!response.ok || result.success === false) {
        setUploadError(result.error || `Erro ${response.status}`);
        return;
      }

      setValidationResult({
        isValid: result.isValid ?? true,
        errors: result.errors || [],
        warnings: result.warnings || [],
        guideNumber: result.guideNumber,
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      setUploadError(err.message || 'Erro de conexao com o servidor');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = file && selectedAccountId && !uploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload de Guia TISS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Conta Medica</label>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta medica" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_number} — {account.patient_name || 'Sem paciente'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-primary">Solte o arquivo aqui...</p>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Arraste um arquivo XML ou clique para selecionar
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Suporta TISS versao 3.05.00 (max 5MB)
              </p>
            </div>
          )}
        </div>

        {file && (
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <Button onClick={handleUpload} disabled={!canSubmit} size="sm">
              {uploading ? 'Processando...' : 'Validar e Enviar'}
            </Button>
          </div>
        )}

        {uploading && <Progress value={progress} className="h-2" />}

        {uploadError && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{uploadError}</span>
          </div>
        )}

        {validationResult && (
          <div className="space-y-2 rounded-md bg-muted p-4">
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {validationResult.isValid
                  ? 'Validacao concluida com sucesso'
                  : 'Erros encontrados na validacao'}
              </span>
            </div>

            {validationResult.guideNumber && (
              <p className="text-sm text-muted-foreground">
                Guia: <span className="font-mono font-medium">{validationResult.guideNumber}</span>
              </p>
            )}

            {validationResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-500">Erros:</p>
                <ul className="ml-4 list-disc text-sm text-red-500">
                  {validationResult.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm font-medium text-yellow-600">Alertas:</p>
                </div>
                <ul className="ml-4 list-disc text-sm text-yellow-600">
                  {validationResult.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
