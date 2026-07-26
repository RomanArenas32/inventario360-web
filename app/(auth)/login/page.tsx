'use client';

import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import AuthSplitLayout from '@/components/auth/auth-split-layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ERROR_MESSAGES: Record<string, string> = {
  no_account: 'No existe una cuenta asociada a este correo.',
  no_tenant: 'Tu cuenta no tiene ningún negocio asociado.',
  google_failed: 'No se pudo autenticar con Google. Intentá de nuevo.',
};

type ContactForm = { name: string; email: string; phone: string; message: string };
const EMPTY_CONTACT: ContactForm = { name: '', email: '', phone: '', message: '' };

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!oauthError) return;
    const t = setTimeout(() => {
      toast.error(ERROR_MESSAGES[oauthError] ?? 'Error al iniciar sesión con Google.');
      router.replace('/login');
    }, 100);
    return () => clearTimeout(t);
  }, [oauthError]);

  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState<ContactForm>(EMPTY_CONTACT);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/login', form);
      const me = await api.get<{ role: string; tenant: { isOnboarded: boolean } | null }>(
        '/auth/me',
      );
      setSession(me.role, me.tenant?.isOnboarded ?? false);
      if (me.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (!me.tenant) {
        router.push('/select-tenant');
      } else {
        router.push(me.tenant.isOnboarded ? '/dashboard' : '/onboarding');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión');
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
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Inventario360</h1>
        <p className="text-muted-foreground mt-1 text-sm">Iniciá sesión en tu cuenta</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <Label className="mb-1">Email</Label>
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <Label className="mb-1">Contraseña</Label>
          <Input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">O continuá con</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center gap-3 h-11"
        onClick={() => { window.location.href = `${API_URL}/auth/google`; }}
      >
        <GoogleIcon />
        Continuar con Google
      </Button>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">¿Todavía no tenés cuenta?</p>
        <Button
          variant="link"
          onClick={() => setShowContact(true)}
          className="mt-2 h-auto p-0 text-sm font-medium"
        >
          Puedes pedir tu cuenta aqui →
        </Button>
      </div>

      {/* Modal solicitar acceso */}
      <Dialog
        open={showContact}
        onOpenChange={(open) => {
          if (!open) closeContact();
        }}
      >
        <DialogContent className="max-w-sm">
          {contactSent ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">✓</div>
              <h2 className="text-lg font-bold text-foreground">¡Mensaje enviado!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Nos pondremos en contacto con vos a la brevedad.
              </p>
              <Button onClick={closeContact} className="mt-4 w-full">
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Pidenos tu cuenta</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground -mt-2">
                Dejá tus datos y nos pondremos en contacto con vos.
              </p>
              <form onSubmit={(e) => void handleContact(e)} className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Nombre *</Label>
                  <Input
                    required
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Email *</Label>
                  <Input
                    required
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Teléfono</Label>
                  <Input
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="Ej: 2366-123456"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Mensaje *</Label>
                  <Textarea
                    required
                    rows={3}
                    value={contact.message}
                    onChange={(e) => setContact({ ...contact, message: e.target.value })}
                    className="resize-none"
                    placeholder="Contanos sobre tu comercio..."
                  />
                </div>
                {contactError && <p className="text-sm text-destructive">{contactError}</p>}
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="outline" onClick={closeContact} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={contactLoading} className="flex-1">
                    {contactLoading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AuthSplitLayout>
  );
}
