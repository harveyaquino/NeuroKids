import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const STATUS_COLORS = {
  completed: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  refunded: 'bg-blue-500/20 text-blue-400',
};

export default function Admin() {
  const [purchases, setPurchases] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('purchases');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [p, u, pr] = await Promise.all([
      supabase
        .from('purchases')
        .select('*, profiles(full_name, email), products(name)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    setPurchases(p.data || []);
    setUsers(u.data || []);
    setProducts(pr.data || []);
    setLoading(false);
  };

  const toggleProduct = async (id, current) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !current })
      .eq('id', id);
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
      );
    }
  };

  const completedPurchases = purchases.filter((p) => p.status === 'completed');
  const totalRevenue = completedPurchases.reduce((s, p) => s + p.amount_paid, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const TABS = [
    { key: 'purchases', label: 'Compras' },
    { key: 'users', label: 'Usuarios' },
    { key: 'products', label: 'Productos' },
  ];

  return (
    <div className="min-h-screen bg-dark pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Panel Admin</h1>
          <p className="text-white/40 mt-1 text-sm">NeuroKids — Control total</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Ventas completadas', value: completedPurchases.length, icon: '💰' },
            { label: 'Usuarios registrados', value: users.length, icon: '👥' },
            { label: 'Pagos pendientes', value: purchases.filter((p) => p.status === 'pending').length, icon: '⏳' },
            { label: 'Ingresos totales', value: `S/ ${(totalRevenue / 100).toFixed(0)}`, icon: '📈' },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-display font-bold text-white">{s.value}</div>
              <div className="text-white/40 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Purchases */}
        {tab === 'purchases' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                    <th className="text-left p-4 font-medium">Usuario</th>
                    <th className="text-left p-4 font-medium">Producto</th>
                    <th className="text-left p-4 font-medium">Monto</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-4">
                        <div className="text-white font-medium">{p.profiles?.full_name || '—'}</div>
                        <div className="text-white/40 text-xs">{p.profiles?.email}</div>
                      </td>
                      <td className="p-4 text-white/70">{p.products?.name}</td>
                      <td className="p-4 text-white">S/ {(p.amount_paid / 100).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[p.status] || 'bg-white/10 text-white/40'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-white/40 text-xs">
                        {new Date(p.created_at).toLocaleDateString('es-PE')}
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/30">Sin compras aún</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                    <th className="text-left p-4 font-medium">Nombre</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Rol</th>
                    <th className="text-left p-4 font-medium">Registrado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-4 text-white font-medium">{u.full_name || '—'}</td>
                      <td className="p-4 text-white/70">{u.email}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/40'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-white/40 text-xs">
                        {new Date(u.created_at).toLocaleDateString('es-PE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products */}
        {tab === 'products' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                    <th className="text-left p-4 font-medium">Producto</th>
                    <th className="text-left p-4 font-medium">Precio</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-4">
                        <div className="text-white font-medium">{p.name}</div>
                        <div className="text-white/40 text-xs truncate max-w-xs">{p.description}</div>
                      </td>
                      <td className="p-4 text-white">S/ {(p.price / 100).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {p.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleProduct(p.id, p.is_active)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                            p.is_active
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          }`}
                        >
                          {p.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
