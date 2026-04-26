-- =========================================================
-- 1. Actualizar bucket para aceptar archivos .docx
-- =========================================================
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/octet-stream',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf'
]
WHERE id = 'kit-pdfs';

-- =========================================================
-- 2. Actualizar política de storage para carpetas
--    (antes comparaba pdf_path con el nombre exacto del archivo,
--     ahora los archivos están en una carpeta kit-1/)
-- =========================================================
DROP POLICY IF EXISTS "kit_pdfs_select_purchased" ON storage.objects;

CREATE POLICY "kit_pdfs_select_purchased"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kit-pdfs' AND
    EXISTS (
      SELECT 1
      FROM public.purchases p
      JOIN public.products pr ON pr.id = p.product_id
      WHERE p.user_id  = auth.uid()
        AND p.status   = 'completed'
        AND storage.objects.name LIKE (pr.pdf_path || '/%')
    )
  );

-- =========================================================
-- 3. Asignar carpeta del kit a todos los productos activos
--    (todos comparten los mismos recursos por ahora)
-- =========================================================
UPDATE public.products
SET pdf_path = 'kit-1'
WHERE is_active = true;

-- =========================================================
-- 4. Marcar la compra pendiente más reciente como completada
--    (el pago ya fue aprobado por Mercado Pago)
-- =========================================================
UPDATE public.purchases
SET status = 'completed'
WHERE id = (
  SELECT id
  FROM public.purchases
  WHERE status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1
);

-- Verificación: ver el estado actual de compras y productos
SELECT p.id, p.status, p.amount_paid, p.created_at, pr.name, pr.pdf_path
FROM public.purchases p
JOIN public.products pr ON pr.id = p.product_id
ORDER BY p.created_at DESC
LIMIT 10;
