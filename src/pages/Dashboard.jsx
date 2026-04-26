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

  useEffect(() => {
    if (user) fetchPurchases();
  }, [user]);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (productId, productName) => {
    setDownloading((prev) => ({ ...prev, [productId]: true }));
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar enlace');

      // Open signed URL in new tab to trigger download
      const a = document.createElement('a');
      a.href = data.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = `${productName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Error al descargar. Inténtalo de nuevo.');
    } finally {
      setDownloading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'docente';

  return (
    <div className="min-h-screen bg-dark pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold text-white">
            Hola, {firstName} 👋
          </h1>
          <p className="text-white/50 mt-2">
            {purchases.length > 0
              ? `Tienes ${purchases.length} kit${purchases.length > 1 ? 's' : ''} disponible${purchases.length > 1 ? 's' : ''} para descargar`
              : 'Aquí aparecerán tus kits después de comprar'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {purchases.length === 0 ? (
          <div className="text-center py-24 card">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-display font-bold text-white mb-2">
              Aún no tienes kits
            </h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">
              Explora nuestra colección y empieza a enseñar IA en tu aula hoy mismo
            </p>
            <Link to="/" className="btn-primary">
              Ver Kits Disponibles
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="card flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-2xl">
                    🧠
                  </div>
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-semibold">
                    Activo
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-1">
                  {purchase.products.name}
                </h3>
                <p className="text-white/50 text-sm mb-4 flex-1">
                  {purchase.products.description}
                </p>
                <div className="flex items-center justify-between text-xs text-white/30 mb-4 border-t border-white/5 pt-3">
                  <span>
                    {new Date(purchase.created_at).toLocaleDateString('es-PE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span>S/ {(purchase.amount_paid / 100).toFixed(2)}</span>
                </div>
                <button
                  onClick={() => handleDownload(purchase.products.id, purchase.products.name)}
                  disabled={downloading[purchase.products.id]}
                  className="btn-primary w-full gap-2 disabled:opacity-50"
                >
                  {downloading[purchase.products.id] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                      Preparando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Descargar PDF
                    </>
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
