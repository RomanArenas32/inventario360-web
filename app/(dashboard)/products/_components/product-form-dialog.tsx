'use client';

import { api } from '@/lib/api';
import type { Category, Product } from '@/lib/client';
import { useEffect, useRef, useState } from 'react';
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
import { Sparkles, X, Package, DollarSign, Tag, BarChart3 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

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
const NO_SPIN =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

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

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-border">
      <Icon size={13} className="text-muted-foreground" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

// ── EAN lookup ────────────────────────────────────────────────────────────────

type EanSuggestion = { name: string; brand: string; description: string };

type OFFProduct = {
  product_name?: string;
  product_name_es?: string;
  brands?: string;
  generic_name?: string;
  generic_name_es?: string;
};

async function lookupEan(code: string): Promise<EanSuggestion | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}?fields=product_name,product_name_es,brands,generic_name,generic_name_es`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { status: number; product?: OFFProduct };
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const name = p.product_name_es || p.product_name || '';
    if (!name) return null;
    return {
      name: name.trim(),
      brand: p.brands?.split(',')[0]?.trim() ?? '',
      description: (p.generic_name_es || p.generic_name || '').trim(),
    };
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSuccess: () => void;
};

export function ProductFormDialog({ open, onOpenChange, product, categories, onSuccess }: Props) {
  const isEdit = !!product;

  const [form, setForm] = useState<FormState>(() => getInitialForm(product));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [eanSuggestion, setEanSuggestion] = useState<EanSuggestion | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persistence: only re-initialize when the target product changes identity
  const lastInitKey = useRef<string>('');

  useEffect(() => {
    if (!open) return;
    const key = product ? `edit:${product.id}` : 'new';
    // For new product: preserve form data on accidental close
    if (key === 'new' && lastInitKey.current === 'new') return;
    lastInitKey.current = key;
    setForm(getInitialForm(product));
    setError('');
    setEanSuggestion(null);
  }, [open, product]);

  function resetInitKey() {
    lastInitKey.current = '';
  }

  function handleCancel() {
    resetInitKey();
    onOpenChange(false);
  }

  // EAN lookup debounced (only new products, only when name is still empty)
  useEffect(() => {
    if (isEdit) return;
    const code = form.code.trim();
    const isEan = /^\d{8}$|^\d{12,13}$/.test(code);

    setEanSuggestion(null);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (!isEan) return;

    lookupTimer.current = setTimeout(async () => {
      setLookingUp(true);
      const result = await lookupEan(code);
      setLookingUp(false);
      if (result && !form.name) setEanSuggestion(result);
    }, 600);

    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.code]);

  function applySuggestion() {
    if (!eanSuggestion) return;
    const fullName = eanSuggestion.brand
      ? `${eanSuggestion.name} ${eanSuggestion.brand}`.trim()
      : eanSuggestion.name;
    setForm((f) => ({
      ...f,
      name: f.name || fullName,
      description: f.description || eanSuggestion.description,
    }));
    setEanSuggestion(null);
  }

  // Computed margin
  const cost = parseFloat(form.costPrice) || 0;
  const sale = parseFloat(form.salePrice) || 0;
  const margin = cost > 0 && sale > 0 ? Math.round(((sale - cost) / cost) * 100) : null;

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
        ...(isEdit ? {} : { stock: parseInt(form.stock, 10) }),
        minStock: parseInt(form.minStock, 10),
        categoryId: form.categoryId || (isEdit ? null : undefined),
      };
      if (isEdit) {
        await api.patch(`/products/${product.id}`, body);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', body);
        toast.success('Producto creado');
        resetInitKey();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Package size={17} className="text-muted-foreground" />
            {isEdit ? `Editar — ${product.name}` : 'Nuevo producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="px-6 py-5 space-y-6 max-h-[65vh] overflow-y-auto">
            {/* ── Identificación ──────────────────────────────────── */}
            <div className="space-y-4">
              <SectionLabel icon={Tag}>Identificación</SectionLabel>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre *</Label>
                  <Input
                    required
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    Código (EAN/UPC) *
                    {lookingUp && (
                      <span className="text-[10px] text-muted-foreground font-normal animate-pulse">
                        Buscando...
                      </span>
                    )}
                  </Label>
                  <Input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="font-mono"
                    placeholder="Escaneá o escribí el código"
                  />
                </div>
              </div>

              {/* EAN suggestion banner */}
              {eanSuggestion && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2.5">
                  <Sparkles size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-0.5">
                      Encontrado en Open Food Facts
                    </p>
                    <p className="text-sm font-medium text-foreground">{eanSuggestion.name}</p>
                    {eanSuggestion.brand && (
                      <p className="text-xs text-muted-foreground">{eanSuggestion.brand}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={applySuggestion}
                    >
                      Usar
                    </Button>
                    <button
                      type="button"
                      onClick={() => setEanSuggestion(null)}
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoría</Label>
                  <Select
                    value={form.categoryId || NO_CATEGORY_VALUE}
                    onValueChange={(val) =>
                      setForm({ ...form, categoryId: val === NO_CATEGORY_VALUE ? '' : (val ?? '') })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin categoría">
                        {form.categoryId
                          ? (categories.find((c) => c.id === form.categoryId)?.name ??
                            'Sin categoría')
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Descripción</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            {/* ── Precios ─────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionLabel icon={DollarSign}>Precios</SectionLabel>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Precio de costo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.costPrice}
                      onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                      placeholder="0"
                      className={`pl-7 ${NO_SPIN}`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Precio de venta</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.salePrice}
                      onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                      placeholder="0"
                      className={`pl-7 ${NO_SPIN}`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Margen</Label>
                  <div
                    className={`h-9 rounded-lg border flex items-center justify-center text-sm font-semibold ${
                      margin === null
                        ? 'bg-muted text-muted-foreground border-border'
                        : margin >= 0
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600'
                    }`}
                  >
                    {margin === null ? '—' : `${margin > 0 ? '+' : ''}${margin}%`}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stock ───────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionLabel icon={BarChart3}>Stock</SectionLabel>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Stock actual</Label>
                  {isEdit ? (
                    <div className="space-y-1">
                      <Input type="number" value={form.stock} disabled className={NO_SPIN} />
                      <p className="text-xs text-muted-foreground">
                        Modificalo desde Stock → Registrar movimiento.
                      </p>
                    </div>
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className={NO_SPIN}
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Stock mínimo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                    className={NO_SPIN}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recibirás una alerta cuando el stock llegue a este número.
                  </p>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
