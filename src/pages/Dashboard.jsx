import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [error, setError] = useState('');

  useEffect(() => { if (user) fetchPurchases(); }, [user]);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, products(id, name, description, price)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPurchases(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = async (productId, productName) => {
    setDownloading((p) => ({ ...p, [productId]: true }));
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar enlace');
      const a = document.createElement('a');
      a.href = data.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.download = `${productName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Error al descargar. Inténtalo de nuevo.');
    } finally { setDownloading((p) => ({ ...p, [productId]: false })); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-primary" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'docente';

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">
            Hola, {firstName} 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {purchases.length > 0
              ? `${purchases.length} kit${purchases.length > 1 ? 's' : ''} disponible${purchases.length > 1 ? 's' : ''} para descargar`
              : 'Aquí aparecerán tus kits después de comprar'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {purchases.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">
              Aún no tienes kits
            </h2>
            <p className="text-gray-600 mb-8 max-w-xs mx-auto text-sm">
              Explora nuestra colección y empieza a enseñar IA en tu aula hoy
            </p>
            <Link to="/" className="btn-primary">
              Ver Kits Disponibles
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-2xl">🧠</div>
                  <span className="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full border border-green-100">Activo</span>
                </div>
                <h3 className="font-display font-bold text-gray-900 text-lg mb-1">{purchase.products.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{purchase.products.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pt-3 border-t border-gray-100">
                  <span>{new Date(purchase.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="font-medium">S/ {(purchase.amount_paid / 100).toFixed(2)}</span>
                </div>
                <button
                  onClick={() => handleDownload(purchase.products.id, purchase.products.name)}
                  disabled={downloading[purchase.products.id]}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {downloading[purchase.products.id] ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Preparando...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Descargar PDF</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
