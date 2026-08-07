import { NextResponse } from 'next/server';
import { promoteListing } from '../../../lib/promotions';

// Stripe signature verification needs the exact raw body, so this route must
// not run on a cached/parsed request.
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook: applies a promotion once payment has actually completed.
 *
 * Without this, /api/checkout created a paid Checkout session but nothing ever
 * set isFeatured — customers paid and got nothing.
 */
export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not configured.');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  const stripe = require('stripe')(stripeKey);

  let event: any;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: any) {
    // An unverifiable payload is an impostor, not a bug — never act on it.
    console.error('[Stripe Webhook] Signature verification failed:', error?.message || error);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const listingId = session?.metadata?.listingId;

      if (session?.payment_status !== 'paid') {
        console.log(`[Stripe Webhook] Session ${session?.id} completed but not paid — ignoring.`);
      } else if (session?.metadata?.action !== 'PROMOTE_LISTING' || !listingId) {
        console.log(`[Stripe Webhook] Session ${session?.id} has no promotion metadata — ignoring.`);
      } else {
        await promoteListing(listingId);
        console.log(`[Stripe Webhook] Listing ${listingId} promoted after successful payment.`);
      }
    }

    // Acknowledge everything else so Stripe stops retrying.
    return NextResponse.json({ received: true });
  } catch (error: any) {
    // Return 500 so Stripe retries — the payment succeeded, the promotion must
    // eventually land.
    console.error('[Stripe Webhook] Failed to apply promotion:', error);
    return NextResponse.json({ error: 'Failed to process event.' }, { status: 500 });
  }
}
