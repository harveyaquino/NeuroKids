-- =========================================================
-- NeuroKids — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- TABLAS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  price           INTEGER NOT NULL,          -- en centavos (S/49 = 4900)
  stripe_price_id TEXT,                      -- ID del precio en Stripe
  pdf_path        TEXT,                      -- ruta relativa en bucket 'kit-pdfs'
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id                UUID NOT NULL REFERENCES public.products(id),
  stripe_session_id         TEXT,
  stripe_payment_intent_id  TEXT,
  status                    TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  amount_paid               INTEGER NOT NULL,  -- en centavos
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS purchases_user_id_idx         ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_product_id_idx      ON public.purchases(product_id);
CREATE INDEX IF NOT EXISTS purchases_stripe_session_idx  ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS purchases_status_idx          ON public.purchases(status);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases  ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──────────────────────────────────────────────

-- El usuario solo ve su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- El usuario solo edita su propio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- El usuario puede insertar su propio perfil (fallback si el trigger falla)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- El admin puede ver todos los perfiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ── PRODUCTS ──────────────────────────────────────────────

-- Lectura pública de productos activos
CREATE POLICY "products_select_active"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Admin puede ver todos (activos e inactivos)
CREATE POLICY "products_select_admin"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin puede insertar productos
CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin puede actualizar productos
CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── PURCHASES ─────────────────────────────────────────────

-- Usuario ve solo sus propias compras
CREATE POLICY "purchases_select_own"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Usuario puede insertar sus propias compras
CREATE POLICY "purchases_insert_own"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin ve todas las compras
CREATE POLICY "purchases_select_admin"
  ON public.purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =========================================================
-- STORAGE: Bucket privado para PDFs
-- =========================================================

-- Ejecutar SOLO UNA VEZ para crear el bucket privado
-- (o créalo desde el dashboard de Supabase: Storage > New Bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kit-pdfs',
  'kit-pdfs',
  false,                            -- bucket PRIVADO
  52428800,                         -- límite 50 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Solo usuarios con compra completada pueden descargar el PDF correspondiente
CREATE POLICY "kit_pdfs_select_purchased"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kit-pdfs' AND
    EXISTS (
      SELECT 1
      FROM public.purchases p
      JOIN public.products  pr ON pr.id = p.product_id
      WHERE p.user_id    = auth.uid()
        AND p.status     = 'completed'
        AND pr.pdf_path  = storage.objects.name
    )
  );

-- =========================================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- DATOS INICIALES: Kit #1
-- =========================================================
-- IMPORTANTE: Actualiza stripe_price_id con el ID real de tu producto en Stripe
-- Ejemplo: price_1PxXXXXXXXXXXXXXX

INSERT INTO public.products (name, description, price, stripe_price_id, pdf_path, is_active)
VALUES (
  'Kit #1: Así piensa la IA',
  'Enseña tokens, probabilidad y temperatura con materiales 100% imprimibles. Incluye tablero de contexto, 60 fichas de tokens, rueda de probabilidad, dial de temperatura y guía docente completa.',
  4900,
  'price_REEMPLAZA_CON_TU_PRICE_ID',
  'kit-01/kit-01-completo.pdf',
  true
)
ON CONFLICT DO NOTHING;
