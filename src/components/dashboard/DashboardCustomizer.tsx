'use client';

import { useDashboardStore } from '@/stores/dashboard-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings2, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function DashboardCustomizer() {
  const [open, setOpen] = useState(false);
  const { widgets, toggleWidget, moveWidget, resetWidgets } = useDashboardStore();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings2 className="mr-2 h-4 w-4" /> Personalizar
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Personalizar Dashboard</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {widgets.map((widget, index) => (
          <div key={widget.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={widget.visible}
                onCheckedChange={() => toggleWidget(widget.id)}
                id={`widget-${widget.id}`}
              />
              <Label htmlFor={`widget-${widget.id}`} className="text-sm">
                {widget.label}
              </Label>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === 0}
                onClick={() => moveWidget(index, index - 1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === widgets.length - 1}
                onClick={() => moveWidget(index, index + 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={resetWidgets}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restaurar Padrao
        </Button>
      </CardContent>
    </Card>
  );
}
