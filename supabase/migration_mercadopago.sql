-- =========================================================
-- Migración: Stripe → Mercado Pago
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================

-- Agregar columnas de Mercado Pago a purchases
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id    TEXT;

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS purchases_mp_preference_idx ON public.purchases(mp_preference_id);
CREATE INDEX IF NOT EXISTS purchases_mp_payment_idx    ON public.purchases(mp_payment_id);

-- Nota: stripe_session_id y stripe_payment_intent_id se mantienen
-- para no romper registros existentes. Puedes eliminarlos con:
-- ALTER TABLE public.purchases DROP COLUMN IF EXISTS stripe_session_id;
-- ALTER TABLE public.purchases DROP COLUMN IF EXISTS stripe_payment_intent_id;
-- ALTER TABLE public.products  DROP COLUMN IF EXISTS stripe_price_id;
