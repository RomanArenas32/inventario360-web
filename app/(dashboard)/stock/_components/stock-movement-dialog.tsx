'use client';

import { api } from '@/lib/api';
import type { Product, StockMovement } from '@/lib/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type MovementType = StockMovement['type'];

type MovementForm = {
  productId: string;
  type: MovementType;
  quantity: string;
  reason: string;
};

const EMPTY: MovementForm = {
  productId: '',
  type: 'entry',
  quantity: '1',
  reason: '',
};

const TYPE_LABELS: Record<MovementType, string> = {
  entry: 'Entrada — suma stock',
  exit: 'Salida — resta stock',
  adjustment: 'Ajuste — establece el stock real',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductId?: string;
  products: Product[];
  onSuccess: () => void;
};

export function StockMovementDialog({
  open,
  onOpenChange,
  initialProductId = '',
  products,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<MovementForm>({ ...EMPTY, productId: initialProductId });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleOpenChange(open: boolean) {
    if (!open) {
      setForm({ ...EMPTY, productId: initialProductId });
      setError('');
    }
    onOpenChange(open);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const quantity = Number(form.quantity);
    const reason = form.reason.trim();

    if (!form.productId) {
      setError('Seleccioná un producto');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      setError('La cantidad debe ser un número entero válido');
      return;
    }
    if (form.type !== 'adjustment' && quantity < 1) {
      setError('La cantidad debe ser mayor que cero');
      return;
    }
    if (!reason) {
      setError('El motivo es obligatorio');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/stock-movements', {
        productId: form.productId,
        type: form.type,
        quantity,
        reason,
      });
      toast.success('Movimiento registrado');
      handleOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo registrar el movimiento';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === form.productId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <Label className="mb-1.5 text-sm font-medium">Producto *</Label>
            <Select
              value={form.productId}
              onValueChange={(value) => setForm({ ...form, productId: value ?? '' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccioná un producto">
                  {selectedProduct
                    ? `${selectedProduct.name} — ${selectedProduct.code}`
                    : 'Seleccioná un producto'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="rounded-lg bg-muted px-3 py-2 text-sm">
              Stock actual: <span className="font-semibold">{selectedProduct.stock}</span>
            </div>
          )}

          <div>
            <Label className="mb-1.5 text-sm font-medium">Tipo de movimiento *</Label>
            <Select
              value={form.type}
              onValueChange={(value) => {
                if (value) setForm({ ...form, type: value as MovementType });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{TYPE_LABELS[form.type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entrada — suma stock</SelectItem>
                <SelectItem value="exit">Salida — resta stock</SelectItem>
                <SelectItem value="adjustment">Ajuste — establece el stock real</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 text-sm font-medium">
              {form.type === 'adjustment' ? 'Stock contado *' : 'Cantidad *'}
            </Label>
            <Input
              required
              type="number"
              min={form.type === 'adjustment' ? 0 : 1}
              step="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 text-sm font-medium">Motivo *</Label>
            <Textarea
              required
              maxLength={255}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ej: Compra al proveedor, venta, uso interno o conteo físico"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
