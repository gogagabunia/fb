/**
 * The one place listing prices become text. Prices are stored as bare numbers;
 * the display currency is lari, written mymarket-style: number first, then the
 * symbol ("12,500 ₾").
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('en-US')} ₾`;
}
