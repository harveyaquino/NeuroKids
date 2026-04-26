import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' });

  let body;
  try {
    body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { product_id } = body;
  if (!product_id) return res.status(400).json({ error: 'product_id requerido' });

  try {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (!product) return res.status(404).json({ error: 'Producto no encontrado o inactivo' });

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

    // Create pending purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        product_id,
        status: 'pending',
        amount_paid: product.price,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Purchase insert error:', purchaseError);
      return res.status(500).json({ error: 'No se pudo crear el registro de compra' });
    }

    const appUrl =
      process.env.VITE_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');

    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: [
          {
            id: product.id,
            title: product.name,
            description: product.description || product.name,
            quantity: 1,
            unit_price: product.price / 100, // centavos → soles
            currency_id: 'PEN',
          },
        ],
        payer: { email: user.email },
        back_urls: {
          success: `${appUrl}/success`,
          failure: `${appUrl}/cancel`,
          pending: `${appUrl}/success`,
        },
        auto_return: 'approved',
        // external_reference = purchase ID para rastrear en webhook y success page
        external_reference: purchase.id,
        notification_url: `${appUrl}/api/webhook`,
      },
    });

    // Store MP preference ID
    await supabase
      .from('purchases')
      .update({ mp_preference_id: response.id })
      .eq('id', purchase.id);

    return res.status(200).json({ url: response.init_point });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
