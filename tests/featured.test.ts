import { describe, it, expect } from 'vitest';
import { isFeaturedNow, PROMOTION_DAYS, PROMOTION_PRICE_CENTS } from '../apps/web/app/lib/featured';

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

/**
 * `featuredUntil` was written at checkout and never read again, so a paid
 * promotion never expired — a listing stayed in the featured grid forever.
 */
describe('isFeaturedNow', () => {
  it('is false when the listing was never promoted', () => {
    expect(isFeaturedNow({ isFeatured: false, featuredUntil: daysFromNow(1) })).toBe(false);
  });

  it('is true while the paid window is open', () => {
    expect(isFeaturedNow({ isFeatured: true, featuredUntil: daysFromNow(1) })).toBe(true);
  });

  it('is false once the window has passed', () => {
    expect(isFeaturedNow({ isFeatured: true, featuredUntil: daysFromNow(-1) })).toBe(false);
  });

  it('accepts an ISO string, which is what a client component receives', () => {
    expect(isFeaturedNow({ isFeatured: true, featuredUntil: daysFromNow(1).toISOString() })).toBe(true);
    expect(isFeaturedNow({ isFeatured: true, featuredUntil: daysFromNow(-1).toISOString() })).toBe(false);
  });

  it('treats a missing expiry as open-ended rather than expired', () => {
    expect(isFeaturedNow({ isFeatured: true, featuredUntil: null })).toBe(true);
    expect(isFeaturedNow({ isFeatured: true })).toBe(true);
  });

  it('handles absent isFeatured without throwing', () => {
    expect(isFeaturedNow({})).toBe(false);
  });
});

describe('promotion constants', () => {
  it('matches the price and window the checkout route charges for', () => {
    expect(PROMOTION_PRICE_CENTS).toBe(1999);
    expect(PROMOTION_DAYS).toBe(7);
  });
});
