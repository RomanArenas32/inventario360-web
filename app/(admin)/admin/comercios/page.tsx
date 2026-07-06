'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Tenant = {
  id: string;
  name: string;
  phone: string | null;
  businessType: string | null;
  plan: string;
  isActive: boolean;
  isOnboarded: boolean;
  user?: { name: string; email: string };
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  almacen: 'Almacén',
  kiosco: 'Kiosco',
  ferreteria: 'Ferretería',
  barberia: 'Barbería',
  restaurante: 'Restaurante',
  tienda_ropa: 'Tienda de ropa',
  tienda_electronica: 'Electrónica',
};

const BUSINESS_TYPES = [
  { value: 'almacen', label: 'Almacén / Minimercado' },
  { value: 'kiosco', label: 'Kiosco' },
  { value: 'ferreteria', label: 'Ferretería' },
  { value: 'barberia', label: 'Barbería / Estética' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'tienda_ropa', label: 'Tienda de ropa' },
  { value: 'tienda_electronica', label: 'Electrónica' },
];

const DEFAULT_FORM = {
  businessName: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  businessType: '',
  plan: 'basic',
  phone: '',
};

export default function ComerciosPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Tenant[]>('/admin/tenants');
      setTenants(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/admin/tenants', {
        ...form,
        businessType: form.businessType || undefined,
      });
      setShowCreate(false);
      setForm(DEFAULT_FORM);
      void load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(tenant: Tenant) {
    await api.patch(`/admin/tenants/${tenant.id}`, { isActive: !tenant.isActive });
    void load();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este comercio? Esta acción no se puede deshacer.')) return;
    await api.delete(`/admin/tenants/${id}`);
    void load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comercios</h1>
          <p className="text-muted-foreground mt-1">Gestión de clientes de la plataforma</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Nuevo comercio</Button>
      </div>

      <Card className="p-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No hay comercios registrados. Creá el primero.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
                <TableHead className="px-4 py-3 text-muted-foreground">Comercio</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Dueño</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Rubro</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Plan</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Estado</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="px-4 py-3 text-foreground font-medium">
                    {t.name}
                    {t.phone && (
                      <div className="text-xs text-muted-foreground font-normal">{t.phone}</div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-foreground/80">
                    <div>{t.user?.name}</div>
                    <div className="text-xs text-muted-foreground">{t.user?.email}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-foreground/80">
                    {t.businessType
                      ? (BUSINESS_TYPE_LABELS[t.businessType] ?? t.businessType)
                      : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      className={
                        t.plan === 'pro'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-0'
                          : 'bg-muted text-muted-foreground border-0'
                      }
                    >
                      {t.plan === 'pro' ? 'Pro' : 'Basic'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      className={
                        t.isActive
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-0'
                          : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-0'
                      }
                    >
                      {t.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleToggleActive(t)}
                      className="h-auto p-0 text-xs hover:bg-transparent"
                    >
                      {t.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(t.id)}
                      className="h-auto p-0 text-xs text-destructive hover:opacity-80 hover:bg-transparent"
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setForm(DEFAULT_FORM);
            setError('');
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo comercio</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Nombre del comercio *</Label>
              <Input
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Ej: Almacén Don Juan"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Rubro</Label>
                <Select
                  value={form.businessType || undefined}
                  onValueChange={(val) => setForm({ ...form, businessType: val ?? '' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin definir" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value}>
                        {bt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Plan</Label>
                <Select
                  value={form.plan}
                  onValueChange={(val) => setForm({ ...form, plan: val ?? 'basic' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1">Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ej: 2366-123456"
              />
            </div>

            <hr className="border-border" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Datos del dueño
            </p>

            <div>
              <Label className="text-xs text-muted-foreground mb-1">Nombre completo *</Label>
              <Input
                required
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="Nombre y apellido"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1">Email *</Label>
              <Input
                required
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1">Contraseña *</Label>
              <Input
                required
                minLength={6}
                type="password"
                value={form.ownerPassword}
                onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setForm(DEFAULT_FORM);
                  setError('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Creando...' : 'Crear comercio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
