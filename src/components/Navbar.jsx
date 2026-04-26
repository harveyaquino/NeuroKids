import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  function handleSignOut() {
    setOpen(false);
    signOut();
    navigate('/', { replace: true });
  }

  const active = (path) =>
    location.pathname === path
      ? 'bg-primary-light text-primary'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();

  return (
    <nav className="fixed w-full z-50 top-0 left-0 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary-dark transition-colors">
              <span className="text-white font-bold text-xs">NK</span>
            </div>
            <span className="font-display font-bold text-gray-900 text-lg">
              Neuro<span className="text-primary">Kids</span>
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <Link to="/dashboard" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active('/dashboard')}`}>
                  Mis Kits
                </Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active('/admin')}`}>
                    Admin
                  </Link>
                )}
                <div className="w-px h-5 bg-gray-200 mx-2" />
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{initial}</span>
                  </div>
                  <span className="text-sm text-gray-700 font-medium max-w-[130px] truncate">
                    {profile?.full_name?.split(' ')[0] || user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-2 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-900 px-4 py-1.5 rounded-lg transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Iniciar sesión
                </Link>
                <Link to="/login?mode=signup" className="btn-primary !py-2 !px-4 text-sm ml-1">
                  Registrarse gratis
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Menú"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{initial}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {profile?.full_name || user.email}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-1">
                  <Link to="/dashboard" onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Mis Kits
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
                      Admin
                    </Link>
                  )}
                  <button onClick={handleSignOut}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 mt-1">
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Iniciar sesión
                </Link>
                <Link to="/login?mode=signup" onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary-light">
                  Registrarse gratis →
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
