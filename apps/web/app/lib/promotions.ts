import { prisma } from './prisma';
import { PROMOTION_DAYS } from './featured';

export { PROMOTION_PRICE_CENTS, PROMOTION_DAYS, isFeaturedNow } from './featured';

/**
 * Mark a listing as featured for the promotion window.
 *
 * Called only from the Stripe webhook (after payment succeeds) and from the
 * explicitly opt-in dev simulator. Never from a plain client request.
 */
export async function promoteListing(listingId: string) {
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + PROMOTION_DAYS);

  await prisma.listing.update({
    where: { id: listingId },
    data: { isFeatured: true, featuredUntil }
  });
}
