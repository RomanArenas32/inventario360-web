'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

type Tenant = {
  id: string;
  name: string;
  phone: string | null;
  businessType: string | null;
  plan: string;
  isActive: boolean;
  isOnboarded: boolean;
  user?: { name: string; email: string };
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  almacen: 'Almacén',
  kiosco: 'Kiosco',
  ferreteria: 'Ferretería',
  barberia: 'Barbería',
  restaurante: 'Restaurante',
  tienda_ropa: 'Tienda de ropa',
  tienda_electronica: 'Electrónica',
};

const BUSINESS_TYPES = [
  { value: 'almacen', label: 'Almacén / Minimercado' },
  { value: 'kiosco', label: 'Kiosco' },
  { value: 'ferreteria', label: 'Ferretería' },
  { value: 'barberia', label: 'Barbería / Estética' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'tienda_ropa', label: 'Tienda de ropa' },
  { value: 'tienda_electronica', label: 'Electrónica' },
];

const DEFAULT_FORM = {
  businessName: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  businessType: '',
  plan: 'basic',
  phone: '',
};

export default function ComerciosPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Tenant[]>('/admin/tenants');
      setTenants(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/admin/tenants', {
        ...form,
        businessType: form.businessType || undefined,
      });
      setShowCreate(false);
      setForm(DEFAULT_FORM);
      void load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(tenant: Tenant) {
    await api.patch(`/admin/tenants/${tenant.id}`, { isActive: !tenant.isActive });
    void load();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este comercio? Esta acción no se puede deshacer.')) return;
    await api.delete(`/admin/tenants/${id}`);
    void load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Comercios</h1>
          <p className="text-gray-400 mt-1">Gestión de clientes de la plataforma</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
        >
          + Nuevo comercio
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No hay comercios registrados. Creá el primero.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Comercio</th>
                <th className="text-left px-4 py-3">Dueño</th>
                <th className="text-left px-4 py-3">Rubro</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-white font-medium">
                    {t.name}
                    {t.phone && <div className="text-xs text-gray-500 font-normal">{t.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    <div>{t.user?.name}</div>
                    <div className="text-xs text-gray-500">{t.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {t.businessType ? (BUSINESS_TYPE_LABELS[t.businessType] ?? t.businessType) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.plan === 'pro'
                          ? 'bg-purple-900 text-purple-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {t.plan === 'pro' ? 'Pro' : 'Basic'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {t.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      onClick={() => void handleToggleActive(t)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {t.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => void handleDelete(t.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Nuevo comercio</h2>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre del comercio *</label>
                <input
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ej: Almacén Don Juan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rubro</label>
                  <select
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Sin definir</option>
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt.value} value={bt.value}>
                        {bt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Plan</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Teléfono</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ej: 2366-123456"
                />
              </div>

              <hr className="border-gray-800" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos del dueño</p>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre completo *</label>
                <input
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Nombre y apellido"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Contraseña *</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.ownerPassword}
                  onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setForm(DEFAULT_FORM);
                    setError('');
                  }}
                  className="flex-1 border border-gray-700 text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Creando...' : 'Crear comercio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
