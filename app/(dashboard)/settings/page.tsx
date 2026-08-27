'use client';

import { api } from '@/lib/api';
import type { NotificationSettings } from '@/lib/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput, type PhoneValue, parsePhone, formatPhone } from '@/components/ui/phone-input';
import { Bell, Building2, ChevronRight, MessageCircle, Puzzle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

const OTHER_INTEGRATIONS = [
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Procesá pagos y sincronizá ventas automáticamente.',
  },
  {
    id: 'tiendanube',
    name: 'Tiendanube',
    description: 'Sincronizá el stock con tu tienda online.',
  },
];

type PushNotifSettings = Pick<
  NotificationSettings,
  'alertLowStock' | 'alertNewSale' | 'alertTurnAssigned'
>;

type WhatsAppSettings = Pick<
  NotificationSettings,
  'whatsappPhone' | 'whatsappOptIn' | 'alertLowStock'
>;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  // Business name
  const [businessName, setBusinessName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Push notifications
  const [push, setPush] = useState<PushNotifSettings>({
    alertLowStock: true,
    alertNewSale: true,
    alertTurnAssigned: true,
  });
  const [savingPush, setSavingPush] = useState(false);

  // WhatsApp
  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings>({
    whatsappPhone: null,
    whatsappOptIn: false,
    alertLowStock: true,
  });
  const [phone, setPhone] = useState<PhoneValue>({ countryCode: '+54', number: '' });
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      api.get<NotificationSettings | null>('/notification-settings').catch(() => null),
      api
        .get<{ name?: string; tenant?: { phone?: string | null } | null }>('/auth/me')
        .catch(() => null),
      api.get<{ name?: string } | null>('/tenants/settings').catch(() => null),
    ]).then(([notifData, meData, tenantData]) => {
      if (notifData) {
        setPush({
          alertLowStock: notifData.alertLowStock,
          alertNewSale: notifData.alertNewSale,
          alertTurnAssigned: notifData.alertTurnAssigned,
        });
        setWhatsapp({
          whatsappPhone: notifData.whatsappPhone,
          whatsappOptIn: notifData.whatsappOptIn,
          alertLowStock: notifData.alertLowStock,
        });
        const savedPhone = notifData.whatsappPhone;
        const tenantPhone = meData?.tenant?.phone;
        setPhone(parsePhone(savedPhone ?? tenantPhone ?? ''));
      }
      if (tenantData?.name) setBusinessName(tenantData.name);
      setLoading(false);
    });
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) return;
    setSavingName(true);
    try {
      await api.patch('/tenants/settings', { name: businessName.trim() });
      toast.success('Nombre actualizado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePush() {
    setSavingPush(true);
    try {
      await api.put('/notification-settings', push);
      toast.success('Notificaciones actualizadas');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingPush(false);
    }
  }

  async function handleSaveWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    setSavingWhatsapp(true);
    try {
      const payload = { ...whatsapp, whatsappPhone: formatPhone(phone) || null };
      const updated = await api.put<NotificationSettings>('/notification-settings', payload);
      setWhatsapp({
        whatsappPhone: updated.whatsappPhone,
        whatsappOptIn: updated.whatsappOptIn,
        alertLowStock: updated.alertLowStock,
      });
      toast.success('WhatsApp actualizado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingWhatsapp(false);
    }
  }

  const isConnected = Boolean(whatsapp.whatsappPhone && whatsapp.whatsappOptIn);

  const skeletonRow = (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-1.5">
        <div className="h-3.5 bg-muted rounded w-32 animate-pulse" />
        <div className="h-3 bg-muted rounded w-48 animate-pulse" />
      </div>
      <div className="h-5 w-9 bg-muted rounded-full animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader title="Configuración" description="Administrá tu negocio e integraciones." />

      {/* Business name */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Mi negocio</h2>
        </div>
        <Card className="p-5 shadow-sm">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-9 bg-muted rounded" />
              <div className="h-9 bg-muted rounded w-24" />
            </div>
          ) : (
            <form onSubmit={(e) => void handleSaveName(e)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Nombre del negocio</Label>
                <Input
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Nombre de tu negocio"
                  autoCapitalize="words"
                />
              </div>
              <Button
                type="submit"
                disabled={savingName || !businessName.trim()}
                className="w-full sm:w-auto"
              >
                {savingName ? 'Guardando...' : 'Guardar nombre'}
              </Button>
            </form>
          )}
        </Card>
      </section>

      {/* Push notifications */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Notificaciones push</h2>
        </div>
        <Card className="p-5 shadow-sm">
          <p className="text-xs text-muted-foreground mb-4">
            El equipo recibe una alerta en la app cuando ocurre cada evento.
          </p>
          {loading ? (
            <div className="divide-y divide-border">
              {skeletonRow}
              {skeletonRow}
              {skeletonRow}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(
                [
                  {
                    key: 'alertNewSale',
                    label: 'Nueva venta registrada',
                    desc: 'Notifica a todos excepto quien realizó la venta',
                  },
                  {
                    key: 'alertTurnAssigned',
                    label: 'Turno asignado',
                    desc: 'Notifica al empleado asignado cuando otro le agrega un turno',
                  },
                  {
                    key: 'alertLowStock',
                    label: 'Stock bajo',
                    desc: 'Notifica cuando un producto baja del mínimo configurado',
                  },
                ] as { key: keyof PushNotifSettings; label: string; desc: string }[]
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    checked={push[key]}
                    onChange={(v) => setPush((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          )}
          {!loading && (
            <Button
              type="button"
              onClick={() => void handleSavePush()}
              disabled={savingPush}
              className="mt-4 w-full sm:w-auto"
            >
              {savingPush ? 'Guardando...' : 'Guardar notificaciones'}
            </Button>
          )}
        </Card>
      </section>

      {/* WhatsApp */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={16} className="text-green-500" />
          <h2 className="text-base font-semibold text-foreground">WhatsApp</h2>
          {isConnected && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950 px-2 py-0.5 rounded-full">
              Conectado
            </span>
          )}
        </div>

        <Card className="p-5 shadow-sm">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-48" />
              <div className="h-9 bg-muted rounded" />
              <div className="h-9 bg-muted rounded w-32" />
            </div>
          ) : (
            <form onSubmit={(e) => void handleSaveWhatsapp(e)} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Número de WhatsApp</Label>
                <PhoneInput value={phone} onChange={setPhone} placeholder="11 2345-6789" />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsapp.whatsappOptIn}
                  onChange={(e) => setWhatsapp({ ...whatsapp, whatsappOptIn: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    Acepto recibir alertas por WhatsApp
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Requerido por Meta. Solo recibirás notificaciones de Inventario360.
                  </p>
                </div>
              </label>

              {whatsapp.whatsappOptIn && (
                <div className="border border-border rounded-lg divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Stock bajo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cuando un producto cae al mínimo configurado
                      </p>
                    </div>
                    <Toggle
                      checked={whatsapp.alertLowStock}
                      onChange={(v) => setWhatsapp({ ...whatsapp, alertLowStock: v })}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={savingWhatsapp} className="w-full sm:w-auto">
                {savingWhatsapp ? 'Guardando...' : 'Guardar'}
              </Button>
            </form>
          )}
        </Card>
      </section>

      {/* Otras integraciones */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Próximamente</h2>
        <Card className="divide-y divide-border p-0 overflow-hidden shadow-sm">
          {OTHER_INTEGRATIONS.map((int) => (
            <div key={int.id} className="flex items-center gap-4 px-5 py-4 opacity-60">
              <div className="p-2 rounded-lg shrink-0 bg-muted text-muted-foreground">
                <Puzzle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{int.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{int.description}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground/40 shrink-0" />
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
