'use client';

import { api } from '@/lib/api';
import type { Product, Sale } from '@/lib/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Minus,
  Plus,
  Search,
  ShoppingCart,
  X,
  ChevronDown,
  ChevronUp,
  Scissors,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentMethod = 'cash' | 'card' | 'transfer';

type CatalogService = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  isActive: boolean;
};

type CartItem =
  | { kind: 'product'; product: Product; quantity: number }
  | { kind: 'service'; service: CatalogService; quantity: number }
  | { kind: 'manual'; description: string; unitPrice: number; quantity: number };

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sale: Sale) => void;
};

export function NewSaleDialog({ open, onOpenChange, onSuccess }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [surchargePct, setSurchargePct] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'products' | 'services'>('products');
  const [loadingServices, setLoadingServices] = useState(false);

  // Load products when dialog opens
  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams();
    params.set('isActive', 'true');
    if (search) params.set('search', search);
    void api
      .get<Product[]>(`/products?${params.toString()}`)
      .then(setProducts)
      .catch(() => null);
  }, [open, search]);

  // Load services when tab switches
  useEffect(() => {
    if (!open || tab !== 'services' || services.length > 0) return;
    setLoadingServices(true);
    void api
      .get<CatalogService[]>('/services')
      .then((data) => setServices(data.filter((s) => s.isActive)))
      .catch(() => null)
      .finally(() => setLoadingServices(false));
  }, [open, tab, services.length]);

  function reset() {
    setCart([]);
    setPaymentMethod('cash');
    setCashReceived('');
    setDiscountPct('');
    setSurchargePct('');
    setNotes('');
    setShowNotes(false);
    setError('');
    setSearch('');
    setTab('products');
    setServices([]);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  // ─── Cart helpers ───────────────────────────────────────────────────────────

  function addProduct(product: Product) {
    setCart((prev) => {
      const existing = prev.findIndex((i) => i.kind === 'product' && i.product.id === product.id);
      if (existing >= 0) {
        return prev.map((item, idx) =>
          idx === existing && item.kind === 'product'
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { kind: 'product', product, quantity: 1 }];
    });
  }

  function addService(service: CatalogService) {
    setCart((prev) => {
      const existing = prev.findIndex((i) => i.kind === 'service' && i.service.id === service.id);
      if (existing >= 0) {
        return prev.map((item, idx) =>
          idx === existing && item.kind === 'service'
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { kind: 'service', service, quantity: 1 }];
    });
  }

  function updateQty(index: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item, idx) => {
          if (idx !== index) return item;
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(index: number) {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  }

  function getItemLabel(item: CartItem) {
    if (item.kind === 'product') return item.product.name;
    if (item.kind === 'service') return item.service.name;
    return item.description;
  }

  function getUnitPrice(item: CartItem) {
    if (item.kind === 'product') return item.product.salePrice ?? 0;
    if (item.kind === 'service') return item.service.price;
    return item.unitPrice;
  }

  // ─── Calculations ───────────────────────────────────────────────────────────

  const subtotal = cart.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0);
  const discountNum = parseFloat(discountPct) || 0;
  const surchargeNum = parseFloat(surchargePct) || 0;
  const discountAmount = discountNum > 0 ? Math.round(subtotal * discountNum) / 100 : 0;
  const surchargeAmount = surchargeNum > 0 ? Math.round(subtotal * surchargeNum) / 100 : 0;
  const total = Math.max(0, subtotal - discountAmount + surchargeAmount);
  const cashNum = parseFloat(cashReceived) || 0;
  const vuelto = cashNum - total;

  const totalLabel =
    discountNum > 0 && surchargeNum > 0
      ? 'Total con ajustes'
      : discountNum > 0
        ? 'Total con descuento'
        : surchargeNum > 0
          ? 'Total con recargo'
          : 'Total';

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Agregá al menos un ítem al carrito');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const items = cart.map((item) => {
        if (item.kind === 'product') {
          return { productId: item.product.id, quantity: item.quantity };
        }
        if (item.kind === 'service') {
          return {
            description: item.service.name,
            unitPrice: item.service.price,
            quantity: item.quantity,
          };
        }
        return {
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        };
      });

      const body: Record<string, unknown> = {
        items,
        paymentMethod,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(discountNum > 0 ? { discountPct: discountNum } : {}),
        ...(surchargeNum > 0 ? { surchargePct: surchargeNum } : {}),
      };

      const sale = await api.post<Sale>('/sales', body);
      toast.success(
        `Venta #${(sale as Sale & { saleNumber: number }).saleNumber ?? ''} registrada`,
      );
      onSuccess(sale);
      handleOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la venta';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart size={18} />
            Nueva venta
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-1 min-h-0 overflow-hidden"
        >
          {/* ── Left: catalog ─────────────────────────────────────────────── */}
          <div className="w-1/2 border-r border-border flex flex-col min-h-0 px-4 pb-4 pt-4">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border mb-3 shrink-0">
              {(['products', 'services'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'products' ? (
                    'Productos'
                  ) : (
                    <>
                      <Scissors size={13} />
                      Servicios
                    </>
                  )}
                </button>
              ))}
            </div>

            {tab === 'products' && (
              <>
                <div className="relative mb-3 shrink-0">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
                  {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {search ? 'Sin resultados' : 'No hay productos activos'}
                    </p>
                  ) : (
                    products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.code} · stock: {p.stock}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary shrink-0">
                            {fmt(p.salePrice ?? 0)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {tab === 'services' && (
              <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
                {loadingServices ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
                ) : services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay servicios disponibles
                  </p>
                ) : (
                  services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addService(s)}
                      className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.name}</p>
                          {s.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {s.description}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-primary shrink-0">
                          {fmt(s.price)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Right: cart + payment ──────────────────────────────────────── */}
          <div className="w-1/2 flex flex-col min-h-0">
            {/* Cart */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 min-h-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                  <ShoppingCart size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">El carrito está vacío</p>
                  <p className="text-xs mt-1">Seleccioná productos o servicios</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getItemLabel(item)}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(getUnitPrice(item))} c/u ·{' '}
                          <span className="font-medium text-foreground">
                            {fmt(getUnitPrice(item) * item.quantity)}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQty(idx, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(idx, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors ml-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment section */}
            <div className="shrink-0 border-t border-border px-4 py-3 space-y-3">
              {/* Payment method */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  Método de pago
                </Label>
                <div className="flex gap-2">
                  {(['cash', 'card', 'transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        paymentMethod === m
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                      }`}
                    >
                      {PAYMENT_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash calculator — shown only for cash */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Efectivo recibido
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="$0"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="text-xl font-bold h-12 text-center"
                  />
                  {cashReceived && (
                    <Card
                      className={`px-4 py-2.5 flex items-center justify-between ${
                        vuelto >= 0
                          ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
                          : 'border-red-400 bg-red-50 dark:bg-red-950/30'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {vuelto >= 0 ? 'Vuelto' : 'Falta'}
                      </span>
                      <span
                        className={`text-lg font-bold ${vuelto >= 0 ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {fmt(Math.abs(vuelto))}
                      </span>
                    </Card>
                  )}
                </div>
              )}

              {/* Discount + Surcharge */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                    Descuento %
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    placeholder="0"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                    Recargo %
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    placeholder="0"
                    value={surchargePct}
                    onChange={(e) => setSurchargePct(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Notes toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowNotes((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNotes ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  Notas
                </button>
                {showNotes && (
                  <Textarea
                    className="mt-2 text-sm resize-none h-20"
                    placeholder="Observaciones de la venta..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                )}
              </div>

              {/* Total summary */}
              <Card className="px-4 py-3 bg-muted/40 space-y-1">
                {subtotal > 0 && (discountNum > 0 || surchargeNum > 0) && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                )}
                {discountNum > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento {discountNum}%</span>
                    <span>-{fmt(discountAmount)}</span>
                  </div>
                )}
                {surchargeNum > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Recargo {surchargeNum}%</span>
                    <span>+{fmt(surchargeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-sm font-semibold">{totalLabel}</span>
                  <span className="text-xl font-bold text-primary">{fmt(total)}</span>
                </div>
              </Card>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || cart.length === 0} className="flex-1">
                  {submitting ? 'Registrando...' : 'Registrar venta'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
