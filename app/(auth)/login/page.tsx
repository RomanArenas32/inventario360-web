'use client';

import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

type ContactForm = { name: string; email: string; phone: string; message: string };
const EMPTY_CONTACT: ContactForm = { name: '', email: '', phone: '', message: '' };

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState<ContactForm>(EMPTY_CONTACT);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ access_token: string }>('/auth/login', form);
      const me = await api.get<{ role: string; tenant: { isOnboarded: boolean } }>(
        '/auth/me',
        data.access_token,
      );
      setSession(data.access_token, me.role, me.tenant?.isOnboarded ?? false);
      if (me.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push(me.tenant.isOnboarded ? '/dashboard' : '/onboarding');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleContact(e: FormEvent) {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    try {
      await api.post('/messages', contact);
      setContactSent(true);
    } catch (err: unknown) {
      setContactError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setContactLoading(false);
    }
  }

  function closeContact() {
    setShowContact(false);
    setContactSent(false);
    setContact(EMPTY_CONTACT);
    setContactError('');
  }

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Columna izquierda — imagen */}
      <div className="relative hidden lg:block overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/dashboard.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-white text-xl font-semibold leading-snug">
            Gestioná tu inventario de forma simple y rápida.
          </p>
          <p className="text-gray-400 text-sm mt-1">Inventario360 — para comercios del interior.</p>
        </div>
      </div>

      {/* Columna derecha — formulario */}
      <div className="flex items-center justify-center p-8 bg-background relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors" />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Inventario360</h1>
            <p className="text-muted-foreground mt-1 text-sm">Iniciá sesión en tu cuenta</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">¿Todavía no tenés acceso?</p>
            <button
              onClick={() => setShowContact(true)}
              className="mt-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
            >
              Solicitar acceso al administrador →
            </button>
          </div>
        </div>
      </div>

      {/* Modal solicitar acceso */}
      {showContact && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl">
            {contactSent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">✓</div>
                <h2 className="text-lg font-bold text-foreground">¡Mensaje enviado!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  El administrador se va a comunicar con vos a la brevedad.
                </p>
                <button
                  onClick={closeContact}
                  className="mt-4 w-full bg-primary text-primary-foreground text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-foreground mb-1">Solicitar acceso</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Dejá tus datos y el administrador se contacta con vos.
                </p>
                <form onSubmit={(e) => void handleContact(e)} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre *</label>
                    <input
                      required
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
                    <input
                      required
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Teléfono</label>
                    <input
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Ej: 2366-123456"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Mensaje *</label>
                    <textarea
                      required
                      rows={3}
                      value={contact.message}
                      onChange={(e) => setContact({ ...contact, message: e.target.value })}
                      className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Contanos sobre tu comercio..."
                    />
                  </div>
                  {contactError && <p className="text-sm text-destructive">{contactError}</p>}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeContact}
                      className="flex-1 border border-border text-muted-foreground text-sm font-medium py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {contactLoading ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
