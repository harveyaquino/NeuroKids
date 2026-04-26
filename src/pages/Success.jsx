import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && sessionId) pollForPurchase();
    else setLoading(false);
  }, [user, sessionId]);

  const pollForPurchase = async () => {
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from('purchases')
        .select('*, products(name)')
        .eq('stripe_session_id', sessionId)
        .eq('status', 'completed')
        .maybeSingle();
      if (data) { setPurchase(data); break; }
      if (i < 4) await new Promise((r) => setTimeout(r, 2000));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-primary" />
        <p className="text-gray-400 text-sm">Confirmando tu pago...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white border border-gray-100 rounded-2xl shadow-sm p-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">¡Compra exitosa!</h1>
        {purchase ? (
          <p className="text-gray-500 mb-2">
            <span className="font-semibold text-gray-900">{purchase.products.name}</span> ya está disponible en tu dashboard.
          </p>
        ) : (
          <p className="text-gray-500 mb-2">
            Tu pago fue procesado. El kit aparecerá en tu dashboard en unos momentos.
          </p>
        )}
        <p className="text-gray-400 text-sm mb-8">Recibirás un email de confirmación en breve.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/dashboard" className="btn-primary">Ir a mis Kits</Link>
          <Link to="/" className="btn-secondary">Inicio</Link>
        </div>
      </div>
    </div>
  );
}
