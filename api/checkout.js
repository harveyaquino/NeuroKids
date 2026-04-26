import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Verificar variables de entorno ──────────────────────
  const {
    VITE_SUPABASE_URL:        supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    MERCADOPAGO_ACCESS_TOKEN:  mpToken,
    VITE_APP_URL:              appUrlEnv,
    VERCEL_URL:                vercelUrl,
  } = process.env;

  if (!supabaseUrl || !serviceKey) {
    console.error('checkout: missing Supabase env vars');
    return res.status(500).json({ error: 'Configuración incompleta — variables de Supabase no encontradas' });
  }
  if (!mpToken) {
    console.error('checkout: missing MERCADOPAGO_ACCESS_TOKEN');
    return res.status(500).json({ error: 'Configuración incompleta — MERCADOPAGO_ACCESS_TOKEN no configurado en Vercel' });
  }

  // ── Auth ─────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
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
  if (!product_id) return res.status(400).json({ error: 'product_id requerido' });

  try {
    // ── Producto ───────────────────────────────────────────
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      console.error('checkout: product not found', productError);
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // ── Sin duplicados ─────────────────────────────────────
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

    // ── Registro pending ───────────────────────────────────
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({ user_id: user.id, product_id, status: 'pending', amount_paid: product.price })
      .select()
      .single();

    if (purchaseError) {
      console.error('checkout: insert purchase error', purchaseError);
      return res.status(500).json({ error: 'No se pudo registrar la compra' });
    }

    const appUrl = appUrlEnv || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:5173');

    // ── Mercado Pago (import dinámico para capturar errores de carga) ──
    let MercadoPagoConfig, Preference;
    try {
      const mp = await import('mercadopago');
      MercadoPagoConfig = mp.MercadoPagoConfig;
      Preference        = mp.Preference;
    } catch (importErr) {
      console.error('checkout: failed to import mercadopago', importErr);
      return res.status(500).json({ error: 'Error al cargar el SDK de pagos' });
    }

    const mpClient = new MercadoPagoConfig({ accessToken: mpToken });
    const prefApi  = new Preference(mpClient);

    const mpResponse = await prefApi.create({
      body: {
        items: [{
          id:          product.id,
          title:       product.name,
          description: product.description || product.name,
          quantity:    1,
          unit_price:  product.price / 100,
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
      },
    });

    await supabase
      .from('purchases')
      .update({ mp_preference_id: mpResponse.id })
      .eq('id', purchase.id);

    return res.status(200).json({ url: mpResponse.init_point });

  } catch (err) {
    console.error('checkout unhandled error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Error interno. Inténtalo de nuevo.' });
  }
}
