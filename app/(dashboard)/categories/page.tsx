'use client';

import { api } from '@/lib/api';
import type { Category } from '@/lib/client';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Pencil, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
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
import { CategoryFormDialog } from './_components/category-form-dialog';
import { DeleteCategoryDialog } from './_components/delete-category-dialog';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [descFilter, setDescFilter] = useState<'all' | 'with' | 'without'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (descFilter !== 'all') params.set('hasDescription', String(descFilter === 'with'));
      const qs = params.toString();
      const data = await api.get<Category[]>(`/categories${qs ? `?${qs}` : ''}`);
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, [search, descFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="Categorías"
        description="Organizá tus productos por categoría"
        action={<Button onClick={openCreate}>+ Nueva categoría</Button>}
      />

      <div
        className={`flex flex-col gap-2 sm:flex-row sm:items-center ${descFilter !== 'all' ? 'mb-2' : 'mb-4'}`}
      >
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar categoría..."
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
              descFilter !== 'all' && 'border-primary text-primary',
            )}
          >
            <SlidersHorizontal size={13} />
            Filtrar
            {descFilter !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuRadioGroup
              value={descFilter}
              onValueChange={(v) => setDescFilter(v as typeof descFilter)}
            >
              <DropdownMenuLabel>Descripción</DropdownMenuLabel>
              <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="with">Con descripción</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="without">Sin descripción</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {descFilter !== 'all' && (
        <div className="flex items-center gap-1.5 mb-4">
          <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-normal">
            {descFilter === 'with' ? 'Con descripción' : 'Sin descripción'}
            <button
              onClick={() => setDescFilter('all')}
              className="rounded-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={11} />
            </button>
          </Badge>
          <button
            onClick={() => setDescFilter('all')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Limpiar
          </button>
        </div>
      )}

      <Card className="p-0 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton cols={3} headers={['Nombre', 'Descripción', 'Acciones']} />
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {search || descFilter !== 'all'
              ? 'No se encontraron categorías con ese criterio.'
              : 'No hay categorías. Creá la primera.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
                <TableHead className="px-4 py-3 text-muted-foreground">Nombre</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Descripción</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="px-4 py-3 font-medium text-foreground">
                    {cat.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {cat.description ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(cat)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(cat)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CategoryFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        category={editing}
        onSuccess={() => void load()}
      />

      <DeleteCategoryDialog
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={(id) => setCategories((prev) => prev.filter((c) => c.id !== id))}
      />
    </div>
  );
}
