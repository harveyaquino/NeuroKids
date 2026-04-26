export default function KitCard({ kit, onBuy, loading }) {
  return (
    <div className={`card flex flex-col ${kit.available ? 'hover:-translate-y-1' : 'opacity-60'} transition-transform duration-300`}>
      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-2xl">
        {kit.icon}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
          Kit #{kit.number}
        </span>
        {!kit.available && (
          <span className="bg-white/10 text-white/40 text-xs px-2 py-0.5 rounded-full">
            Próximamente
          </span>
        )}
      </div>
      <h3 className="font-display font-bold text-white text-lg mb-2">{kit.name}</h3>
      <p className="text-white/60 text-sm flex-1 mb-4">{kit.description}</p>

      {kit.available ? (
        <>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-display font-bold text-white">S/ {kit.price}</span>
            {kit.originalPrice && (
              <span className="text-white/40 line-through text-sm">S/ {kit.originalPrice}</span>
            )}
            {kit.originalPrice && (
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-semibold ml-1">
                -{Math.round((1 - kit.price / kit.originalPrice) * 100)}%
              </span>
            )}
          </div>
          <button
            onClick={() => onBuy && onBuy(kit.productId)}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Comprar Kit'}
          </button>
        </>
      ) : (
        <div className="mt-auto pt-4 border-t border-white/10 text-center text-white/40 text-sm">
          Disponible pronto
        </div>
      )}
    </div>
  );
}
