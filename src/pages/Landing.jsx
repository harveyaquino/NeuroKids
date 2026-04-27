import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import FAQ from '../components/FAQ.jsx';
import KitCard from '../components/KitCard.jsx';

/* ─── Static data ───────────────────────────────────────── */
const BENEFITS = [
  { icon: '📵', title: 'Sin pantallas', desc: 'Todo en papel. Los niños aprenden IA tocando, armando y jugando.' },
  { icon: '🖨️', title: 'Listo para imprimir', desc: 'Descarga el PDF y en 20 minutos tienes el kit armado.' },
  { icon: '📋', title: 'Guía paso a paso', desc: '3 sesiones de 45 min con instrucciones claras para cualquier docente.' },
  { icon: '🤖', title: 'IA real, no juguetes', desc: 'Los mismos conceptos de ChatGPT: tokens, probabilidad, temperatura.' },
];

const KIT_CONTENTS = [
  { icon: '🗺️', item: 'Tablero de contexto armable',         color: 'bg-blue-50   text-blue-600'   },
  { icon: '🃏', item: '60 fichas de tokens recortables',      color: 'bg-purple-50 text-purple-600' },
  { icon: '🎡', item: 'Rueda de probabilidad giratoria',      color: 'bg-green-50  text-green-600'  },
  { icon: '🌡️', item: 'Dial de temperatura PRECISO ↔ CREATIVO', color: 'bg-orange-50 text-orange-600' },
  { icon: '🪟', item: 'Ventana de contexto deslizable',       color: 'bg-sky-50    text-sky-600'    },
  { icon: '🎯', item: '10 tarjetas de misión',                color: 'bg-rose-50   text-rose-600'   },
  { icon: '📖', item: 'Guía docente: 3 sesiones de 45 min',  color: 'bg-amber-50  text-amber-600'  },
];

const COMING_SOON = [
  { number: 2, name: 'Háblale bien a la IA',       description: 'Prompt engineering para niños. Aprende a formular las preguntas correctas.',       icon: '💬', available: false },
  { number: 3, name: 'La IA que imagina',           description: 'Cómo las IAs generan imágenes. Difusión, espacio latente y creatividad.',           icon: '🎨', available: false },
  { number: 4, name: 'Cuando la IA se equivoca',    description: 'Sesgos, alucinaciones y pensamiento crítico frente a la IA.',                       icon: '🔍', available: false },
];

const AUDIENCES = [
  { icon: '🏫', title: 'Docentes de primaria',       desc: 'Cualquier área que quiera incorporar IA en el aula sin necesitar ser experto en tecnología.' },
  { icon: '🔬', title: 'Colegios y programas STEM',  desc: 'Instituciones que buscan contenido de IA actualizado, práctico y alineado al currículo.' },
  { icon: '👨‍👩‍👧', title: 'Padres y familias',         desc: 'Para explorar la IA juntos en casa. Sin pantallas, solo conversación, juego y aprendizaje real.' },
  { icon: '🎒', title: 'Talleres extracurriculares', desc: 'Clubes de tecnología, robótica y ciencias para niños de 6 a 12 años.' },
];

const TESTIMONIALS = [
  { name: 'Carmen Villanueva', role: 'Docente de 5to primaria',  school: 'I.E. San Martín de Porres, Lima',    quote: 'Mis alumnos nunca habían prestado tanta atención. Entendieron cómo "recuerda" la IA en menos de 10 minutos con el tablero de contexto.', initials: 'CV' },
  { name: 'Roberto Quispe',    role: 'Coordinador STEM',         school: 'Colegio Los Álamos, Arequipa',       quote: 'Lo implementamos en el taller extracurricular. Los niños de 8 años explicaron tokens a sus papás en casa. Eso no tiene precio.',            initials: 'RQ' },
  { name: 'Lucía Mendoza',     role: 'Docente de Ciencias',      school: 'I.E. Rosa de Lima, Trujillo',        quote: 'Sin conocer nada de IA lo pude facilitar perfectamente. La guía docente es clarísima y el material tiene un diseño muy cuidado.',           initials: 'LM' },
];

const FAMILY_BENEFITS = [
  { icon: '🏠', title: 'En casa, en 45 minutos', desc: 'Sin preparación previa. Abres el kit, imprimes y empiezas.' },
  { icon: '🎲', title: 'Aprenden jugando', desc: 'Actividades manuales que mantienen a los niños 100% comprometidos.' },
  { icon: '🗣️', title: 'Conversaciones reales', desc: 'El kit abre diálogos sobre tecnología que conectan a padres e hijos.' },
  { icon: '🧠', title: 'Ventaja para su futuro', desc: 'Entienden la IA desde pequeños, cuando el mundo la da por sentada.' },
];

/* ─── Kit mockup visual ─────────────────────────────────── */
function KitMockup() {
  return (
    <div className="relative max-w-sm mx-auto lg:mx-0">
      <div className="absolute inset-0 bg-blue-100  rounded-3xl rotate-3   scale-[0.97]" />
      <div className="absolute inset-0 bg-orange-50 rounded-3xl -rotate-2  scale-[0.99]" />
      <div className="relative bg-white rounded-3xl shadow-2xl p-7 border border-gray-100">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-gray-900 text-sm">Así piensa la IA</div>
            <div className="text-gray-500 text-xs">Kit #1 — ConociendoIA.com</div>
          </div>
          <div className="bg-accent text-white text-sm font-bold px-3 py-1.5 rounded-full shrink-0">S/ 49</div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: '🃏', label: '60 fichas de tokens',   bg: 'bg-blue-50'   },
            { icon: '🎡', label: 'Rueda probabilidad',    bg: 'bg-purple-50' },
            { icon: '🌡️', label: 'Dial temperatura',      bg: 'bg-orange-50' },
            { icon: '🗺️', label: 'Tablero contexto',      bg: 'bg-green-50'  },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl p-3 flex flex-col items-center text-center`}>
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs text-gray-700 font-medium leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📖</span>
          <div>
            <div className="text-xs font-bold text-gray-900">Guía Docente completa</div>
            <div className="text-xs text-gray-500">3 sesiones · 45 min cada una</div>
          </div>
          <span className="ml-auto text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">Incluida</span>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-900">Descarga inmediata</div>
          <div className="text-xs text-gray-500">Listo en 20 min</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Waitlist form ─────────────────────────────────────── */
function WaitlistForm() {
  const [email, setEmail]     = useState('');
  const [type, setType]       = useState('docente');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: dbError } = await supabase
        .from('waitlist')
        .insert({ email, type });
      if (dbError) throw dbError;
      setDone(true);
    } catch {
      setError('Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-semibold text-lg">¡Listo! Te avisamos primero.</p>
        <p className="text-blue-200 text-sm">Revisa tu bandeja de entrada.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="tu@email.com"
        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-white transition-all cursor-pointer"
      >
        <option value="docente"  className="text-gray-900">Soy docente</option>
        <option value="familia"  className="text-gray-900">Soy padre/madre</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="bg-white hover:bg-gray-100 text-primary font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60 whitespace-nowrap"
      >
        {loading ? 'Enviando...' : 'Unirme →'}
      </button>
      {error && <p className="text-red-300 text-sm w-full sm:col-span-3">{error}</p>}
    </form>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function Landing() {
  const { user, isEmailVerified } = useAuth();
  const navigate  = useNavigate();
  const kit1Ref   = useRef(null);

  const [kit1, setKit1]                   = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [purchasedIds, setPurchasedIds]   = useState(new Set());

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setKit1(data));
  }, []);

  useEffect(() => {
    if (!user) { setPurchasedIds(new Set()); return; }
    supabase
      .from('purchases')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .then(({ data }) => {
        if (data) setPurchasedIds(new Set(data.map((p) => p.product_id)));
      });
  }, [user]);

  const scrollToKit = () =>
    kit1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleCheckout = async (productId) => {
    setCheckoutError('');
    if (!user) {
      navigate(productId
        ? `/login?redirect=checkout&product_id=${productId}`
        : '/login');
      return;
    }
    if (!productId) {
      setCheckoutError('No se pudo cargar el producto. Recarga la página e inténtalo de nuevo.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago');
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err.message || 'Error al procesar el pago. Inténtalo de nuevo.');
      setCheckoutLoading(false);
    }
  };

  const kit1Data = kit1 ? {
    number: 1, name: kit1.name, description: kit1.description,
    icon: '🧠', available: true,
    price: (kit1.price / 100).toFixed(0), originalPrice: 79,
    productId: kit1.id,
  } : null;

  return (
    <div className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pt-20 pb-14 sm:pt-28 sm:pb-20 px-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-orange-50 pointer-events-none" style={{ height: '85vh' }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">

            {/* Texto */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary-dark text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-blue-200">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Para docentes de Perú y Latinoamérica
              </div>

              <h1 className="font-display font-black text-4xl sm:text-5xl text-gray-900 leading-[1.1] mb-5">
                Tus alumnos ya usan IA.{' '}
                <span className="text-primary">¿Sabes cómo enseñarles a entenderla?</span>
              </h1>

              <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-lg">
                Kits imprimibles para enseñar IA generativa a niños de 6 a 12 años.
                Sin pantallas, sin código, listo para usar mañana.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button onClick={scrollToKit} className="btn-primary text-base py-3.5 px-7">
                  Ver el Kit #1 →
                </button>
                <button onClick={scrollToKit} className="btn-secondary text-base py-3.5 px-7">
                  ¿Qué incluye?
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                {['Descarga inmediata', 'Pago 100% seguro', 'Garantía 30 días'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className="lg:pl-8">
              <KitMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── PAÍSES ───────────────────────────────────────────── */}
      <div className="border-y border-gray-200 bg-gray-50 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-600 font-medium">
          {['🇵🇪 Perú', '🇲🇽 México', '🇨🇴 Colombia', '🇦🇷 Argentina', '🇨🇱 Chile'].map(c => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── PROBLEMA ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label mb-3">El problema</p>
            <h2 className="section-title">La IA llegó al mundo,<br />pero no a las aulas</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '🌐', title: 'La IA es el tema del siglo pero nadie la enseña en las aulas', desc: 'El 94% de docentes no ha recibido capacitación en IA para el aula.' },
              { icon: '💻', title: 'Los recursos existentes son pantallas o demasiado técnicos',  desc: 'Todo requiere internet, dispositivos o conocimientos de programación.' },
              { icon: '🗺️', title: 'Los docentes no saben por dónde empezar',                     desc: 'No hay materiales adaptados al currículo latinoamericano ni a edades de primaria.' },
            ].map((p) => (
              <div key={p.title} className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-display font-bold text-gray-900 text-base mb-2">{p.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUCIÓN ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label mb-3">La solución</p>
            <h2 className="section-title">ConociendoIA: IA tangible,<br />aprendizaje real</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              Materiales 100% imprimibles pensados para docentes sin experiencia técnica,
              que convierten conceptos de IA en actividades físicas y divertidas.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-2xl mb-4">{b.icon}</div>
                <h3 className="font-display font-bold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KIT #1 ───────────────────────────────────────────── */}
      <section ref={kit1Ref} id="kit1" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="section-label">Kit #1</span>
              <span className="section-label">Kit educativo imprimible</span>
            </div>
            <h2 className="section-title">"Así piensa la IA"</h2>
            <p className="section-subtitle max-w-xl mx-auto">
              Acá entenderemos qué son los tokens, cómo funciona la probabilidad
              y para qué sirve la temperatura en la IA — los conceptos detrás de ChatGPT,
              explicados con materiales que los niños pueden tocar.
            </p>
          </div>

          {checkoutError && (
            <div className="mb-8 max-w-lg mx-auto p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center">
              {checkoutError}
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-3">
              <h3 className="font-display font-bold text-gray-900 text-xl mb-5">¿Qué incluye?</h3>
              <div className="space-y-3">
                {KIT_CONTENTS.map((c) => (
                  <div key={c.item} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <div className={`w-10 h-10 ${c.color} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{c.icon}</div>
                    <span className="text-gray-800 font-medium text-sm">{c.item}</span>
                    <svg className="ml-auto w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase card */}
            <div className="lg:col-span-2">
              <div className="bg-white border-2 border-blue-200 rounded-2xl p-7 shadow-xl lg:sticky lg:top-24">
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">✓ Disponible ahora</span>
                  <span className="bg-orange-50 text-accent text-xs font-bold px-3 py-1 rounded-full border border-orange-200">🚀 Precio de lanzamiento</span>
                </div>
                <h3 className="font-display font-bold text-gray-900 text-xl mb-1">Kit #1: Así piensa la IA</h3>
                <p className="text-gray-600 text-sm mb-6">Para niños 6–12 años · Imprimible · 3 sesiones</p>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-5xl font-display font-black text-gray-900">S/ 49</span>
                  <span className="text-gray-400 line-through text-xl">S/ 79</span>
                </div>
                <p className="text-green-600 text-sm font-semibold mb-7">Ahorras S/ 30 en precio de lanzamiento</p>
                {purchasedIds.has(kit1?.id) ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary w-full text-base py-4 mb-4"
                  >
                    ✓ Ir a mi Kit →
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckout(kit1?.id)}
                    disabled={checkoutLoading}
                    className="btn-primary w-full text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
                  >
                    {checkoutLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                        Procesando...
                      </span>
                    ) : '🛒  Comprar ahora — S/ 49'}
                  </button>
                )}
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
                  <div className="flex flex-col items-center gap-1"><span className="text-lg">🔒</span>Pago seguro</div>
                  <div className="flex flex-col items-center gap-1"><span className="text-lg">⚡</span>Descarga inmediata</div>
                  <div className="flex flex-col items-center gap-1"><span className="text-lg">↩️</span>30 días garantía</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LINEUP ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Colección completa</p>
            <h2 className="section-title">La línea ConociendoIA</h2>
            <p className="section-subtitle max-w-xl mx-auto">Una secuencia pedagógica completa para cubrir IA generativa de principio a fin.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {kit1Data && (
              <KitCard
                kit={kit1Data}
                onBuy={handleCheckout}
                loading={checkoutLoading}
                purchased={purchasedIds.has(kit1?.id)}
                onGoToKit={() => navigate('/dashboard')}
              />
            )}
            {COMING_SOON.map((kit) => <KitCard key={kit.number} kit={kit} />)}
          </div>
        </div>
      </section>

      {/* ── PARA FAMILIAS ────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-orange-200">
                👨‍👩‍👧 También para familias
              </div>
              <h2 className="section-title mb-4">
                ¿Tu hijo ya usa IA pero no sabe cómo funciona?
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                El Kit #1 no es solo para el aula. En casa, en 45 minutos,
                puedes explorar la IA junto a tus hijos — sin pantallas,
                sin necesitar ser experto en tecnología.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {FAMILY_BENEFITS.map((b) => (
                  <div key={b.title} className="flex gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{b.icon}</div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{b.title}</div>
                      <div className="text-gray-600 text-xs mt-0.5 leading-relaxed">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {purchasedIds.has(kit1?.id) ? (
                <button onClick={() => navigate('/dashboard')} className="btn-accent py-4 px-8 text-base">
                  ✓ Ir a mi Kit →
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(kit1?.id)}
                  disabled={checkoutLoading}
                  className="btn-accent py-4 px-8 text-base disabled:opacity-60"
                >
                  🛒 Comprar Kit para casa — S/ 49
                </button>
              )}
            </div>

            {/* Visual */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 border border-orange-100">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
                <h3 className="font-display font-bold text-gray-900 text-lg">Una tarde diferente en familia</h3>
                <p className="text-gray-600 text-sm mt-1">Sin tablets, sin distracciones, solo aprendizaje real</p>
              </div>
              <div className="space-y-3">
                {[
                  { time: '0 min',  text: 'Imprimen y recortan las fichas juntos', icon: '✂️' },
                  { time: '15 min', text: 'Arman el tablero de contexto',           icon: '🗺️' },
                  { time: '30 min', text: 'Juegan con la rueda de probabilidad',    icon: '🎡' },
                  { time: '45 min', text: '"Papá, ¡entiendo cómo piensa ChatGPT!"', icon: '🧠' },
                ].map((step) => (
                  <div key={step.time} className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-sm">
                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg w-14 text-center flex-shrink-0">{step.time}</span>
                    <span className="text-lg">{step.icon}</span>
                    <span className="text-sm text-gray-700 font-medium">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ES ────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Audiencia</p>
            <h2 className="section-title">¿Para quién es ConociendoIA?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="text-center p-7 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="text-4xl mb-4">{a.icon}</div>
                <h3 className="font-display font-bold text-gray-900 mb-2 text-base">{a.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ──────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Testimonios</p>
            <h2 className="section-title">Lo que dicen los docentes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.role} · {t.school}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TALLERES ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-white/20">
            🗓️ Próximamente
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-4 leading-tight">
            Talleres ConociendoIA
          </h2>
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Sesiones en vivo donde docentes aprenden a facilitar el kit
            y los niños viven la experiencia completa — presencial y online.
          </p>

          {/* Dos tipos de taller */}
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {[
              {
                icon: '👩‍🏫',
                title: 'Para docentes',
                desc: 'Aprende a llevar las 3 sesiones del Kit #1 en tu aula. Resolución de dudas, adaptaciones por edad y estrategias de facilitación.',
                tag: 'Formación docente',
                color: 'border-blue-500/30 bg-blue-500/10',
              },
              {
                icon: '👧',
                title: 'Para niños',
                desc: 'Taller donde los niños viven la experiencia ConociendoIA en grupo, guiados por un facilitador. Edades 6–12 años.',
                tag: 'Taller para niños',
                color: 'border-orange-500/30 bg-orange-500/10',
              },
            ].map((t) => (
              <div key={t.title} className={`border ${t.color} rounded-2xl p-6 text-left`}>
                <div className="text-4xl mb-4">{t.icon}</div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.tag}</span>
                <h3 className="font-display font-bold text-white text-lg mt-1 mb-2">{t.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-gray-400 mb-6">
            Sé de los primeros en enterarte cuando lancemos fechas y precios.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Preguntas frecuentes</p>
            <h2 className="section-title">Resolvemos tus dudas</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-4 leading-tight">
            Tu aula puede ser donde los niños entiendan la IA
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            Únete a los docentes que ya están preparando a sus alumnos para el futuro.
          </p>
          {purchasedIds.has(kit1?.id) ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white hover:bg-gray-50 text-primary font-bold text-lg py-4 px-12 rounded-xl transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] cursor-pointer"
            >
              ✓ Ir a mi Kit →
            </button>
          ) : (
            <button
              onClick={() => handleCheckout(kit1?.id)}
              disabled={checkoutLoading}
              className="bg-white hover:bg-gray-50 text-primary font-bold text-lg py-4 px-12 rounded-xl transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {checkoutLoading ? 'Procesando...' : 'Comprar Kit #1 — S/ 49 →'}
            </button>
          )}
          <p className="text-blue-200 text-sm mt-4">Precio de lanzamiento · Descarga inmediata · Garantía 30 días</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-gray-900 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">CI</span>
            </div>
            <span className="font-display font-bold text-white">Conociendo<span className="text-blue-400">IA</span></span>
            <span className="text-gray-500 text-sm hidden sm:inline">— Aprende IA sin pantallas</span>
          </div>
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <span>Creado por{' '}
              <a href="https://www.linkedin.com/in/harveyaquinomas/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                Harvey Aquino
              </a>
            </span>
            <span>© 2026 ConociendoIA</span>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FLOAT ───────────────────────────────────── */}
      <a
        href="https://wa.me/51979572350?text=Hola%20necesito%20información%20donde%20adquirir%20el%20kit"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform"
        style={{ backgroundColor: '#25D366' }}
        aria-label="Contactar por WhatsApp"
      >
        <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: '#25D366' }} />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7 relative">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L.057 23.882a.5.5 0 0 0 .606.63l6.288-1.648A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.12-1.438l-.368-.22-3.813 1 .994-3.7-.24-.38A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
        </svg>
      </a>
    </div>
  );
}
