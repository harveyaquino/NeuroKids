import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    VITE_SUPABASE_URL:        supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    MERCADOPAGO_ACCESS_TOKEN:  mpToken,
    VITE_APP_URL:              appUrlEnv,
    VERCEL_URL:                vercelUrl,
  } = process.env;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Faltan variables de Supabase' });
  }
  if (!mpToken) {
    return res.status(500).json({ error: 'Falta MERCADOPAGO_ACCESS_TOKEN' });
  }

  // ── Auth ─────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const userToken = authHeader.split(' ')[1];

  const supabase = createClient(supabaseUrl, serviceKey);

  let user;
  try {
    const { data, error } = await supabase.auth.getUser(userToken);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    user = data.user;
  } catch (e) {
    console.error('auth error:', e);
    return res.status(401).json({ error: 'Error al verificar sesión' });
  }

  // ── Body ─────────────────────────────────────────────────
  let body;
  try {
    body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(req.body || '{}');
  } catch {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  const { product_id } = body;
  if (!product_id) {
    return res.status(400).json({ error: 'product_id requerido' });
  }

  // ── Producto ──────────────────────────────────────────────
  let product;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();
    if (error || !data) {
      console.error('product query:', error);
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    product = data;
  } catch (e) {
    console.error('product error:', e);
    return res.status(500).json({ error: 'Error al buscar producto' });
  }

  // ── Compra duplicada ──────────────────────────────────────
  try {
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .eq('status', 'completed')
      .maybeSingle();
    if (existing) {
      return res.status(400).json({ error: 'Ya tienes este kit. Ve a tu dashboard.' });
    }
  } catch (e) {
    console.error('duplicate check:', e);
  }

  // ── Registro pending ──────────────────────────────────────
  let purchase;
  try {
    const { data, error } = await supabase
      .from('purchases')
      .insert({ user_id: user.id, product_id, status: 'pending', amount_paid: product.price })
      .select()
      .single();
    if (error || !data) {
      console.error('insert purchase:', error);
      return res.status(500).json({ error: 'No se pudo registrar la compra' });
    }
    purchase = data;
  } catch (e) {
    console.error('purchase insert error:', e);
    return res.status(500).json({ error: 'Error al registrar compra' });
  }

  // ── Mercado Pago — llamada directa via fetch ──────────────
  const appUrl = appUrlEnv || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:5173');
  const unitPrice = Number((product.price / 100).toFixed(2));

  const prefBody = {
    items: [{
      id:          String(product.id),
      title:       product.name,
      description: (product.description || product.name).slice(0, 255),
      quantity:    1,
      unit_price:  unitPrice,
      currency_id: 'PEN',
    }],
    payer:              { email: user.email },
    back_urls:          {
      success: `${appUrl}/success`,
      failure: `${appUrl}/cancel`,
      pending: `${appUrl}/success`,
    },
    auto_return:        'approved',
    external_reference: purchase.id,
    notification_url:   `${appUrl}/api/webhook`,
  };

  console.log('MP preference body:', JSON.stringify(prefBody));

  let mpData;
  try {
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(prefBody),
    });

    const mpText = await mpRes.text();
    console.log('MP response status:', mpRes.status, 'body:', mpText);

    if (!mpRes.ok) {
      return res.status(500).json({ error: `Error Mercado Pago: ${mpRes.status} — ${mpText}` });
    }

    mpData = JSON.parse(mpText);
  } catch (e) {
    console.error('MP fetch error:', e);
    return res.status(500).json({ error: 'Error al conectar con Mercado Pago' });
  }

  // Guardar preference ID (no bloqueante)
  supabase
    .from('purchases')
    .update({ mp_preference_id: mpData.id })
    .eq('id', purchase.id)
    .then(({ error }) => { if (error) console.error('mp_preference_id update:', error); });

  const checkoutUrl = mpData.init_point || mpData.sandbox_init_point;
  if (!checkoutUrl) {
    console.error('MP response missing init_point:', mpData);
    return res.status(500).json({ error: 'Respuesta inválida de Mercado Pago' });
  }

  return res.status(200).json({ url: checkoutUrl });
}
