import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verificar variables de entorno requeridas
  const {
    VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    MERCADOPAGO_ACCESS_TOKEN,
  } = process.env;

  if (!VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('checkout: faltan variables de Supabase');
    return res.status(500).json({ error: 'Configuración del servidor incompleta (Supabase)' });
  }
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.error('checkout: falta MERCADOPAGO_ACCESS_TOKEN');
    return res.status(500).json({ error: 'Configuración del servidor incompleta (MercadoPago)' });
  }

  // Verificar auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];

  const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Parsear body
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
    // Buscar producto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      console.error('checkout: producto no encontrado', productError);
      return res.status(404).json({ error: 'Producto no encontrado o inactivo' });
    }

    // Verificar compra duplicada
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .eq('status', 'completed')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Ya tienes este kit. Ve a tu dashboard para descargarlo.' });
    }

    // Crear registro pending
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id:     user.id,
        product_id,
        status:      'pending',
        amount_paid: product.price,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('checkout: error insertando purchase', purchaseError);
      return res.status(500).json({ error: 'No se pudo registrar la compra' });
    }

    const appUrl =
      process.env.VITE_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');

    // Crear preferencia en Mercado Pago
    const mpClient = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN });
    const preference = new Preference(mpClient);

    const mpResponse = await preference.create({
      body: {
        items: [{
          id:          product.id,
          title:       product.name,
          description: product.description || product.name,
          quantity:    1,
          unit_price:  product.price / 100,   // centavos → soles
          currency_id: 'PEN',
        }],
        payer:              { email: user.email },
        back_urls:          {
          success: `${appUrl}/success`,
          failure: `${appUrl}/cancel`,
          pending: `${appUrl}/success`,
        },
        auto_return:        'approved',
        external_reference: purchase.id,       // lo usamos en webhook y success page
        notification_url:   `${appUrl}/api/webhook`,
      },
    });

    // Guardar preference ID
    await supabase
      .from('purchases')
      .update({ mp_preference_id: mpResponse.id })
      .eq('id', purchase.id);

    return res.status(200).json({ url: mpResponse.init_point });

  } catch (err) {
    console.error('checkout error:', err?.message || err);
    return res.status(500).json({ error: 'Error interno. Inténtalo de nuevo.' });
  }
}
