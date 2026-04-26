export default function KitCard({ kit, onBuy, loading, purchased, onGoToKit }) {
  return (
    <div className={`bg-white border rounded-2xl p-6 flex flex-col transition-all duration-300 ${
      kit.available
        ? 'border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer'
        : 'border-gray-100 opacity-70'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 bg-primary-light rounded-xl flex items-center justify-center text-2xl">
          {kit.icon}
        </div>
        {!kit.available && (
          <span className="bg-gray-100 text-gray-400 text-xs font-semibold px-2.5 py-1 rounded-full">
            Próximamente
          </span>
        )}
        {kit.available && (
          <span className="bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">
            ✓ Disponible
          </span>
        )}
      </div>

      <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
        Kit #{kit.number}
      </div>
      <h3 className="font-display font-bold text-gray-900 text-lg mb-2 leading-snug">{kit.name}</h3>
      <p className="text-gray-500 text-sm flex-1 mb-5 leading-relaxed">{kit.description}</p>

      {kit.available ? (
        <>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-display font-bold text-gray-900">S/ {kit.price}</span>
            {kit.originalPrice && (
              <>
                <span className="text-gray-400 line-through text-sm">S/ {kit.originalPrice}</span>
                <span className="bg-orange-100 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
                  -{Math.round((1 - kit.price / kit.originalPrice) * 100)}%
                </span>
              </>
            )}
          </div>
          {purchased ? (
            <button
              onClick={() => onGoToKit && onGoToKit()}
              className="btn-primary w-full"
            >
              ✓ Ir a mi Kit →
            </button>
          ) : (
            <button
              onClick={() => onBuy && onBuy(kit.productId)}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Procesando...</>
              ) : 'Comprar Kit'}
            </button>
          )}
        </>
      ) : (
        <div className="pt-4 border-t border-gray-100 text-center text-gray-400 text-sm font-medium">
          Disponible pronto
        </div>
      )}
    </div>
  );
}
