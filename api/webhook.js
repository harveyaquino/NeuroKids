import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Read raw body — required for signature verification
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { purchase_id } = session.metadata || {};

        if (!purchase_id) {
          console.warn('No purchase_id in session metadata');
          break;
        }

        const { error } = await supabase
          .from('purchases')
          .update({
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent,
          })
          .eq('id', purchase_id);

        if (error) {
          console.error('Error updating purchase to completed:', error);
          return res.status(500).json({ error: 'DB update failed' });
        }

        console.log(`Purchase ${purchase_id} marked as completed`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const { purchase_id } = session.metadata || {};

        if (purchase_id) {
          await supabase
            .from('purchases')
            .update({ status: 'failed' })
            .eq('id', purchase_id)
            .eq('status', 'pending');
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        // Mark purchase as refunded by payment_intent
        if (charge.payment_intent) {
          await supabase
            .from('purchases')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', charge.payment_intent);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Error processing webhook event:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  return res.status(200).json({ received: true });
}
