import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

function formatFileName(name) {
  return name
    .replace(/^neurokids_/, '')
    .replace(/\.docx$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [purchases, setPurchases]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [openKit, setOpenKit]       = useState(null);
  const [kitFiles, setKitFiles]     = useState({});
  const [loadingFiles, setLoadingFiles] = useState({});
  const [error, setError]           = useState('');

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

  const loadFiles = async (productId) => {
    if (kitFiles[productId]) {
      setOpenKit(openKit === productId ? null : productId);
      return;
    }
    setLoadingFiles((p) => ({ ...p, [productId]: true }));
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener archivos');
      setKitFiles((p) => ({ ...p, [productId]: data.files }));
      setOpenKit(productId);
    } catch (err) {
      setError(err.message || 'Error al cargar archivos. Inténtalo de nuevo.');
    } finally {
      setLoadingFiles((p) => ({ ...p, [productId]: false }));
    }
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

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">
            Hola, {firstName} 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {purchases.length > 0
              ? `${purchases.length} kit${purchases.length > 1 ? 's' : ''} disponible${purchases.length > 1 ? 's' : ''}`
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
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Aún no tienes kits</h2>
            <p className="text-gray-600 mb-8 max-w-xs mx-auto text-sm">
              Explora nuestra colección y empieza a enseñar IA en tu aula hoy
            </p>
            <Link to="/" className="btn-primary">Ver Kits Disponibles</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {purchases.map((purchase) => {
              const pid   = purchase.products.id;
              const files = kitFiles[pid];
              const isOpen = openKit === pid;

              return (
                <div key={purchase.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  {/* Header del kit */}
                  <div className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🧠</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-gray-900 text-lg">{purchase.products.name}</h3>
                        <span className="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full border border-green-100">Activo</span>
                      </div>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Comprado el {new Date(purchase.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}S/ {(purchase.amount_paid / 100).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => loadFiles(pid)}
                      disabled={loadingFiles[pid]}
                      className="btn-primary flex-shrink-0 disabled:opacity-50"
                    >
                      {loadingFiles[pid] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      ) : isOpen ? (
                        'Cerrar'
                      ) : (
                        'Ver archivos'
                      )}
                    </button>
                  </div>

                  {/* Lista de archivos */}
                  {isOpen && files && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {files.map((file) => (
                        <div key={file.name} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl">📄</span>
                            <span className="text-sm text-gray-700 truncate">{formatFileName(file.name)}</span>
                          </div>
                          {file.url ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={file.name}
                              className="btn-secondary text-sm flex-shrink-0 ml-4"
                            >
                              Descargar
                            </a>
                          ) : (
                            <span className="text-xs text-red-400 ml-4">No disponible</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
