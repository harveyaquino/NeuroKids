import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed w-full z-50 top-0 left-0 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
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
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/dashboard') ? 'bg-primary-light text-primary' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  Mis Kits
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin') ? 'bg-primary-light text-primary' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    Admin
                  </Link>
                )}
                <div className="w-px h-5 bg-gray-200 mx-2" />
                <span className="text-sm text-gray-500 max-w-[140px] truncate">
                  {profile?.full_name?.split(' ')[0] || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Iniciar sesión
                </Link>
                <Link to="/login?mode=signup" className="btn-primary !py-2 !px-4 text-sm ml-1">
                  Registrarse gratis
                </Link>
              </>
            )}
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {user ? (
              <>
                <Link to="/dashboard" className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Mis Kits</Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Admin</Link>
                )}
                <button onClick={handleSignOut} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50">Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
                <Link to="/login?mode=signup" className="block px-3 py-2 rounded-lg text-sm font-semibold text-primary" onClick={() => setMenuOpen(false)}>Registrarse gratis</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
