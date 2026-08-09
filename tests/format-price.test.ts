import { describe, it, expect } from 'vitest';
import { formatPrice } from '../apps/web/app/lib/format-price';

describe('formatPrice', () => {
  it('writes lari after the number, mymarket-style', () => {
    expect(formatPrice(12500)).toBe('12,500 ₾');
  });

  it('groups thousands', () => {
    expect(formatPrice(1450)).toBe('1,450 ₾');
    expect(formatPrice(1234567)).toBe('1,234,567 ₾');
  });

  it('leaves small values ungrouped', () => {
    expect(formatPrice(0)).toBe('0 ₾');
    expect(formatPrice(320)).toBe('320 ₾');
  });

  it('keeps decimals as given', () => {
    expect(formatPrice(149.5)).toBe('149.5 ₾');
  });
});
