import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const STATUS_BADGE = {
  completed: 'bg-green-50 text-green-700 border-green-100',
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  failed:    'bg-red-50 text-red-700 border-red-100',
  refunded:  'bg-blue-50 text-blue-700 border-blue-100',
};

export default function Admin() {
  const [purchases, setPurchases] = useState([]);
  const [users, setUsers]         = useState([]);
  const [products, setProducts]   = useState([]);
  const [waitlist, setWaitlist]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('purchases');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [p, u, pr, w] = await Promise.all([
      supabase.from('purchases').select('*, profiles(full_name, email), products(name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
    ]);
    setPurchases(p.data || []); setUsers(u.data || []); setProducts(pr.data || []); setWaitlist(w.data || []);
    setLoading(false);
  };

  const toggleProduct = async (id, current) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id);
    if (!error) setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !current } : p));
  };

  const completed = purchases.filter((p) => p.status === 'completed');
  const revenue   = completed.reduce((s, p) => s + p.amount_paid, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-primary" />
      </div>
    );
  }

  const TABS = [{ key: 'purchases', label: 'Compras' }, { key: 'users', label: 'Usuarios' }, { key: 'products', label: 'Productos' }, { key: 'waitlist', label: `Waitlist (${waitlist.length})` }];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Panel Admin</h1>
          <p className="text-gray-500 text-sm mt-1">ConociendoIA — Control total</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Ventas completadas', value: completed.length, icon: '💰', color: 'bg-green-50 border-green-100' },
            { label: 'Usuarios registrados', value: users.length, icon: '👥', color: 'bg-blue-50 border-blue-100' },
            { label: 'Pagos pendientes', value: purchases.filter((p) => p.status === 'pending').length, icon: '⏳', color: 'bg-yellow-50 border-yellow-100' },
            { label: 'Ingresos totales', value: `S/ ${(revenue / 100).toFixed(0)}`, icon: '📈', color: 'bg-purple-50 border-purple-100' },
          ].map((s) => (
            <div key={s.label} className={`${s.color} border rounded-2xl p-5`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-display font-bold text-gray-900">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {tab === 'purchases' && (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    {['Usuario', 'Producto', 'Monto', 'Estado', 'Fecha', 'IDs'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{p.profiles?.full_name || '—'}</div>
                        <div className="text-gray-400 text-xs">{p.profiles?.email}</div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{p.products?.name}</td>
                      <td className="px-5 py-4 font-medium text-gray-900">S/ {(p.amount_paid / 100).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[p.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('es-PE')}</td>
                      <td className="px-5 py-4">
                        <div className="text-gray-400 text-xs font-mono">purchase: {p.id?.slice(0, 8)}…</div>
                        <div className="text-gray-400 text-xs font-mono">product: {p.product_id?.slice(0, 8)}…</div>
                      </td>
                    </tr>
                  ))}
                  {!purchases.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Sin compras aún</td></tr>}
                </tbody>
              </table>
            )}

            {tab === 'users' && (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    {['Nombre', 'Email', 'Rol', 'Registrado'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">{u.full_name || '—'}</td>
                      <td className="px-5 py-4 text-gray-600">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${u.role === 'admin' ? 'bg-primary-light text-primary border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('es-PE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'products' && (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    {['Producto', 'Precio', 'Estado', 'Acción'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-gray-400 text-xs truncate max-w-xs">{p.description}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">S/ {(p.price / 100).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${p.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {p.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleProduct(p.id, p.is_active)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${p.is_active ? 'bg-white text-red-600 border-red-100 hover:bg-red-50' : 'bg-white text-green-600 border-green-100 hover:bg-green-50'}`}
                        >
                          {p.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'waitlist' && (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    {['Email', 'Tipo', 'Fecha'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {waitlist.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">{w.email}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${w.type === 'docente' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                          {w.type === 'docente' ? 'Docente' : 'Padre/Madre'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{new Date(w.created_at).toLocaleDateString('es-PE')}</td>
                    </tr>
                  ))}
                  {!waitlist.length && <tr><td colSpan={3} className="px-5 py-12 text-center text-gray-400">Sin registros aún</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
