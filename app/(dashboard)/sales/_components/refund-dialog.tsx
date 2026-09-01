'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, AlertTriangle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type SaleItem = {
  id: string;
  productId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  refundedQuantity: number;
  product: { name: string } | null;
};

type SaleDetail = {
  id: string;
  saleNumber: number;
  itemCount: number;
  items: SaleItem[];
};

type Props = {
  saleId: string | null;
  saleNumber: number | null;
  itemCount: number;
  onClose: () => void;
  onDone: () => void;
};

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RefundDialog({ saleId, saleNumber, itemCount, onClose, onDone }: Props) {
  const open = !!saleId;
  const isSimple = itemCount <= 1;

  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // qty[itemId] = quantity to refund
  const [qty, setQty] = useState<Record<string, number>>({});

  // Fetch items when opening a multi-item sale dialog
  useEffect(() => {
    if (!open || isSimple || !saleId) return;
    setDetail(null);
    setQty({});
    setLoading(true);
    void api
      .get<SaleDetail>(`/sales/${saleId}`)
      .then((d) => {
        setDetail(d);
        // Default: all available quantities selected
        const initial: Record<string, number> = {};
        for (const item of d.items) {
          const available = item.quantity - item.refundedQuantity;
          if (available > 0) initial[item.id] = available;
        }
        setQty(initial);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [open, isSimple, saleId]);

  function setItemQty(itemId: string, value: number) {
    setQty((prev) => ({ ...prev, [itemId]: value }));
  }

  const selectedItems = detail?.items.filter((i) => (qty[i.id] ?? 0) > 0) ?? [];
  const refundTotal = selectedItems.reduce(
    (sum, i) => sum + (qty[i.id] ?? 0) * Number(i.unitPrice),
    0,
  );
  const allSelected =
    detail?.items.every((i) => {
      const available = i.quantity - i.refundedQuantity;
      return available === 0 || (qty[i.id] ?? 0) === available;
    }) ?? false;

  async function handleSimpleRefund() {
    if (!saleId) return;
    setSubmitting(true);
    try {
      await api.post(`/sales/${saleId}/refund`, {});
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePartialRefund() {
    if (!saleId || selectedItems.length === 0) return;
    setSubmitting(true);
    try {
      if (allSelected) {
        await api.post(`/sales/${saleId}/refund`, {});
      } else {
        const items = selectedItems.map((i) => ({ saleItemId: i.id, quantity: qty[i.id] ?? 0 }));
        await api.post(`/sales/${saleId}/partial-refund`, { items });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  // ── Simple: 1-item sale ───────────────────────────────────────────────────

  if (isSimple) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reembolsar venta #{saleNumber}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se marcará la venta como reembolsada y se restaurará el stock de los productos. Esta
            acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleSimpleRefund()}
              disabled={submitting}
            >
              {submitting ? 'Reembolsando...' : 'Reembolsar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Multi-item: partial refund ────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reembolsar venta #{saleNumber}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Elegí cuántas unidades reembolsar por cada ítem.
        </p>

        {loading ? (
          <div className="space-y-2 animate-pulse py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto py-1">
            {detail?.items.map((item) => {
              const available = item.quantity - item.refundedQuantity;
              const label = item.product?.name ?? item.description ?? 'Ítem';
              const current = qty[item.id] ?? 0;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                    available === 0 ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(Number(item.unitPrice))} c/u
                      {item.refundedQuantity > 0 && (
                        <span className="ml-1 text-amber-600">
                          · {item.refundedQuantity} ya reembolsado
                        </span>
                      )}
                    </p>
                  </div>

                  {available === 0 ? (
                    <span className="text-xs text-muted-foreground shrink-0">Reembolsado</span>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setItemQty(item.id, Math.max(0, current - 1))}
                        disabled={current === 0}
                        className="w-8 h-8 rounded-lg flex items-center justify-center border hover:bg-accent transition-colors disabled:opacity-30"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {current}
                        <span className="text-muted-foreground font-normal">/{available}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setItemQty(item.id, Math.min(available, current + 1))}
                        disabled={current === available}
                        className="w-8 h-8 rounded-lg flex items-center justify-center border hover:bg-accent transition-colors disabled:opacity-30"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && selectedItems.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              {selectedItems.reduce((s, i) => s + (qty[i.id] ?? 0), 0)} unidad
              {selectedItems.reduce((s, i) => s + (qty[i.id] ?? 0), 0) !== 1 ? 'es' : ''} ·{' '}
              {allSelected ? 'Reembolso total' : 'Reembolso parcial'}
            </span>
            <span className="font-semibold">{fmt(refundTotal)}</span>
          </div>
        )}

        {!loading && selectedItems.length === 0 && !loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
            Seleccioná al menos 1 unidad para reembolsar.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={submitting || loading || selectedItems.length === 0}
            onClick={() => void handlePartialRefund()}
          >
            {submitting
              ? 'Reembolsando...'
              : allSelected
                ? 'Reembolsar todo'
                : 'Reembolsar seleccionados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
