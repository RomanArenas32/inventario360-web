'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { Plus, Building2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tenant = { id: string; name: string; role: string };
type Me = { name: string; email: string; tenants: Tenant[] };

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);

  // Profile form
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void api.get<Me>('/auth/me').then((data) => {
      setMe({ ...data, tenants: data.tenants ?? [] });
      setName(data.name);
    });
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.patch('/users/me', { name });
      setProfileMsg({ ok: true, text: 'Nombre actualizado correctamente.' });
      setMe((prev) => (prev ? { ...prev, name } : prev));
    } catch (err: unknown) {
      setProfileMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Error al actualizar el perfil.',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setPasswordMsg({ ok: true, text: 'Contraseña actualizada correctamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Error al cambiar la contraseña.',
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (!me) {
    return <div className="text-muted-foreground text-sm">Cargando...</div>;
  }

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="Mi perfil" description={me.email} />

      {/* Personal info */}
      <Card className="p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Información personal</h2>
        <form onSubmit={(e) => void handleProfileSubmit(e)} className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Nombre</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Email</Label>
            <Input value={me.email} disabled className="text-muted-foreground" />
          </div>
          {profileMsg && (
            <p
              className={`text-sm ${profileMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
            >
              {profileMsg.text}
            </p>
          )}
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </Card>

      {/* Businesses */}
      <Card className="p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Mis negocios</h2>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs')}
          >
            <Plus size={13} />
            Crear negocio
          </Link>
        </div>
        <div className="space-y-2">
          {me.tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pertenecés a ningún negocio.</p>
          ) : (
            me.tenants.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Building2 size={15} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {t.role === 'owner' ? 'Dueño' : 'Empleado'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Change password */}
      <Card className="p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Cambiar contraseña</h2>
        <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Contraseña actual</Label>
            <Input
              required
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Nueva contraseña</Label>
            <Input
              required
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1">Confirmar nueva contraseña</Label>
            <Input
              required
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí la nueva contraseña"
            />
          </div>
          {passwordMsg && (
            <p
              className={`text-sm ${passwordMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
            >
              {passwordMsg.text}
            </p>
          )}
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
