'use client';

import { api } from '@/lib/api';
import type { NotificationSettings } from '@/lib/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PhoneInput, type PhoneValue, parsePhone, formatPhone } from '@/components/ui/phone-input';
import { ChevronRight, MessageCircle, Puzzle } from 'lucide-react';
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<
    Pick<NotificationSettings, 'whatsappPhone' | 'whatsappOptIn' | 'alertLowStock'>
  >({
    whatsappPhone: null,
    whatsappOptIn: false,
    alertLowStock: true,
  });
  const [phone, setPhone] = useState<PhoneValue>({ countryCode: '+54', number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      api.get<NotificationSettings | null>('/notification-settings').catch(() => null),
      api.get<{ tenant: { phone: string | null } | null }>('/auth/me').catch(() => null),
    ]).then(([notifData, meData]) => {
      if (notifData) setSettings(notifData);

      const savedPhone = notifData?.whatsappPhone;
      const tenantPhone = meData?.tenant?.phone;
      const phoneToUse = savedPhone ?? tenantPhone ?? '';
      setPhone(parsePhone(phoneToUse));

      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...settings, whatsappPhone: formatPhone(phone) || null };
      const updated = await api.put<NotificationSettings>('/notification-settings', payload);
      setSettings(updated);
      toast.success('Configuración guardada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const isConnected = Boolean(settings.whatsappPhone && settings.whatsappOptIn);

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader title="Integraciones" description="Conectá tu negocio con otras plataformas." />

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
            <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Número de WhatsApp</Label>
                <PhoneInput value={phone} onChange={setPhone} placeholder="11 2345-6789" />
              </div>

              {/* Opt-in */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsappOptIn}
                  onChange={(e) => setSettings({ ...settings, whatsappOptIn: e.target.checked })}
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

              {/* Tipos de alertas */}
              {settings.whatsappOptIn && (
                <div className="border border-border rounded-lg divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Stock bajo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cuando un producto cae al mínimo configurado
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.alertLowStock}
                      onClick={() =>
                        setSettings({ ...settings, alertLowStock: !settings.alertLowStock })
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        settings.alertLowStock ? 'bg-primary' : 'bg-input'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${
                          settings.alertLowStock ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Guardando...' : 'Guardar'}
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
