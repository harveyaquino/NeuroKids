import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function setCorsHeaders(res) {
  const allowed = process.env.VITE_APP_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Parse body
  let body;
  try {
    body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(await readBody(req));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { product_id } = body;
  if (!product_id) {
    return res.status(400).json({ error: 'product_id requerido' });
  }

  // Verify the user has a completed purchase for this product
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('id, status')
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

  // Get product to find the pdf_path
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('pdf_path, name')
    .eq('id', product_id)
    .single();

  if (productError || !product?.pdf_path) {
    return res.status(404).json({ error: 'Archivo PDF no encontrado' });
  }

  // Generate signed URL — expires in 60 seconds
  const { data: signedData, error: signedError } = await supabase
    .storage
    .from('kit-pdfs')
    .createSignedUrl(product.pdf_path, 60);

  if (signedError || !signedData?.signedUrl) {
    console.error('Signed URL error:', signedError);
    return res.status(500).json({ error: 'No se pudo generar el enlace de descarga' });
  }

  return res.status(200).json({ url: signedData.signedUrl });
}
