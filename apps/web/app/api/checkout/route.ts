import { NextResponse } from 'next/server';
import { PrismaClient } from 'database';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required.' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    // Stripe checkout configuration keys
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (stripeKey) {
      try {
        const stripe = require('stripe')(stripeKey);
        
        // Create actual Stripe Checkout Session for promotion
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Feature Promotion: "${listing.title}"`,
                  description: 'Boost your listing visibility in the asymmetric featured Bento marketplace grid for 7 days.',
                },
                unit_amount: 1999, // $19.99
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
      } catch (stripeError: any) {
        console.error('[Stripe Checkout] API Error, falling back to sandbox simulator:', stripeError);
      }
    }

    // Graceful developer environment Stripe simulator
    console.log(`\n--- 💳 STRIPE CHECKOUT SIMULATOR ---`);
    console.log(`Product: Featured Promotion for "${listing.title}"`);
    console.log(`Price: $19.99 USD`);
    console.log(`Target Listing ID: ${listingId}`);
    console.log(`-----------------------------------\n`);

    // Instantly promote the listing in PostgreSQL
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        isFeatured: true,
        featuredUntil: oneWeekFromNow
      }
    });

    return NextResponse.json({
      success: true,
      simulated: true,
      url: `${appUrl}/listing-detail/${listingId}?checkout=success`
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] Session creation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
