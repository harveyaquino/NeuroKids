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

  // After auth, redirect or trigger checkout
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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: pid }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // fall through to dashboard
    }
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, fullName);
        setMessage('¡Cuenta creada! Revisa tu email para verificar tu cuenta antes de continuar.');
      } else {
        await signInWithEmail(email, password);
        // useEffect handles navigation after user state updates
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos.');
      } else if (msg.includes('User already registered')) {
        setError('Este email ya está registrado. Inicia sesión.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Debes verificar tu email primero. Revisa tu bandeja de entrada.');
      } else {
        setError('Ocurrió un error. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const redirectTo =
        redirect === 'checkout' && productId
          ? `${window.location.origin}/login?redirect=checkout&product_id=${productId}`
          : `${window.location.origin}/dashboard`;
      await signInWithGoogle(redirectTo);
    } catch {
      setError('Error al conectar con Google. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">NK</span>
            </div>
            <span className="font-display font-bold text-white text-2xl">NeuroKids</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white mt-4">
            {isSignUp ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            {isSignUp ? 'Empieza a enseñar IA hoy' : 'Accede a tus kits educativos'}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              {message}
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-gray-800 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-sm"
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
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0d0d20] px-3 text-white/40">o con email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="input-field"
                  placeholder="María González"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Cargando...'
                : isSignUp
                ? 'Crear cuenta'
                : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
              className="text-primary hover:text-primary/80 font-semibold"
            >
              {isSignUp ? 'Inicia sesión' : 'Regístrate gratis'}
            </button>
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Al registrarte aceptas nuestros Términos de Servicio y Política de Privacidad.
        </p>
      </div>
    </div>
  );
}
