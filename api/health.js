export default async function handler(req, res) {
  const checks = {
    VITE_SUPABASE_URL:       !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    MERCADOPAGO_ACCESS_TOKEN:  !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    VITE_APP_URL:             !!process.env.VITE_APP_URL,
    VERCEL_URL:               process.env.VERCEL_URL || null,
    node:                     process.version,
  };

  let mpImport = 'ok';
  try {
    await import('mercadopago');
  } catch (e) {
    mpImport = e.message;
  }

  res.status(200).json({ ...checks, mpImport });
}
