import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import FAQ from '../components/FAQ.jsx';
import KitCard from '../components/KitCard.jsx';

const BENEFITS = [
  { icon: '📵', title: 'Sin pantallas', desc: 'Todo en papel: recorta, arma y juega. La IA se aprende con las manos.' },
  { icon: '🖨️', title: 'Listo para imprimir', desc: 'Descarga el PDF y en 20 minutos tienes el kit completo armado.' },
  { icon: '📋', title: 'Guía paso a paso', desc: '3 sesiones de 45 minutos con instrucciones claras para cualquier docente.' },
  { icon: '🤖', title: 'Basado en IA real', desc: 'Tokens, probabilidad y temperatura: los mismos conceptos de ChatGPT.' },
];

const KIT_CONTENTS = [
  { icon: '🗺️', item: 'Tablero de contexto armable' },
  { icon: '🃏', item: '60 fichas de tokens recortables' },
  { icon: '🎡', item: 'Rueda de probabilidad giratoria' },
  { icon: '🌡️', item: 'Dial de temperatura PRECISO ↔ CREATIVO' },
  { icon: '🪟', item: 'Ventana de contexto deslizable' },
  { icon: '🎯', item: '10 tarjetas de misión' },
  { icon: '📖', item: 'Guía docente: 3 sesiones de 45 min' },
];

const COMING_SOON_KITS = [
  { number: 2, name: 'Háblale bien a la IA', description: 'Prompt engineering para niños. Aprende a hacer las preguntas correctas.', icon: '💬', available: false },
  { number: 3, name: 'La IA que imagina', description: 'Cómo las IAs generan imágenes. Difusión, latente y creatividad artificial.', icon: '🎨', available: false },
  { number: 4, name: 'Cuando la IA se equivoca', description: 'Sesgos, alucinaciones y pensamiento crítico frente a la IA.', icon: '🔍', available: false },
];

const TESTIMONIALS = [
  { name: 'Prof. Carmen Villanueva', role: 'Docente de 5to primaria', school: 'I.E. San Martín de Porres, Lima', quote: 'Mis alumnos nunca habían prestado tanta atención. El tablero de contexto fue una revelación — entendieron cómo "recuerda" la IA en menos de 10 minutos.' },
  { name: 'Lic. Roberto Quispe', role: 'Coordinador STEM', school: 'Colegio Los Álamos, Arequipa', quote: 'Lo implementamos en el taller extracurricular de tecnología. Los niños de 8 años explicaron tokens a sus papás en casa. Eso no tiene precio.' },
  { name: 'Prof. Lucía Mendoza', role: 'Docente de ciencias', school: 'I.E. Rosa de Lima, Trujillo', quote: 'Sin conocer nada de IA lo pude facilitar perfectamente. La guía docente es clarísima y el material es muy bien diseñado.' },
];

const AUDIENCES = [
  { icon: '🏫', title: 'Docentes de primaria', desc: 'Para cualquier área que quiera incorporar pensamiento computacional en el aula.' },
  { icon: '🔬', title: 'Colegios STEM', desc: 'Programas de ciencia y tecnología que buscan contenido actualizado y práctico.' },
  { icon: '🎒', title: 'Talleres extracurriculares', desc: 'Clubes de tecnología, robótica y programación para edades 6-12.' },
];

export default function Landing() {
  const { user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const kit1Ref = useRef(null);

  const [kit1, setKit1] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

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

  const scrollToKit = () => {
    kit1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCheckout = async (productId) => {
    if (!productId) return;

    if (!user) {
      navigate(`/login?redirect=checkout&product_id=${productId}`);
      return;
    }

    if (!isEmailVerified()) {
      setCheckoutError('Debes verificar tu email antes de comprar. Revisa tu bandeja de entrada.');
      kit1Ref.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
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

  const kit1Data = kit1
    ? {
        number: 1,
        name: kit1.name,
        description: kit1.description,
        icon: '🧠',
        available: true,
        price: (kit1.price / 100).toFixed(0),
        originalPrice: 79,
        productId: kit1.id,
      }
    : null;

  return (
    <div className="bg-dark">
      {/* ───── HERO ───── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-hero-gradient overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Kits disponibles en Perú y Latinoamérica
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Enseña{' '}
            <span className="text-gradient">Inteligencia Artificial</span>
            {' '}con tus manos
          </h1>

          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Kits imprimibles para que tus alumnos entiendan cómo piensa la IA —
            sin pantallas, sin código, solo aprendizaje real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={scrollToKit}
              className="btn-accent text-base py-4 px-8"
            >
              Quiero el Kit #1 →
            </button>
            <button
              onClick={scrollToKit}
              className="btn-secondary text-base py-4 px-8"
            >
              Ver qué incluye
            </button>
          </div>

          <p className="text-white/30 text-sm mt-6">
            ✓ Descarga inmediata · ✓ Pago seguro · ✓ Garantía 30 días
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ───── EL PROBLEMA ───── */}
      <section className="py-20 px-4 bg-dark">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">El problema</span>
            <h2 className="section-title mt-3">La IA llegó al mundo,<br />pero no a las aulas</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '🌐', title: 'La IA es el tema del siglo pero nadie la enseña en las aulas', desc: 'El 94% de docentes peruanos no ha recibido ninguna capacitación en IA para el aula.' },
              { icon: '💻', title: 'Los recursos existentes son pantallas o demasiado técnicos', desc: 'Todo requiere internet, dispositivos o conocimientos de programación que la mayoría no tiene.' },
              { icon: '🗺️', title: 'Los docentes no saben por dónde empezar', desc: 'No hay materiales adaptados al currículo peruano ni a las edades de primaria.' },
            ].map((p) => (
              <div key={p.title} className="card border-red-500/10 bg-red-500/[0.03]">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="font-display font-bold text-white text-base mb-2">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── LA SOLUCIÓN ───── */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">La solución</span>
            <h2 className="section-title mt-3">
              NeuroKids: IA en tus manos,<br />literalmente
            </h2>
            <p className="section-subtitle mx-auto mt-4">
              Materiales 100% imprimibles, pensados para docentes sin experiencia técnica,
              que convierten conceptos de IA en actividades tangibles y divertidas.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card text-center hover:border-primary/40">
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="font-display font-bold text-white mb-2">{b.title}</h3>
                <p className="text-white/50 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── KIT #1 ───── */}
      <section ref={kit1Ref} id="kit1" className="py-20 px-4 bg-dark">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">Kit #1</span>
            <h2 className="section-title mt-3">
              "Así piensa la IA"
            </h2>
            <p className="section-subtitle mx-auto mt-4">
              Tokens, probabilidad y temperatura. Los mismos conceptos que hacen funcionar a ChatGPT,
              explicados con materiales que los niños pueden tocar.
            </p>
          </div>

          {checkoutError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center max-w-lg mx-auto">
              {checkoutError}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Contents */}
            <div>
              <h3 className="font-display font-bold text-white text-xl mb-6">¿Qué incluye?</h3>
              <div className="space-y-3">
                {KIT_CONTENTS.map((c) => (
                  <div key={c.item} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-colors">
                    <span className="text-2xl flex-shrink-0">{c.icon}</span>
                    <span className="text-white font-medium">{c.item}</span>
                    <svg className="ml-auto w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase card */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-8 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full">
                  ✓ Disponible ahora
                </span>
                <span className="bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full">
                  Lanzamiento
                </span>
              </div>

              <h3 className="font-display font-bold text-white text-2xl mb-2">
                Kit #1: Así piensa la IA
              </h3>
              <p className="text-white/60 text-sm mb-6">
                Para niños de 6 a 12 años · 3 sesiones de 45 min · Imprimible en casa
              </p>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-display font-black text-white">S/ 49</span>
                <span className="text-white/40 line-through text-xl">S/ 79</span>
              </div>
              <p className="text-green-400 text-sm font-semibold mb-8">
                Ahorras S/ 30 en precio de lanzamiento
              </p>

              <button
                onClick={() => kit1Data && handleCheckout(kit1Data.productId)}
                disabled={checkoutLoading || !kit1}
                className="btn-accent w-full text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-dark" />
                    Procesando...
                  </span>
                ) : !kit1 ? (
                  'Cargando...'
                ) : (
                  '🛒 Comprar ahora — S/ 49'
                )}
              </button>

              <div className="mt-4 flex flex-col gap-2 text-center">
                <p className="text-white/30 text-xs">
                  Pago 100% seguro con Stripe · Descarga inmediata
                </p>
                <div className="flex items-center justify-center gap-4 text-white/20 text-xs">
                  <span>🔒 SSL</span>
                  <span>💳 Tarjeta</span>
                  <span>📧 Recibo</span>
                  <span>↩️ 30 días</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── LINEUP DE KITS ───── */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">Colección completa</span>
            <h2 className="section-title mt-3">La línea NeuroKids</h2>
            <p className="section-subtitle mx-auto mt-4">
              Una secuencia pedagógica completa para cubrir IA generativa de principio a fin.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {kit1Data && (
              <KitCard
                key="kit1"
                kit={kit1Data}
                onBuy={handleCheckout}
                loading={checkoutLoading}
              />
            )}
            {COMING_SOON_KITS.map((kit) => (
              <KitCard key={kit.number} kit={kit} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── PARA QUIÉN ES ───── */}
      <section className="py-20 px-4 bg-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">Audiencia</span>
            <h2 className="section-title mt-3">¿Para quién es NeuroKids?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="card text-center hover:border-accent/30">
                <div className="text-4xl mb-4">{a.icon}</div>
                <h3 className="font-display font-bold text-white mb-2">{a.title}</h3>
                <p className="text-white/50 text-sm">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIOS ───── */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">Testimonios</span>
            <h2 className="section-title mt-3">Lo que dicen los docentes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card flex flex-col">
                <div className="text-4xl text-primary/40 font-display mb-4 leading-none">"</div>
                <p className="text-white/70 text-sm leading-relaxed flex-1 mb-6 italic">
                  {t.quote}
                </p>
                <div className="border-t border-white/10 pt-4">
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">{t.role}</div>
                  <div className="text-primary text-xs mt-0.5">{t.school}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="py-20 px-4 bg-dark">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">Preguntas frecuentes</span>
            <h2 className="section-title mt-3">Resolvemos tus dudas</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ───── CTA FINAL ───── */}
      <section className="py-24 px-4 bg-cta-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,217,61,0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-4 leading-tight">
            Tu aula puede ser el lugar donde los niños entiendan la IA
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Únete a los docentes que ya están preparando a sus alumnos para el futuro.
          </p>
          <button
            onClick={() => kit1Data ? handleCheckout(kit1Data.productId) : scrollToKit()}
            disabled={checkoutLoading}
            className="btn-accent text-lg py-5 px-12 disabled:opacity-60"
          >
            {checkoutLoading ? 'Procesando...' : 'Comprar Kit #1 — S/ 49 →'}
          </button>
          <p className="text-white/40 text-sm mt-4">Precio de lanzamiento · Descarga inmediata · Garantía 30 días</p>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="bg-dark border-t border-white/10 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">NK</span>
            </div>
            <span className="font-display font-bold text-white">NeuroKids</span>
            <span className="text-white/30 text-sm ml-2">— Aprende IA como nunca lo imaginaste</span>
          </div>
          <div className="flex items-center gap-4 text-white/40 text-sm">
            <span>
              Creado por{' '}
              <a
                href="https://www.linkedin.com/in/harveyaquinomas/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Harvey Aquino
              </a>
            </span>
            <span>© 2025 NeuroKids</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
