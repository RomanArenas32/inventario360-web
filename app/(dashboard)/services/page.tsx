'use client';

import { api } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Pencil, Trash2, Clock, Scissors, DollarSign } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
  isActive: boolean;
};

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  description: string;
  price: string;
  duration: string;
  isActive: boolean;
};

const EMPTY: FormState = { name: '', description: '', price: '', duration: '', isActive: true };

const NO_SPIN =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

function getInitial(s: Service | null): FormState {
  if (!s) return EMPTY;
  return {
    name: s.name,
    description: s.description ?? '',
    price: s.price.toString(),
    duration: s.duration?.toString() ?? '',
    isActive: s.isActive,
  };
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-border">
      <Icon size={13} className="text-muted-foreground" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: Service | null;
  onSuccess: () => void;
}) {
  const isEdit = !!service;
  const [form, setForm] = useState<FormState>(() => getInitial(service));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Persistence: only re-initialize when target service changes identity
  const lastInitKey = useRef<string>('');

  useEffect(() => {
    if (!open) return;
    const key = service ? `edit:${service.id}` : 'new';
    if (key === 'new' && lastInitKey.current === 'new') return;
    lastInitKey.current = key;
    setForm(getInitial(service));
    setError('');
  }, [open, service]);

  function handleCancel() {
    lastInitKey.current = '';
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price) || 0,
        duration: form.duration ? parseInt(form.duration, 10) : undefined,
        isActive: form.isActive,
      };
      if (isEdit) {
        await api.patch(`/services/${service.id}`, body);
        toast.success('Servicio actualizado');
      } else {
        await api.post('/services', body);
        toast.success('Servicio creado');
        lastInitKey.current = '';
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Scissors size={16} className="text-muted-foreground" />
            {isEdit ? `Editar — ${service.name}` : 'Nuevo servicio'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="px-6 py-5 space-y-6 max-h-[65vh] overflow-y-auto">
            {/* ── Información ─────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionLabel icon={Scissors}>Información</SectionLabel>

              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Corte de cabello"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descripción</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Opcional"
                  className="resize-none h-20 text-sm"
                />
              </div>
            </div>

            {/* ── Precio y duración ────────────────────────────────── */}
            <div className="space-y-4">
              <SectionLabel icon={DollarSign}>Precio y duración</SectionLabel>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Precio *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0"
                      className={`pl-7 ${NO_SPIN}`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Clock size={11} />
                    Duración (min)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="Ej: 30"
                    className={NO_SPIN}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="svcActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="svcActive" className="text-sm font-normal cursor-pointer">
                  Servicio activo
                </Label>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Service[]>('/services');
      setServices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(service: Service) {
    setDeleting(true);
    try {
      await api.delete(`/services/${service.id}`);
      toast.success('Servicio eliminado');
      setDeleteTarget(null);
      void load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Servicios" description="Gestioná el catálogo de servicios." />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {services.length} servicio{services.length !== 1 ? 's' : ''} en total
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nuevo servicio
        </Button>
      </div>

      <Card className="p-0 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton
            cols={5}
            headers={['Nombre', 'Descripción', 'Duración', 'Precio', 'Estado']}
          />
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No hay servicios. Agregá el primero.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
                <TableHead className="px-4 py-3 text-muted-foreground">Nombre</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Descripción</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Duración</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">Precio</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Estado</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="px-4 py-3 font-medium">{s.name}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground text-sm max-w-xs truncate">
                    {s.description ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {s.duration ? (
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {s.duration} min
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-semibold">
                    {fmt(Number(s.price))}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      className={
                        s.isActive
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-0'
                          : 'bg-muted text-muted-foreground border-0'
                      }
                    >
                      {s.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(s);
                          setShowForm(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(s)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

      <ServiceFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        service={editing}
        onSuccess={() => void load()}
      />

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar servicio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
              className="flex-1"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
