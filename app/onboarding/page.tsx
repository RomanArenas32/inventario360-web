'use client';

import { api } from '@/lib/api';
import { setOnboarded } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const BUSINESS_TYPES = [
  { value: 'almacen', label: 'Almacén / Minimercado', icon: '🛒' },
  { value: 'kiosco', label: 'Kiosco', icon: '🗞️' },
  { value: 'ferreteria', label: 'Ferretería', icon: '🔧' },
  { value: 'barberia', label: 'Barbería / Estética', icon: '✂️' },
  { value: 'restaurante', label: 'Restaurante', icon: '🍽️' },
  { value: 'tienda_ropa', label: 'Tienda de ropa', icon: '👗' },
  { value: 'tienda_electronica', label: 'Electrónica', icon: '💻' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      await api.patch('/tenants/onboarding', { businessType: selected });
      setOnboarded(true);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido!</h1>
          <p className="text-gray-500 mt-1">¿Qué tipo de comercio tenés?</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {BUSINESS_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelected(type.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors text-sm font-medium ${
                  selected === type.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={!selected || loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
