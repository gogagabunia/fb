// Pure promotion helpers — no DB imports, safe to use from client components.

export const PROMOTION_PRICE_CENTS = 1999; // $19.99
export const PROMOTION_DAYS = 7;

/**
 * A listing is only actually featured while its promotion window is open.
 * `featuredUntil` was previously written at checkout and never read again, so
 * promotions never expired.
 */
export function isFeaturedNow(listing: { isFeatured?: boolean | null; featuredUntil?: Date | string | null }): boolean {
  if (!listing.isFeatured) return false;
  if (!listing.featuredUntil) return true; // no expiry recorded → treat as open-ended
  return new Date(listing.featuredUntil).getTime() > Date.now();
}
