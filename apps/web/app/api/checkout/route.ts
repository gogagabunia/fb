import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getSession } from '../../lib/auth';
import { promoteListing, PROMOTION_PRICE_CENTS, PROMOTION_DAYS } from '../../lib/promotions';

/**
 * Start a Stripe Checkout session to promote a listing.
 *
 * The listing is only marked featured by the Stripe webhook, after payment
 * actually succeeds — see app/api/stripe/webhook/route.ts. This route never
 * grants the promotion itself.
 */
export async function POST(req: Request) {
  try {
    const userId = await getSession();
    if (!userId) {
      return NextResponse.json({ error: 'You must be logged in to promote a listing.' }, { status: 401 });
    }

    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required.' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { importedPost: { select: { userId: true } } }
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    // Only the owner may pay to promote their own listing.
    if (listing.importedPost.userId !== userId) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (stripeKey) {
      const stripe = require('stripe')(stripeKey);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Feature Promotion: "${listing.title}"`,
                description: `Boost your listing visibility in the featured marketplace grid for ${PROMOTION_DAYS} days.`,
              },
              unit_amount: PROMOTION_PRICE_CENTS,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${appUrl}/listing-detail/${listingId}?checkout=success`,
        cancel_url: `${appUrl}/listing-detail/${listingId}?checkout=cancel`,
        metadata: {
          listingId: listingId,
          action: 'PROMOTE_LISTING'
        }
      });

      return NextResponse.json({ success: true, url: session.url });
    }

    // No Stripe key configured. This previously fell through to a "simulator"
    // that set isFeatured directly — i.e. any caller could hand themselves a
    // paid promotion for free. The simulator is now explicit opt-in and refuses
    // to run in production.
    const simulationAllowed =
      process.env.NODE_ENV !== 'production' && process.env.ALLOW_SIMULATED_CHECKOUT === 'true';

    if (!simulationAllowed) {
      return NextResponse.json(
        { error: 'Payments are not configured. Set STRIPE_SECRET_KEY to enable promotions.' },
        { status: 503 }
      );
    }

    console.log(`[Checkout] ALLOW_SIMULATED_CHECKOUT set — promoting "${listing.title}" without payment (dev only).`);
    await promoteListing(listingId);

    return NextResponse.json({
      success: true,
      simulated: true,
      url: `${appUrl}/listing-detail/${listingId}?checkout=success`
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] Session creation failed:', error);
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
  }
}
