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
    if (user && sessionId) {
      pollForPurchase();
    } else {
      setLoading(false);
    }
  }, [user, sessionId]);

  const pollForPurchase = async () => {
    // Webhook can take a few seconds — poll up to 5 times
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data } = await supabase
        .from('purchases')
        .select('*, products(name)')
        .eq('stripe_session_id', sessionId)
        .eq('status', 'completed')
        .maybeSingle();

      if (data) {
        setPurchase(data);
        break;
      }
      if (attempt < 4) await new Promise((r) => setTimeout(r, 2000));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="text-white/50 text-sm">Confirmando tu pago...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-display font-bold text-white mb-3">
          ¡Compra exitosa!
        </h1>
        {purchase ? (
          <p className="text-white/60 mb-2">
            <span className="text-accent font-semibold">{purchase.products.name}</span> ya
            está disponible en tu dashboard.
          </p>
        ) : (
          <p className="text-white/60 mb-2">
            Tu pago fue procesado correctamente. El kit aparecerá en tu dashboard en unos momentos.
          </p>
        )}
        <p className="text-white/30 text-sm mb-10">
          Recibirás un email de confirmación en breve.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/dashboard" className="btn-primary">
            Ir a mis Kits
          </Link>
          <Link to="/" className="btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
