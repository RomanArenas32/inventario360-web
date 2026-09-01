'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2, User } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tenant = { id: string; name: string; role: string };
type Me = { name: string; email: string; avatarUrl: string | null; tenants: Tenant[] };

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 bg-muted rounded-lg w-32" />
        <div className="h-4 bg-muted rounded w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-40" />
                <div className="h-3 bg-muted rounded w-32" />
              </div>
            </div>
            <div className="h-px bg-muted" />
            {[1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 bg-muted rounded w-16" />
                <div className="h-9 bg-muted rounded" />
              </div>
            ))}
            <div className="h-9 bg-muted rounded w-32" />
          </Card>
          <Card className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded w-36" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 bg-muted rounded w-28" />
                <div className="h-9 bg-muted rounded" />
              </div>
            ))}
            <div className="h-9 bg-muted rounded w-36" />
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-6 space-y-3">
            <div className="h-4 bg-muted rounded w-24" />
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-lg" />
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    void api.get<Me>('/auth/me').then((data) => {
      setMe({ ...data, tenants: data.tenants ?? [] });
      setName(data.name);
    });
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch('/users/me', { name });
      setMe((prev) => (prev ? { ...prev, name } : prev));
      toast.success('Nombre actualizado correctamente');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  }

  if (!me) return <ProfileSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{me.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal info */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Información personal</h2>
            <form onSubmit={(e) => void handleProfileSubmit(e)} className="space-y-4">
              {/* Avatar row */}
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                {me.avatarUrl ? (
                  <Image
                    src={me.avatarUrl}
                    alt={me.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User size={24} className="text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{me.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{me.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={me.email} disabled className="text-muted-foreground" />
                </div>
              </div>

              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          </Card>

          {/* Change password */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Cambiar contraseña</h2>
            <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Contraseña actual</Label>
                <Input
                  required
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nueva contraseña</Label>
                  <Input
                    required
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmar contraseña</Label>
                  <Input
                    required
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí la nueva contraseña"
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
              </Button>
            </form>
          </Card>
        </div>

        {/* ── Sidebar column ── */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Mis negocios</h2>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'gap-1.5 text-xs',
                )}
              >
                <Plus size={13} />
                Crear
              </Link>
            </div>
            <div className="space-y-2">
              {me.tenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pertenecés a ningún negocio.</p>
              ) : (
                me.tenants.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <Building2 size={15} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role === 'owner' ? 'Dueño' : 'Empleado'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
