'use client';

import { api } from '@/lib/api';
import type { Product, StockMovement } from '@/lib/client';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PageHeader } from '@/components/shared/page-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StockMovementDialog } from './_components/stock-movement-dialog';

type MovementType = StockMovement['type'];

type StockMovementPage = {
  data: StockMovement[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

const MOVEMENT_HISTORY_LABELS: Record<MovementType, string> = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment: 'Ajuste',
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [search, setSearch] = useState('');
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [movementTotal, setMovementTotal] = useState(0);

  const loadMovements = useCallback(async () => {
    setLoadingMovements(true);
    try {
      const page = await api.get<StockMovementPage>('/stock-movements?limit=20&offset=0');
      setMovements(page.data);
      setMovementTotal(page.total);
    } catch {
      setMovements([]);
      setMovementTotal(0);
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filter !== 'all') params.set('stock', filter);
      const qs = params.toString();
      const prods = await api.get<Product[]>(`/products${qs ? `?${qs}` : ''}`);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    void loadProducts();
    void loadMovements();
  }, [loadProducts, loadMovements]);

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;
  const hasFilters = filter !== 'all';

  const FILTER_LABELS: Record<typeof filter, string> = {
    all: 'Todos',
    low: 'Stock bajo',
    ok: 'Stock OK',
  };

  return (
    <div>
      <PageHeader
        title="Stock"
        description={
          lowCount > 0
            ? `${lowCount} producto${lowCount !== 1 ? 's' : ''} con stock bajo`
            : 'Todo el stock en orden'
        }
        action={
          <Button
            onClick={() => setShowMovementForm(true)}
            disabled={!products.some((p) => p.isActive)}
          >
            + Registrar movimiento
          </Button>
        }
      />

      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
            >
              <DropdownMenuLabel>Estado de stock</DropdownMenuLabel>
              <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="low">Stock bajo</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="ok">Stock OK</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-normal">
            {FILTER_LABELS[filter]}
            <button
              onClick={() => setFilter('all')}
              className="rounded-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={11} />
            </button>
          </Badge>
          <button
            onClick={() => setFilter('all')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Limpiar
          </button>
        </div>
      )}

      <Card className="p-0 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton
            cols={5}
            headers={['Producto', 'Código', 'Categoría', 'Stock', 'Estado']}
          />
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No hay productos en esta vista.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
                <TableHead className="px-4 py-3 text-muted-foreground">Producto</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Código</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Categoría</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Stock actual
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Stock mínimo
                </TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const isLow = p.stock <= p.minStock;
                return (
                  <TableRow
                    key={p.id}
                    className={
                      isLow
                        ? 'bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                        : ''
                    }
                  >
                    <TableCell className="px-4 py-3 font-medium text-foreground">
                      {p.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {p.code}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {p.category?.name ?? '—'}
                    </TableCell>
                    <TableCell
                      className={`px-4 py-3 text-right font-bold ${isLow ? 'text-amber-500' : 'text-foreground'}`}
                    >
                      {p.stock}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-muted-foreground">
                      {p.minStock}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {isLow ? (
                        <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-0">
                          Stock bajo
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-0">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="mb-4 mt-8 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Historial de movimientos</h2>
          <p className="text-sm text-muted-foreground">Últimos movimientos registrados</p>
        </div>
        <span className="text-sm text-muted-foreground">{movementTotal} en total</span>
      </div>

      <Card className="overflow-hidden p-0 shadow-sm">
        {loadingMovements ? (
          <TableSkeleton
            cols={7}
            headers={['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock', 'Motivo', 'Usuario']}
          />
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Todavía no hay movimientos de stock.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
                  <TableHead className="whitespace-nowrap px-4 py-3">Fecha</TableHead>
                  <TableHead className="px-4 py-3">Producto</TableHead>
                  <TableHead className="px-4 py-3">Tipo</TableHead>
                  <TableHead className="px-4 py-3 text-right">Cantidad</TableHead>
                  <TableHead className="whitespace-nowrap px-4 py-3 text-right">Stock</TableHead>
                  <TableHead className="px-4 py-3">Motivo</TableHead>
                  <TableHead className="px-4 py-3">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium">{m.product.name}</div>
                      <div className="text-xs text-muted-foreground">{m.product.code}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={
                          m.type === 'entry'
                            ? 'border-0 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                            : m.type === 'exit'
                              ? 'border-0 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : 'border-0 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                        }
                      >
                        {MOVEMENT_HISTORY_LABELS[m.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-medium">
                      {m.type === 'entry'
                        ? `+${m.quantity}`
                        : m.type === 'exit'
                          ? `-${m.quantity}`
                          : m.quantity}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right">
                      {m.stockBefore} → {m.stockAfter}
                    </TableCell>
                    <TableCell className="max-w-64 px-4 py-3 text-muted-foreground">
                      {m.reason}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3">{m.user.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <StockMovementDialog
        open={showMovementForm}
        onOpenChange={setShowMovementForm}
        products={products}
        onSuccess={() => {
          void loadProducts();
          void loadMovements();
        }}
      />
    </div>
  );
}
