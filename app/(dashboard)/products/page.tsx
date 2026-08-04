'use client';

import { api } from '@/lib/api';
import type { Category, Product } from '@/lib/client';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Pencil, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductFormDialog } from './_components/product-form-dialog';
import { DeleteProductDialog } from './_components/delete-product-dialog';

function formatPrice(value: number | null) {
  if (value == null) return '—';
  return `$${value.toLocaleString('es-AR')}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (statusFilter !== 'all') params.set('isActive', String(statusFilter === 'active'));
      if (stockFilter !== 'all') params.set('stock', stockFilter);
      const qs = params.toString();

      const [prods, cats] = await Promise.all([
        api.get<Product[]>(`/products${qs ? `?${qs}` : ''}`),
        api.get<Category[]>('/categories'),
      ]);
      setProducts(prods);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, stockFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setShowForm(true);
  }

  const hasFilters = !!categoryFilter || statusFilter !== 'all' || stockFilter !== 'all';
  const hasActiveFilters = !!search || hasFilters;

  const chips = [
    ...(categoryFilter
      ? [
          {
            key: 'cat',
            label: categories.find((c) => c.id === categoryFilter)?.name ?? 'Categoría',
            onRemove: () => setCategoryFilter(''),
          },
        ]
      : []),
    ...(statusFilter !== 'all'
      ? [
          {
            key: 'status',
            label: statusFilter === 'active' ? 'Activo' : 'Inactivo',
            onRemove: () => setStatusFilter('all'),
          },
        ]
      : []),
    ...(stockFilter !== 'all'
      ? [
          {
            key: 'stock',
            label: stockFilter === 'low' ? 'Stock bajo' : 'Stock OK',
            onRemove: () => setStockFilter('all'),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Productos"
        description={`${products.length} producto${products.length !== 1 ? 's' : ''}${hasActiveFilters ? ' encontrado' + (products.length !== 1 ? 's' : '') : ' en total'}`}
        action={<Button onClick={openCreate}>+ Nuevo producto</Button>}
      />

      <div
        className={`flex flex-col gap-2 sm:flex-row sm:items-center ${chips.length > 0 ? 'mb-2' : 'mb-4'}`}
      >
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
          <DropdownMenuContent className="w-48">
            {categories.length > 0 && (
              <>
                <DropdownMenuRadioGroup value={categoryFilter} onValueChange={setCategoryFilter}>
                  <DropdownMenuLabel>Categoría</DropdownMenuLabel>
                  <DropdownMenuRadioItem value="">Todas</DropdownMenuRadioItem>
                  {categories.map((cat) => (
                    <DropdownMenuRadioItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <DropdownMenuLabel>Estado</DropdownMenuLabel>
              <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="active">Activo</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="inactive">Inactivo</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={stockFilter}
              onValueChange={(v) => setStockFilter(v as typeof stockFilter)}
            >
              <DropdownMenuLabel>Stock</DropdownMenuLabel>
              <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="low">Stock bajo</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="ok">Stock OK</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {chips.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-normal"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="rounded-sm opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
            </Badge>
          ))}
          <button
            onClick={() => {
              setCategoryFilter('');
              setStatusFilter('all');
              setStockFilter('all');
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Limpiar todo
          </button>
        </div>
      )}

      <Card className="p-0 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton
            cols={8}
            headers={[
              'Nombre',
              'Código',
              'Categoría',
              'P. Costo',
              'P. Venta',
              'Stock',
              'Estado',
              'Acciones',
            ]}
          />
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {hasActiveFilters
              ? 'No se encontraron productos con ese criterio.'
              : 'No hay productos. Agregá el primero.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
                <TableHead className="px-4 py-3 text-muted-foreground">Producto</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Código</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Categoría</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">Costo</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">Venta</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">Stock</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Estado</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const lowStock = p.stock <= p.minStock;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">
                      {p.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {p.code}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {p.category?.name ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-foreground/80 text-right">
                      {formatPrice(p.costPrice)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-foreground font-medium text-right">
                      {formatPrice(p.salePrice)}
                    </TableCell>
                    <TableCell
                      className={`px-4 py-3 text-right font-medium ${lowStock ? 'text-amber-500' : 'text-foreground'}`}
                    >
                      {p.stock}
                      {lowStock && <span className="ml-1 text-xs">⚠</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={
                          p.isActive
                            ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-0'
                            : 'bg-muted text-muted-foreground border-0'
                        }
                      >
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <ProductFormDialog
        key={editing?.id ?? 'new-product'}
        open={showForm}
        onOpenChange={setShowForm}
        product={editing}
        categories={categories}
        onSuccess={() => void load()}
      />

      <DeleteProductDialog
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
      />
    </div>
  );
}
