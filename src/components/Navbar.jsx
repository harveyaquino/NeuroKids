import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 top-0 left-0 bg-dark/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/80 transition-colors">
              <span className="text-white font-bold text-xs">NK</span>
            </div>
            <span className="font-display font-bold text-white text-lg">NeuroKids</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-white/70 hover:text-white transition-colors text-sm font-medium"
                >
                  Mis Kits
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-white/70 hover:text-white transition-colors text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                <span className="text-white/40 text-sm truncate max-w-[160px]">
                  {profile?.full_name || user.email}
                </span>
                <button onClick={handleSignOut} className="btn-secondary !py-2 !px-4 text-sm">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white/70 hover:text-white transition-colors text-sm font-medium"
                >
                  Iniciar sesión
                </Link>
                <Link to="/login?mode=signup" className="btn-primary !py-2 !px-4 text-sm">
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-1"
            aria-label="Menú"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-4 space-y-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block text-white/70 hover:text-white text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Mis Kits
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block text-white/70 hover:text-white text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button onClick={handleSignOut} className="btn-secondary !py-2 w-full text-sm">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-white/70 hover:text-white text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="btn-primary !py-2 w-full text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
