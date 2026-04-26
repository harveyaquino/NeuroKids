import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  let body;
  try {
    body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(req.body || '{}');
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { product_id } = body;
  if (!product_id) return res.status(400).json({ error: 'product_id requerido' });

  // Verificar compra completada
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', product_id)
    .eq('status', 'completed')
    .maybeSingle();

  if (purchaseError) {
    console.error('Purchase query error:', purchaseError);
    return res.status(500).json({ error: 'Error al verificar compra' });
  }
  if (!purchase) {
    return res.status(403).json({ error: 'No tienes una compra completada para este producto' });
  }

  // Obtener la carpeta del producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('pdf_path, name')
    .eq('id', product_id)
    .single();

  if (productError || !product?.pdf_path) {
    return res.status(404).json({ error: 'Archivos no disponibles aún' });
  }

  // Listar archivos en la carpeta
  const { data: fileList, error: listError } = await supabase
    .storage
    .from('kit-pdfs')
    .list(product.pdf_path, { limit: 100, sortBy: { column: 'name', order: 'asc' } });

  if (listError || !fileList?.length) {
    console.error('List error:', listError);
    return res.status(500).json({ error: 'No se encontraron archivos' });
  }

  // Generar signed URLs (válidas 10 minutos)
  const files = await Promise.all(
    fileList
      .filter((f) => f.name && !f.name.startsWith('.'))
      .map(async (f) => {
        const path = `${product.pdf_path}/${f.name}`;
        const { data, error } = await supabase
          .storage
          .from('kit-pdfs')
          .createSignedUrl(path, 600);
        return { name: f.name, url: data?.signedUrl || null, error: error?.message };
      })
  );

  return res.status(200).json({ files });
}
