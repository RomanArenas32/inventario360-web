'use client';

import { api } from '@/lib/api';
import type { Sale } from '@/lib/client';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PageHeader } from '@/components/shared/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, TrendingUp, ShoppingBag, Banknote, Receipt } from 'lucide-react';
import { NewSaleDialog } from './_components/new-sale-dialog';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleWithSurcharge = Sale & { surcharge?: number };

type SaleSummary = {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
};

type PaymentFilter = 'all' | 'cash' | 'card' | 'transfer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

const PAYMENT_COLORS: Record<string, string> = {
  cash: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-0',
  card: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-0',
  transfer: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-0',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [sales, setSales] = useState<SaleWithSurcharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SaleSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentFilter !== 'all') params.set('paymentMethod', paymentFilter);
      const qs = params.toString();
      const [salesData, summaryData] = await Promise.all([
        api.get<SaleWithSurcharge[]>(`/sales${qs ? `?${qs}` : ''}`),
        api.get<SaleSummary>('/sales/summary?period=month').catch(() => null),
      ]);
      setSales(salesData);
      if (summaryData) setSummary(summaryData);
    } finally {
      setLoading(false);
    }
  }, [paymentFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRefund(sale: SaleWithSurcharge) {
    if (!confirm(`¿Reembolsar la venta #${sale.saleNumber}? Se restaurará el stock.`)) return;
    setRefundingId(sale.id);
    try {
      await api.post(`/sales/${sale.id}/refund`, {});
      toast.success(`Venta #${sale.saleNumber} reembolsada`);
      void load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reembolsar';
      toast.error(msg);
    } finally {
      setRefundingId(null);
    }
  }

  const hasFilters = paymentFilter !== 'all';

  const statsCards = [
    {
      label: 'Ventas este mes',
      value: summary ? String(summary.totalSales) : '—',
      icon: ShoppingBag,
      iconBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-500',
      color: 'text-blue-500',
    },
    {
      label: 'Ingresos este mes',
      value: summary ? fmt(summary.totalRevenue) : '—',
      icon: Banknote,
      iconBg: 'bg-green-50 dark:bg-green-950/50 text-green-500',
      color: 'text-green-500',
    },
    {
      label: 'Ganancia este mes',
      value: summary ? fmt(summary.totalProfit) : '—',
      icon: TrendingUp,
      iconBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-500',
      color: 'text-purple-500',
    },
  ];

  return (
    <div>
      <PageHeader title="Ventas" description="Registrá y consultá tus ventas." />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                <stat.icon size={18} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {sales.length} venta{sales.length !== 1 ? 's' : ''}
            {hasFilters ? ' encontrada' + (sales.length !== 1 ? 's' : '') : ' en total'}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5',
                hasFilters && 'border-primary text-primary',
              )}
            >
              <SlidersHorizontal size={13} />
              Filtrar
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44">
              <DropdownMenuRadioGroup
                value={paymentFilter}
                onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}
              >
                <DropdownMenuLabel>Método de pago</DropdownMenuLabel>
                <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cash">Efectivo</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="card">Tarjeta</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="transfer">Transferencia</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={() => setShowNew(true)}>+ Nueva venta</Button>
      </div>

      {/* Table */}
      <Card className="p-0 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton
            cols={7}
            headers={['#', 'Fecha', 'Ítems', 'Pago', 'Total', 'Estado', 'Acciones']}
          />
        ) : sales.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {hasFilters
              ? 'No se encontraron ventas con ese criterio.'
              : 'No hay ventas registradas. Registrá la primera.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
                <TableHead className="px-4 py-3 text-muted-foreground">#</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Fecha</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Ítems</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Pago</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Descuento
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Recargo
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">Total</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Estado</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    #{sale.saleNumber}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(sale.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {sale.itemCount} ítem{sale.itemCount !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={PAYMENT_COLORS[sale.paymentMethod] ?? ''}>
                      {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm text-green-600">
                    {Number(sale.discount) > 0 ? `-${fmt(Number(sale.discount))}` : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm text-amber-600">
                    {Number(sale.surcharge ?? 0) > 0 ? `+${fmt(Number(sale.surcharge))}` : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-semibold">
                    {fmt(Number(sale.total))}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {sale.refundedAt ? (
                      <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-0 gap-1">
                        <Receipt size={11} />
                        Reembolsada
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-0">
                        Completada
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    {!sale.refundedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleRefund(sale)}
                        disabled={refundingId === sale.id}
                        className="h-7 px-2 text-muted-foreground hover:text-destructive text-xs"
                        title="Reembolsar"
                      >
                        <Receipt size={13} className="mr-1" />
                        {refundingId === sale.id ? 'Reembolsando...' : 'Reembolsar'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <NewSaleDialog open={showNew} onOpenChange={setShowNew} onSuccess={() => void load()} />
    </div>
  );
}
