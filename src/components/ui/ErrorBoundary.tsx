'use client';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureException } from '@/lib/error-tracking';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureException(error, {
      extra: { componentStack: errorInfo.componentStack ?? undefined },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center" role="alert">
          <AlertTriangle className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">
            {this.props.fallbackMessage || 'Algo deu errado ao carregar este conteudo.'}
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            Tente novamente ou recarregue a pagina.
          </p>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
