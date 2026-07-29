'use client';

import { api } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Clock, Mail, Pencil, Trash2, UserPlus, Users } from 'lucide-react';

type Member = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
  isActive: boolean;
  joinedAt: string;
};

type PendingInvitation = {
  invitationId: string;
  email: string;
  name: string;
  role: 'owner' | 'staff';
  sentAt: string;
  expiresAt: string;
};

type FormState = { email: string; name: string };
const EMPTY: FormState = { email: '', name: '' };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const AVATAR_PALETTES = [
  'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300',
  'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300',
  'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
  'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
  'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]!;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div
      className={`${dim} ${avatarColor(name)} rounded-full flex items-center justify-center font-semibold shrink-0 select-none`}
    >
      {getInitials(name)}
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<PendingInvitation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmResend, setConfirmResend] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<{ userId: string; value: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; name: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ invitationId: string; name: string } | null>(
    null,
  );
  const nameInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [membersData, pendingData, me] = await Promise.all([
        api.get<Member[]>('/tenants/members'),
        api.get<PendingInvitation[]>('/tenants/invitations/pending'),
        api.get<{ id: string }>('/auth/me'),
      ]);
      setMembers(membersData);
      setPending(pendingData);
      setCurrentUserId(me.id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openAdd() {
    setForm(EMPTY);
    setError('');
    setConfirmResend(false);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent, resend = false) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/tenants/members', { ...form, role: 'staff', resend });
      setShowForm(false);
      setConfirmResend(false);
      void load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('ALREADY_A_MEMBER')) {
        setError('Esta persona ya es miembro de tu equipo.');
      } else if (msg.includes('INVITATION_ALREADY_SENT')) {
        setConfirmResend(true);
      } else {
        setError(msg || 'Error al agregar miembro');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(userId: string, role: 'owner' | 'staff') {
    setChangingRole(userId);
    try {
      await api.patch(`/tenants/members/${userId}`, { role });
      void load();
    } finally {
      setChangingRole(null);
    }
  }

  function startEditName(userId: string, currentName: string) {
    setEditingName({ userId, value: currentName });
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  async function saveEditName(userId: string) {
    if (!editingName || !editingName.value.trim()) return;
    try {
      await api.patch(`/tenants/members/${userId}`, { name: editingName.value.trim() });
      void load();
    } finally {
      setEditingName(null);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    await api.delete(`/tenants/members/${removeTarget.userId}`);
    setRemoveTarget(null);
    void load();
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    await api.delete(`/tenants/invitations/pending/${revokeTarget.invitationId}`);
    setRevokeTarget(null);
    void load();
  }

  const totalCount = members.length + pending.length;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'Cargando...' : `${totalCount} miembro${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 h-9 px-4 text-sm font-medium">
          <UserPlus size={15} />
          Agregar miembro
        </Button>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-48" />
              </div>
              <div className="h-7 w-24 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Users size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Sin miembros todavía</p>
          <p className="text-sm text-muted-foreground mb-5">
            Invitá a tu equipo para que puedan acceder al negocio.
          </p>
          <Button onClick={openAdd} variant="outline" size="sm" className="gap-2">
            <UserPlus size={14} />
            Agregar el primero
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Active members */}
          {members.map((m) => (
            <div
              key={m.membershipId}
              className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all duration-150"
            >
              <Avatar name={m.name} />

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                {editingName?.userId === m.userId ? (
                  <Input
                    ref={nameInputRef}
                    className="h-7 text-sm w-44 font-medium"
                    value={editingName.value}
                    onChange={(e) => setEditingName({ userId: m.userId, value: e.target.value })}
                    onBlur={() => void saveEditName(m.userId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveEditName(m.userId);
                      if (e.key === 'Escape') setEditingName(null);
                    }}
                  />
                ) : (
                  <button
                    onClick={() => startEditName(m.userId, m.name)}
                    className="flex items-center gap-1.5 group/name"
                    title="Editar nombre"
                  >
                    <span className="text-sm font-medium text-foreground group-hover/name:text-primary transition-colors">
                      {m.name}
                    </span>
                    <Pencil
                      size={11}
                      className="text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity"
                    />
                  </button>
                )}
                <p className="text-xs text-muted-foreground truncate mt-0.5">{m.email}</p>
              </div>

              {/* Role selector */}
              <Select
                value={m.role}
                onValueChange={(val) => void handleRoleChange(m.userId, val as 'owner' | 'staff')}
                disabled={changingRole === m.userId}
              >
                <SelectTrigger className="h-7 w-28 text-xs border-border/60 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Dueño</SelectItem>
                  <SelectItem value="staff">Empleado</SelectItem>
                </SelectContent>
              </Select>

              {/* Status */}
              <Badge
                className={
                  m.isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium px-2.5'
                    : 'bg-muted text-muted-foreground border border-border text-xs font-medium px-2.5'
                }
              >
                {m.isActive ? 'Activo' : 'Inactivo'}
              </Badge>

              {/* Remove action — oculto para el usuario actual */}
              {m.userId !== currentUserId && (
                <button
                  onClick={() => setRemoveTarget({ userId: m.userId, name: m.name })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 hover:cursor-pointer"
                  title="Eliminar miembro"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          {/* Pending invitations section */}
          {pending.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-4 pb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Invitaciones pendientes
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{pending.length}</span>
              </div>

              {pending.map((inv) => (
                <div
                  key={inv.invitationId}
                  className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-dashed border-border bg-card/50 hover:bg-card transition-all duration-150"
                >
                  {/* Avatar placeholder with clock */}
                  <div className="w-10 h-10 rounded-full bg-muted/60 border border-dashed border-border flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/70">{inv.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{inv.email}</p>
                  </div>

                  <span className="text-xs text-muted-foreground hidden sm:block">Empleado</span>

                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Clock size={12} />
                    <span className="text-xs font-medium">Pendiente</span>
                  </div>

                  <button
                    onClick={() =>
                      setRevokeTarget({ invitationId: inv.invitationId, name: inv.name })
                    }
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 hover:cursor-pointer"
                    title="Revocar invitación"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* AlertDialog — revocar invitación */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar invitación de {revokeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              El link de invitación dejará de funcionar. Podés volver a invitar a esta persona en
              cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmRevoke()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog — eliminar miembro */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {removeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta persona perderá el acceso al negocio inmediatamente. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmRemove()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog — agregar miembro */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setConfirmResend(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar miembro</DialogTitle>
          </DialogHeader>

          {confirmResend ? (
            <div className="space-y-4 pt-1">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                  Invitación ya enviada
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Ya existe una invitación pendiente para{' '}
                  <span className="font-semibold">{form.email}</span>.
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Antes de reenviar, pedile a la otra persona que revise la carpeta de spam o correo
                no deseado — es posible que el email original haya llegado ahí.
              </p>
              <div className="flex gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmResend(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  className="flex-1"
                  onClick={(e) => void handleSubmit(e as unknown as React.FormEvent, true)}
                >
                  {submitting ? 'Reenviando...' : 'Reenviar'}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pt-1">
              <p className="text-xs text-muted-foreground">
                Se enviará un email de invitación para que la persona active su cuenta.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Nombre</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Email</Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@ejemplo.com"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/8 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 gap-2">
                  {submitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Mail size={13} />
                      Enviar invitación
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
