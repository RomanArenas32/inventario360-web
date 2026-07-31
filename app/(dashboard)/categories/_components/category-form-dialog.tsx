'use client';

import { api } from '@/lib/api';
import type { Category } from '@/lib/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormState = { name: string; description: string };
const EMPTY: FormState = { name: '', description: '' };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSuccess: () => void;
};

export function CategoryFormDialog({ open, onOpenChange, category, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(
    category ? { name: category.name, description: category.description ?? '' } : EMPTY,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleOpenChange(open: boolean) {
    if (!open) setError('');
    onOpenChange(open);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = { name: form.name, description: form.description || undefined };
      if (category) {
        await api.patch(`/categories/${category.id}`, body);
        toast.success('Categoría actualizada');
      } else {
        await api.post('/categories', body);
        toast.success('Categoría creada');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <Label className="text-sm font-medium mb-1.5">Nombre *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Bebidas"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5">Descripción</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
