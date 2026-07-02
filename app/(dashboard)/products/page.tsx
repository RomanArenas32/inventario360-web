'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  code: string;
  costPrice: number | null;
  salePrice: number | null;
  stock: number;
  minStock: number;
  isActive: boolean;
  category: Category | null;
};
type FormState = {
  name: string; code: string; description: string;
  costPrice: string; salePrice: string;
  stock: string; minStock: string;
  categoryId: string; isActive: boolean;
};
const EMPTY: FormState = {
  name: '', code: '', description: '',
  costPrice: '', salePrice: '',
  stock: '0', minStock: '0',
  categoryId: '', isActive: true,
};

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

  useEffect(() => { void load(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true); }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, code: p.code, description: '',
      costPrice: p.costPrice?.toString() ?? '',
      salePrice: p.salePrice?.toString() ?? '',
      stock: p.stock.toString(), minStock: p.minStock.toString(),
      categoryId: p.category?.id ?? '', isActive: p.isActive,
    });
    setError(''); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = {
        name: form.name, code: form.code,
        description: form.description || undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        stock: parseInt(form.stock, 10), minStock: parseInt(form.minStock, 10),
        categoryId: form.categoryId || undefined, isActive: form.isActive,
      };
      if (editing) { await api.patch(`/products/${editing.id}`, body); }
      else { await api.post('/products', body); }
      setShowForm(false);
      void load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    await api.delete(`/products/${id}`);
    void load();
  }

  const inputCls = 'w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground mt-1">{products.length} producto{products.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button onClick={openCreate} className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          + Nuevo producto
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No hay productos. Agregá el primero.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Categoría</th>
                <th className="text-right px-4 py-3">Costo</th>
                <th className="text-right px-4 py-3">Venta</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const lowStock = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground/80 text-right">{formatPrice(p.costPrice)}</td>
                    <td className="px-4 py-3 text-foreground font-medium text-right">{formatPrice(p.salePrice)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${lowStock ? 'text-amber-500' : 'text-foreground'}`}>
                      {p.stock}{lowStock && <span className="ml-1 text-xs">⚠</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => openEdit(p)} className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Editar</button>
                      <button onClick={() => void handleDelete(p.id)} className="text-xs text-destructive hover:opacity-80 transition-opacity">Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Nombre del producto" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Código *</label>
                  <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={`${inputCls} font-mono`} placeholder="Ej: 7790001" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Descripción</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Opcional" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Precio de costo</label>
                  <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Precio de venta</label>
                  <input type="number" min="0" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className={inputCls} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Stock actual</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Stock mínimo</label>
                  <input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border" />
                <label htmlFor="isActive" className="text-sm text-foreground">Producto activo</label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-border text-muted-foreground text-sm font-medium py-2 rounded-lg hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
