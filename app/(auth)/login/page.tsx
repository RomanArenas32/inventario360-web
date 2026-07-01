'use client';

import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Inventario360</h1>
            <p className="text-gray-500 mt-1 text-sm">Iniciá sesión en tu cuenta</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-8 text-center">
            Para acceder, contactá al administrador de la plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
