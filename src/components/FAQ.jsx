import { useState } from 'react';

const FAQS = [
  {
    q: '¿Necesito conocer de IA para usar el kit?',
    a: 'Para nada. El kit incluye una Guía Docente completa con explicaciones claras y actividades paso a paso. Está diseñado para que cualquier docente pueda facilitarlo sin conocimientos previos en tecnología o inteligencia artificial.',
  },
  {
    q: '¿Qué materiales necesito además del PDF?',
    a: 'Solo necesitas una impresora, tijeras y opcionalmente cartulina para las fichas. El kit es 100% imprimible. Recomendamos papel bond 75g para las fichas y cartulina delgada para el tablero.',
  },
  {
    q: '¿Para qué edades está diseñado?',
    a: 'El Kit #1 está diseñado para niños de 6 a 12 años (primaria). Las actividades se adaptan: los más pequeños las hacen de forma intuitiva y lúdica, mientras los mayores profundizan en los conceptos.',
  },
  {
    q: '¿Puedo usar el kit con todo el salón?',
    a: 'Sí. La guía docente está diseñada para grupos de 20 a 35 estudiantes. El PDF incluye materiales para imprimir múltiples juegos de componentes y trabajar en equipos pequeños.',
  },
  {
    q: '¿Cómo recibo el archivo después de comprar?',
    a: 'Inmediatamente después de confirmar tu pago, el PDF queda disponible en tu dashboard personal. Puedes descargarlo cuantas veces quieras con tu cuenta activa en NeuroKids.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 pr-4 text-sm sm:text-base">{faq.q}</span>
            <svg
              className={`flex-shrink-0 w-5 h-5 text-gray-400 transition-transform duration-200 ${open === i ? 'rotate-180 text-primary' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed bg-gray-50/50">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
