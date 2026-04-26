import { Link } from 'react-router-dom';

export default function Cancel() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white border border-gray-100 rounded-2xl shadow-sm p-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">Compra cancelada</h1>
        <p className="text-gray-500 mb-8">
          No se realizó ningún cargo. Puedes volver cuando quieras para completar tu compra.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary">Volver al inicio</Link>
          <Link to="/dashboard" className="btn-secondary">Mi dashboard</Link>
        </div>
      </div>
    </div>
  );
}
