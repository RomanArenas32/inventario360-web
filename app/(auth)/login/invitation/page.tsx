'use client';

import { api } from '@/lib/api';
import AuthSplitLayout from '@/components/auth/auth-split-layout';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type InvitationInfo = {
  email: string;
  tenantName: string;
  role: string;
  expiresAt: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  email_mismatch:
    'El email de tu cuenta de Google no coincide con el de la invitación. Usá la cuenta correcta.',
  google_failed: 'Ocurrió un error al conectar con Google. Intentá de nuevo.',
};

export default function InvitationPage() {
  return (
    <Suspense fallback={<AuthSplitLayout><p className="text-center text-muted-foreground text-sm">Cargando...</p></AuthSplitLayout>}>
      <InvitationContent />
    </Suspense>
  );
}

function InvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const errorParam = searchParams.get('error') ?? '';

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenError('Token de invitación no encontrado.');
      setValidating(false);
      return;
    }
    void api
      .get<InvitationInfo>(`/invitations/validate/${token}`)
      .then((data) => {
        setInfo(data);
      })
      .catch((err: unknown) => {
        setTokenError(err instanceof Error ? err.message : 'Invitación inválida o expirada.');
      })
      .finally(() => setValidating(false));
  }, [token]);

  function handleGoogle() {
    window.location.href = `${API_URL}/invitations/google?token=${token}`;
  }

  return (
    <AuthSplitLayout>
      {validating ? (
        <p className="text-center text-muted-foreground text-sm">Verificando invitación...</p>
      ) : tokenError ? (
        <div className="text-center">
          <p className="text-destructive font-medium">{tokenError}</p>
          <Button variant="link" className="mt-4" onClick={() => router.push('/login')}>
            Ir al inicio de sesión
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              Invitación
            </p>
            <h1 className="text-2xl font-bold text-foreground">Activá tu cuenta</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fuiste invitado a{' '}
              <span className="font-medium text-foreground">{info?.tenantName}</span>. Usá tu cuenta
              de Google para continuar.
            </p>
          </div>

          {/* Email de la invitación */}
          <div className="mb-6 px-3 py-2.5 rounded-lg bg-muted border border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <p className="text-sm text-foreground truncate">{info?.email}</p>
          </div>

          {/* Error de Google */}
          {errorParam && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                {ERROR_MESSAGES[errorParam] ?? 'Ocurrió un error. Intentá de nuevo.'}
              </p>
            </div>
          )}

          {/* Botón Google */}
          <Button
            onClick={handleGoogle}
            variant="outline"
            className="w-full flex items-center gap-3 h-11 text-sm font-medium"
          >
            <GoogleIcon />
            Continuar con Google
          </Button>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            Asegurate de usar la cuenta <span className="font-medium">{info?.email}</span>.
          </p>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">¿Ya tenés una cuenta?</p>
            <Button
              variant="link"
              onClick={() => router.push('/login')}
              className="mt-1 h-auto p-0 text-sm font-medium"
            >
              Ir al inicio de sesión →
            </Button>
          </div>
        </>
      )}
    </AuthSplitLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
