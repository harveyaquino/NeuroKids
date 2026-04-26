import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  // Mercado Pago requiere respuesta 200 inmediata (dentro de 5 segundos)
  res.status(200).end();

  try {
    // MP envía notificaciones de dos formas:
    //   Webhooks: POST { type: 'payment', data: { id: 'PAYMENT_ID' } }
    //   IPN:      POST/GET ?topic=payment&id=PAYMENT_ID
    const topic = req.query.topic || req.body?.type;
    const paymentId = req.query.id || req.body?.data?.id;

    if (topic !== 'payment' || !paymentId) return;

    const paymentApi = new Payment(mpClient);
    const payment = await paymentApi.get({ id: String(paymentId) });

    if (!payment?.external_reference) return;

    const purchaseId = payment.external_reference;

    if (payment.status === 'approved') {
      await supabase
        .from('purchases')
        .update({
          status: 'completed',
          mp_payment_id: String(paymentId),
        })
        .eq('id', purchaseId)
        .neq('status', 'completed'); // idempotente
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await supabase
        .from('purchases')
        .update({ status: 'failed' })
        .eq('id', purchaseId)
        .eq('status', 'pending');
    }
  } catch (err) {
    console.error('Webhook MP error:', err);
  }
}
