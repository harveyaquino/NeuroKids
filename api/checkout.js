import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function setCorsHeaders(res, origin) {
  const allowed = process.env.VITE_APP_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', origin === allowed ? allowed : allowed);
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
  setCorsHeaders(res, req.headers.origin);

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
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Parse body
  let body;
  try {
    // req.body may already be parsed by Vercel runtime
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

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Perfil de usuario no encontrado' });
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Producto no encontrado o inactivo' });
    }

    // Check for existing completed purchase (avoid duplicate charges)
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPurchase) {
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

    const appUrl = process.env.VITE_APP_URL || `https://${process.env.VERCEL_URL}`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: profile.email,
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      metadata: {
        user_id: user.id,
        product_id,
        purchase_id: purchase.id,
      },
      locale: 'es',
    });

    // Store session ID in purchase
    await supabase
      .from('purchases')
      .update({ stripe_session_id: session.id })
      .eq('id', purchase.id);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
