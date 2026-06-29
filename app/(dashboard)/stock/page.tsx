'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  code: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  category: { id: string; name: string } | null;
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Product[]>('/products');
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = products.filter((p) => {
    if (filter === 'low') return p.stock <= p.minStock;
    if (filter === 'ok') return p.stock > p.minStock;
    return true;
  });

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-gray-500 mt-1">
            {lowCount > 0
              ? `${lowCount} producto${lowCount !== 1 ? 's' : ''} con stock bajo`
              : 'Todo el stock en orden'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'low', 'ok'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'low' ? 'Stock bajo' : 'Stock OK'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay productos en esta vista.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
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
                  <tr key={p.id} className={`border-b border-gray-100 last:border-0 ${isLow ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name ?? '—'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${isLow ? 'text-amber-600' : 'text-gray-800'}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.minStock}</td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
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
