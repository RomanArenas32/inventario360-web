'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Pencil, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  costPrice: number | null;
  salePrice: number | null;
  stock: number;
  minStock: number;
  isActive: boolean;
  category: Category | null;
};
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
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<Category[]>('/categories'),
      ]);
      setProducts(prods);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      code: p.code,
      description: p.description ?? '',
      costPrice: p.costPrice?.toString() ?? '',
      salePrice: p.salePrice?.toString() ?? '',
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      categoryId: p.category?.id ?? '',
      isActive: p.isActive,
    });
    setError('');
    setShowForm(true);
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
        ...(editing ? {} : { stock: parseInt(form.stock, 10) }),
        minStock: parseInt(form.minStock, 10),
        categoryId: form.categoryId || (editing ? null : undefined),
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/products/${editing.id}`, body);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', body);
        toast.success('Producto creado');
      }
      setShowForm(false);
      void load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Producto eliminado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar el producto';

      toast.error(message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground mt-1">
            {products.length} producto{products.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo producto</Button>
      </div>

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
            No hay productos. Agregá el primero.
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
                          onClick={() => void handleDelete(p.id)}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
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
                  setForm({
                    ...form,
                    categoryId: val === NO_CATEGORY_VALUE ? '' : (val ?? ''),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin categoría">
                    {form.categoryId
                      ? (categories.find((category) => category.id === form.categoryId)?.name ??
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

                {editing ? (
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
                onClick={() => setShowForm(false)}
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
    </div>
  );
}
