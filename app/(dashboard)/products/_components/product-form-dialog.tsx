'use client';

import { api } from '@/lib/api';
import type { Category, Product } from '@/lib/client';
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

type FormState = {
  name: string;
  code: string;
  description: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  categoryId: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  name: '',
  code: '',
  description: '',
  costPrice: '',
  salePrice: '',
  stock: '0',
  minStock: '0',
  categoryId: '',
  isActive: true,
};

const NO_CATEGORY_VALUE = 'none';

function getInitialForm(product: Product | null): FormState {
  if (!product) return EMPTY;

  return {
    name: product.name,
    code: product.code,
    description: product.description ?? '',
    costPrice: product.costPrice?.toString() ?? '',
    salePrice: product.salePrice?.toString() ?? '',
    stock: product.stock.toString(),
    minStock: product.minStock.toString(),
    categoryId: product.category?.id ?? '',
    isActive: product.isActive,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSuccess: () => void;
};

export function ProductFormDialog({ open, onOpenChange, product, categories, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(() => getInitialForm(product));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleOpenChange(open: boolean) {
    if (!open) {
      setForm(getInitialForm(product));
      setError('');
    }
    onOpenChange(open);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = {
        name: form.name,
        code: form.code,
        description: form.description || undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        ...(product ? {} : { stock: parseInt(form.stock, 10) }),
        minStock: parseInt(form.minStock, 10),
        categoryId: form.categoryId || (product ? null : undefined),
        isActive: form.isActive,
      };
      if (product) {
        await api.patch(`/products/${product.id}`, body);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', body);
        toast.success('Producto creado');
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5">Nombre *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del producto"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5">Código *</Label>
              <Input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="font-mono"
                placeholder="Ej: 7790001"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5">Descripción</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5">Categoría</Label>
            <Select
              value={form.categoryId || NO_CATEGORY_VALUE}
              onValueChange={(val) =>
                setForm({ ...form, categoryId: val === NO_CATEGORY_VALUE ? '' : (val ?? '') })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin categoría">
                  {form.categoryId
                    ? (categories.find((c) => c.id === form.categoryId)?.name ?? 'Sin categoría')
                    : 'Sin categoría'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY_VALUE}>Sin categoría</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5">Precio de costo</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5">Precio de venta</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5">Stock actual</Label>
              {product ? (
                <>
                  <Input type="number" value={form.stock} disabled />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Modificalo desde Stock → Registrar movimiento.
                  </p>
                </>
              ) : (
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5">Stock mínimo</Label>
              <Input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-border"
            />
            <Label htmlFor="isActive" className="font-normal">
              Producto activo
            </Label>
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
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
