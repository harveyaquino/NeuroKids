import { Link } from 'react-router-dom';

export default function Cancel() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-6">😕</div>
        <h1 className="text-3xl font-display font-bold text-white mb-3">
          Compra cancelada
        </h1>
        <p className="text-white/60 mb-10">
          No se realizó ningún cargo. Puedes volver cuando quieras para completar tu compra.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/" className="btn-primary">
            Volver al inicio
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            Mi dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
