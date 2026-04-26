import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export default function Login() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get('mode');
  const redirect = searchParams.get('redirect');
  const productId = searchParams.get('product_id');

  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && user) {
      if (redirect === 'checkout' && productId) {
        triggerCheckout(productId);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading]);

  const triggerCheckout = async (pid) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: pid }),
      });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; return; }
    } catch { /* fall through */ }
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, fullName);
        setMessage('¡Cuenta creada! Revisa tu email para verificar tu cuenta.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos.');
      else if (msg.includes('User already registered')) setError('Este email ya está registrado.');
      else if (msg.includes('Email not confirmed')) setError('Debes verificar tu email primero.');
      else setError('Ocurrió un error. Inténtalo de nuevo.');
    } finally { setSubmitting(false); }
  };

  const handleGoogle = async () => {
    try {
      const redirectTo = redirect === 'checkout' && productId
        ? `${window.location.origin}/login?redirect=checkout&product_id=${productId}`
        : `${window.location.origin}/dashboard`;
      await signInWithGoogle(redirectTo);
    } catch { setError('Error al conectar con Google. Inténtalo de nuevo.'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">NK</span>
            </div>
            <span className="font-display font-bold text-gray-900 text-2xl">
              Neuro<span className="text-primary">Kids</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {isSignUp ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {isSignUp ? 'Empieza a enseñar IA hoy' : 'Accede a tus kits educativos'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {message && (
            <div className="mb-5 p-3.5 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {message}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all text-sm shadow-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-gray-400 text-xs">o continúa con email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="input-field" placeholder="María González" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input-field" placeholder="Mínimo 6 caracteres" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Cargando...</>
              ) : isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
              className="text-primary hover:text-primary-dark font-semibold"
            >
              {isSignUp ? 'Inicia sesión' : 'Regístrate gratis'}
            </button>
          </p>
        </div>

        <p className="text-center text-gray-400 text-xs mt-5">
          Al registrarte aceptas nuestros Términos de Servicio y Política de Privacidad.
        </p>
      </div>
    </div>
  );
}
