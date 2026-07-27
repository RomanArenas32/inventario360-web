'use client';

import { api } from '@/lib/api';
import { Plan } from '@/lib/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Mail, Trash2, PowerOff, Power } from 'lucide-react';
import { PhoneInput, formatPhone, parsePhone, type PhoneValue } from '@/components/ui/phone-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  pendingInvitation: { email: string; expired: boolean } | null;
};

const PLAN_CONFIG: Record<string, { label: string; description: string }> = {
  basic: { label: 'Basic', description: 'Para comenzar' },
  pro: { label: 'Pro', description: 'Funciones avanzadas' },
  enterprise: { label: 'Enterprise', description: 'Sin límites' },
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

const DEFAULT_FORM = {
  businessName: '',
  ownerEmail: '',
  plan: 'basic',
  phone: { countryCode: '+54', number: '' } as PhoneValue,
};

export default function ComerciosPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Tenant | null>(null);
  const [toggling, setToggling] = useState(false);

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
        businessName: form.businessName,
        ownerEmail: form.ownerEmail,
        plan: form.plan,
        phone: formatPhone(form.phone) || undefined,
      });
      setShowCreate(false);
      setForm(DEFAULT_FORM);
      void load();
      toast.success('Comercio creado');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmToggle() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await api.patch(`/admin/tenants/${toggleTarget.id}`, { isActive: !toggleTarget.isActive });
      setToggleTarget(null);
      void load();
      toast.success(toggleTarget.isActive ? 'Comercio desactivado' : 'Comercio reactivado');
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setToggling(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const idToDelete = deleteId;
    setDeleting(true);
    try {
      await api.delete(`/admin/tenants/${idToDelete}`);
      setTenants((prev) => prev.filter((t) => t.id !== idToDelete));
      setDeleteId(null);
      toast.success('Comercio eliminado');
    } catch {
      toast.error('Error al eliminar el comercio');
    } finally {
      setDeleting(false);
    }
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
                    {t.user ? (
                      <>
                        <div>{t.user.name}</div>
                        <div className="text-xs text-muted-foreground">{t.user.email}</div>
                      </>
                    ) : t.pendingInvitation ? (
                      <>
                        <div className="text-xs text-muted-foreground">{t.pendingInvitation.email}</div>
                        <Badge
                          className={
                            t.pendingInvitation.expired
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-0 mt-1'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-0 mt-1'
                          }
                        >
                          {t.pendingInvitation.expired ? 'Invitación expirada' : 'Invitación pendiente'}
                        </Badge>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-foreground/80">
                    {t.businessType
                      ? (BUSINESS_TYPE_LABELS[t.businessType] ?? t.businessType)
                      : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      className={
                        t.plan === Plan.PRO
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-0'
                          : t.plan === Plan.ENTERPRISE
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-0'
                            : 'bg-muted text-muted-foreground border-0'
                      }
                    >
                      {t.plan.charAt(0).toUpperCase() + t.plan.slice(1)}
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
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToggleTarget(t)}
                        className={`h-7 px-2 text-xs font-medium gap-1.5 ${t.isActive ? 'text-muted-foreground hover:text-foreground' : 'text-green-600 hover:text-green-500'}`}
                      >
                        {t.isActive ? <PowerOff size={12} /> : <Power size={12} />}
                        {t.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(t.id)}
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

      {/* Diálogo desactivar / reactivar */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => { if (!open) setToggleTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive ? '¿Desactivar comercio?' : '¿Reactivar comercio?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isActive
                ? `Se suspenderá el acceso a "${toggleTarget.name}". Los usuarios que no pertenezcan a otro negocio activo quedarán desactivados y no podrán iniciar sesión hasta que el comercio sea reactivado.`
                : `Se restaurará el acceso a "${toggleTarget?.name}". Todos los usuarios asociados al comercio podrán volver a iniciar sesión.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmToggle()}
              disabled={toggling}
              className={
                toggleTarget?.isActive
                  ? 'bg-destructive text-white hover:bg-destructive/90 disabled:opacity-60'
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-60'
              }
            >
              {toggling
                ? toggleTarget?.isActive ? 'Desactivando...' : 'Reactivando...'
                : toggleTarget?.isActive ? 'Desactivar' : 'Reactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo eliminar */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comercio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comercio y todos sus datos serán eliminados
              permanentemente. Los usuarios que no pertenezcan a otro negocio quedarán desactivados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-60"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar nuevo comercio</DialogTitle>
            <DialogDescription>
              Completá los datos del negocio. El dueño recibirá un email para activar su cuenta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleCreate(e)} className="space-y-5 pt-1">
            {/* Datos del comercio */}
            <div className="space-y-3">
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Nombre del comercio"
                  className="pl-9"
                />
              </div>
              <PhoneInput
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
            </div>

            {/* Selección de plan */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Plan
              </Label>
              <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Object.values(Plan).length}, 1fr)` }}>
                {Object.values(Plan).map((p) => {
                  const config = PLAN_CONFIG[p] ?? { label: p, description: '' };
                  const selected = form.plan === p;
                  return (
                    <Card
                      key={p}
                      onClick={() => setForm({ ...form, plan: p })}
                      className={`cursor-pointer px-3 py-2.5 transition-all ${
                        selected
                          ? 'border-primary ring-1 ring-primary bg-primary/5'
                          : 'hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
                        {config.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{config.description}</div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Dueño */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Dueño del comercio
                </p>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    required
                    type="email"
                    value={form.ownerEmail}
                    onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
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
                {submitting ? 'Enviando...' : 'Enviar invitación'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
