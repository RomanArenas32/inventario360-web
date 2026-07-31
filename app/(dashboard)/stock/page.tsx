'use client';

import { api } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Product = {
  id: string;
  name: string;
  code: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  category: { id: string; name: string } | null;
};

type MovementType = 'entry' | 'exit' | 'adjustment';

type MovementForm = {
  productId: string;
  type: MovementType;
  quantity: string;
  reason: string;
};

type StockMovement = {
  id: string;
  type: MovementType;
  quantity: number;
  reason: string;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  user: {
    id: string;
    name: string;
  };
};

type StockMovementPage = {
  data: StockMovement[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

const EMPTY_MOVEMENT: MovementForm = {
  productId: '',
  type: 'entry',
  quantity: '1',
  reason: '',
};

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  entry: 'Entrada — suma stock',
  exit: 'Salida — resta stock',
  adjustment: 'Ajuste — establece el stock real',
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
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementForm, setMovementForm] = useState<MovementForm>(EMPTY_MOVEMENT);
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [movementError, setMovementError] = useState('');
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

  useEffect(() => {
    setLoading(true);
    void api
      .get<Product[]>('/products')
      .then(setProducts)
      .finally(() => setLoading(false));

    void loadMovements();
  }, [loadMovements]);

  function openMovementForm(productId = '') {
    setMovementForm({
      ...EMPTY_MOVEMENT,
      productId,
    });
    setMovementError('');
    setShowMovementForm(true);
  }

  async function handleMovementSubmit(e: React.FormEvent) {
    e.preventDefault();

    const quantity = Number(movementForm.quantity);
    const reason = movementForm.reason.trim();

    if (!movementForm.productId) {
      setMovementError('Seleccioná un producto');
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      setMovementError('La cantidad debe ser un número entero válido');
      return;
    }

    if (movementForm.type !== 'adjustment' && quantity < 1) {
      setMovementError('La cantidad debe ser mayor que cero');
      return;
    }

    if (!reason) {
      setMovementError('El motivo es obligatorio');
      return;
    }

    setSubmittingMovement(true);
    setMovementError('');

    try {
      const movement = await api.post<{
        productId: string;
        stockAfter: number;
      }>('/stock-movements', {
        productId: movementForm.productId,
        type: movementForm.type,
        quantity,
        reason,
      });

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === movement.productId ? { ...product, stock: movement.stockAfter } : product,
        ),
      );

      toast.success('Movimiento registrado');
      setShowMovementForm(false);
      setMovementForm(EMPTY_MOVEMENT);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo registrar el movimiento';

      setMovementError(message);
      toast.error(message);
    } finally {
      setSubmittingMovement(false);
    }
  }

  const filtered = products.filter((p) => {
    if (filter === 'low') return p.stock <= p.minStock;
    if (filter === 'ok') return p.stock > p.minStock;
    return true;
  });

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;
  const selectedProduct = products.find((product) => product.id === movementForm.productId);

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'low', label: 'Stock bajo' },
    { key: 'ok', label: 'Stock OK' },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock</h1>
          <p className="mt-1 text-muted-foreground">
            {lowCount > 0
              ? `${lowCount} producto${lowCount !== 1 ? 's' : ''} con stock bajo`
              : 'Todo el stock en orden'}
          </p>
        </div>

        <Button
          onClick={() => openMovementForm()}
          disabled={!products.some((product) => product.isActive)}
        >
          + Registrar movimiento
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {filterBtns.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? 'default' : 'outline'}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="p-0 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton
            cols={5}
            headers={['Producto', 'Código', 'Categoría', 'Stock', 'Estado']}
          />
        ) : filtered.length === 0 ? (
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
              {filtered.map((p) => {
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
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(movement.createdAt).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <div className="font-medium">{movement.product.name}</div>
                      <div className="text-xs text-muted-foreground">{movement.product.code}</div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <Badge
                        className={
                          movement.type === 'entry'
                            ? 'border-0 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                            : movement.type === 'exit'
                              ? 'border-0 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : 'border-0 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                        }
                      >
                        {MOVEMENT_HISTORY_LABELS[movement.type]}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right font-medium">
                      {movement.type === 'entry'
                        ? `+${movement.quantity}`
                        : movement.type === 'exit'
                          ? `-${movement.quantity}`
                          : movement.quantity}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-4 py-3 text-right">
                      {movement.stockBefore} → {movement.stockAfter}
                    </TableCell>

                    <TableCell className="max-w-64 px-4 py-3 text-muted-foreground">
                      {movement.reason}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-4 py-3">
                      {movement.user.name}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog
        open={showMovementForm}
        onOpenChange={(open) => {
          setShowMovementForm(open);

          if (!open) {
            setMovementError('');
            setMovementForm(EMPTY_MOVEMENT);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
          </DialogHeader>

          <form onSubmit={(event) => void handleMovementSubmit(event)} className="space-y-4">
            <div>
              <Label className="mb-1.5 text-sm font-medium">Producto *</Label>
              <Select
                value={movementForm.productId}
                onValueChange={(value) =>
                  setMovementForm({
                    ...movementForm,
                    productId: value ?? '',
                  })
                }
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
                    .filter((product) => product.isActive)
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} — {product.code}
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
                value={movementForm.type}
                onValueChange={(value) => {
                  if (value) {
                    setMovementForm({
                      ...movementForm,
                      type: value as MovementType,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{MOVEMENT_TYPE_LABELS[movementForm.type]}</SelectValue>
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
                {movementForm.type === 'adjustment' ? 'Stock contado *' : 'Cantidad *'}
              </Label>
              <Input
                required
                type="number"
                min={movementForm.type === 'adjustment' ? 0 : 1}
                step="1"
                value={movementForm.quantity}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    quantity: event.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label className="mb-1.5 text-sm font-medium">Motivo *</Label>
              <Textarea
                required
                maxLength={255}
                value={movementForm.reason}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    reason: event.target.value,
                  })
                }
                placeholder="Ej: Compra al proveedor, venta, uso interno o conteo físico"
              />
            </div>

            {movementError && <p className="text-sm text-destructive">{movementError}</p>}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMovementForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submittingMovement} className="flex-1">
                {submittingMovement ? 'Guardando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
