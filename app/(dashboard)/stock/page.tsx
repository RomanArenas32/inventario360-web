'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

type Product = {
  id: string; name: string; code: string;
  stock: number; minStock: number; isActive: boolean;
  category: { id: string; name: string } | null;
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');

  useEffect(() => {
    setLoading(true);
    void api.get<Product[]>('/products').then(setProducts).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (filter === 'low') return p.stock <= p.minStock;
    if (filter === 'ok') return p.stock > p.minStock;
    return true;
  });

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'low', label: 'Stock bajo' },
    { key: 'ok', label: 'Stock OK' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Stock</h1>
        <p className="text-muted-foreground mt-1">
          {lowCount > 0
            ? `${lowCount} producto${lowCount !== 1 ? 's' : ''} con stock bajo`
            : 'Todo el stock en orden'}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {filterBtns.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              filter === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No hay productos en esta vista.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Categoría</th>
                <th className="text-right px-4 py-3">Stock actual</th>
                <th className="text-right px-4 py-3">Stock mínimo</th>
                <th className="text-left px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className={`border-b border-border last:border-0 transition-colors ${isLow ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-muted/40'}`}>
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${isLow ? 'text-amber-500' : 'text-foreground'}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.minStock}</td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
