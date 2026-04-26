-- =========================================================
-- FIX: Bucle infinito en políticas RLS
-- =========================================================
-- El problema: policies como "profiles_select_admin" hacen
-- SELECT en public.profiles desde dentro de una policy de
-- public.profiles → recursión infinita → error 500.
--
-- Solución: función SECURITY DEFINER que consulta profiles
-- sin activar RLS (corre como superuser).
-- =========================================================

-- 1. Función que verifica si el usuario actual es admin
--    SECURITY DEFINER = bypassa RLS → no hay recursión
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ── PROFILES ──────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ── PRODUCTS ──────────────────────────────────────────────

DROP POLICY IF EXISTS "products_select_admin" ON public.products;
CREATE POLICY "products_select_admin"
  ON public.products FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  USING (public.is_admin());

-- ── PURCHASES ─────────────────────────────────────────────

DROP POLICY IF EXISTS "purchases_select_admin" ON public.purchases;
CREATE POLICY "purchases_select_admin"
  ON public.purchases FOR SELECT
  USING (public.is_admin());

-- ── WAITLIST ──────────────────────────────────────────────

DROP POLICY IF EXISTS "waitlist_select_admin" ON public.waitlist;
CREATE POLICY "waitlist_select_admin"
  ON public.waitlist FOR SELECT
  USING (public.is_admin());
