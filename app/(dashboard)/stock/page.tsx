'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');

  useEffect(() => {
    setLoading(true);
    void api
      .get<Product[]>('/products')
      .then(setProducts)
      .finally(() => setLoading(false));
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
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
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
    </div>
  );
}
