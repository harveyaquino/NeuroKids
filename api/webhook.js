import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // MP requiere respuesta 200 inmediata (dentro de 5 segundos)
  res.status(200).end();

  try {
    const topic = req.query.topic || req.body?.type;
    const paymentId = req.query.id || req.body?.data?.id;

    if (topic !== 'payment' || !paymentId) return;

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) { console.error('webhook: falta MERCADOPAGO_ACCESS_TOKEN'); return; }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    });

    if (!mpRes.ok) {
      console.error('webhook: MP payment fetch failed', mpRes.status, await mpRes.text());
      return;
    }

    const payment = await mpRes.json();
    console.log('webhook payment:', payment.id, payment.status, payment.external_reference);

    if (!payment?.external_reference) return;

    const purchaseId = payment.external_reference;

    if (payment.status === 'approved') {
      const { error } = await supabase
        .from('purchases')
        .update({ status: 'completed', mp_payment_id: String(paymentId) })
        .eq('id', purchaseId)
        .neq('status', 'completed');
      if (error) console.error('webhook update completed:', error);
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      const { error } = await supabase
        .from('purchases')
        .update({ status: 'failed' })
        .eq('id', purchaseId)
        .eq('status', 'pending');
      if (error) console.error('webhook update failed:', error);
    }
  } catch (err) {
    console.error('Webhook MP error:', err);
  }
}
