/**
 * The fixed category list — the single source of truth for the homepage grid,
 * the moderation form's dropdown, and approval validation.
 *
 * A deliberate constant, per the owner's decision: categories used to be free
 * text typed at approval time, which is how a marketplace ends up with "car",
 * "Cars" and "vehicle" as three different categories. Changing the list is an
 * edit here; nothing else knows where it comes from, so moving it into an
 * admin-managed table later touches only this file.
 *
 * `icon` is a Material Symbols name — the icon set the app already uses.
 */

export interface CategoryDef {
  name: string;
  /** Georgian display name, used when the welcome page renders in Georgian. */
  nameKa: string;
  slug: string;
  icon: string;
}

export const CATEGORIES: readonly CategoryDef[] = [
  { name: 'Vehicles', nameKa: 'ტრანსპორტი', slug: 'vehicles', icon: 'directions_car' },
  { name: 'Electronics', nameKa: 'ელექტრონიკა', slug: 'electronics', icon: 'devices_other' },
  { name: 'Phones', nameKa: 'ტელეფონები', slug: 'phones', icon: 'smartphone' },
  { name: 'Computers', nameKa: 'კომპიუტერები', slug: 'computers', icon: 'computer' },
  { name: 'Game Consoles', nameKa: 'სათამაშო კონსოლები', slug: 'game-consoles', icon: 'sports_esports' },
  { name: 'Home & Furniture', nameKa: 'სახლი და ავეჯი', slug: 'home-furniture', icon: 'chair' },
  { name: 'Appliances', nameKa: 'საოჯახო ტექნიკა', slug: 'appliances', icon: 'kitchen' },
  { name: 'Clothing', nameKa: 'ტანსაცმელი', slug: 'clothing', icon: 'apparel' },
  { name: 'Bicycles', nameKa: 'ველოსიპედები', slug: 'bicycles', icon: 'pedal_bike' },
  { name: 'Sports', nameKa: 'სპორტი', slug: 'sports', icon: 'sports_soccer' },
  { name: 'Kids & Baby', nameKa: 'საბავშვო', slug: 'kids-baby', icon: 'child_care' },
  { name: 'Pets', nameKa: 'შინაური ცხოველები', slug: 'pets', icon: 'pets' },
  { name: 'Tools', nameKa: 'ხელსაწყოები', slug: 'tools', icon: 'construction' },
  { name: 'Books & Hobbies', nameKa: 'წიგნები და ჰობი', slug: 'books-hobbies', icon: 'menu_book' },
  { name: 'Other', nameKa: 'სხვა', slug: 'other', icon: 'category' },
] as const;

/** The catch-all every unmatched guess lands in. Guaranteed to exist. */
export const FALLBACK_CATEGORY: CategoryDef = CATEGORIES[CATEGORIES.length - 1];

const bySlug = new Map(CATEGORIES.map(c => [c.slug, c]));

export function isValidCategorySlug(slug: string): boolean {
  return bySlug.has(slug);
}

export function categoryBySlug(slug: string): CategoryDef | undefined {
  return bySlug.get(slug);
}

/**
 * Map the AI parser's free-text category guess onto the fixed list, for
 * pre-selecting the moderation form's dropdown. Loose on purpose: the model
 * says "Cars & Vehicles", "electronics!", "Phone"… A miss is not an error —
 * it just pre-selects Other and the seller picks by hand.
 */
export function matchCategoryGuess(guess: string | null | undefined): CategoryDef {
  if (!guess) return FALLBACK_CATEGORY;
  const needle = guess.trim().toLowerCase();
  if (!needle) return FALLBACK_CATEGORY;

  for (const category of CATEGORIES) {
    const name = category.name.toLowerCase();
    if (name === needle || category.slug === needle) return category;
  }
  // Substring pass, both directions: "cars" ⊂ "vehicles" fails, but
  // "vehicle" ⊂ "vehicles" and "game console" ⊂ "game consoles" hit.
  for (const category of CATEGORIES) {
    const name = category.name.toLowerCase();
    if (name.includes(needle) || needle.includes(name)) return category;
  }
  // Word-level aliases for the guesses the parser actually produces.
  const aliases: Record<string, string> = {
    car: 'vehicles',
    cars: 'vehicles',
    auto: 'vehicles',
    vehicle: 'vehicles',
    truck: 'vehicles',
    motorcycle: 'vehicles',
    phone: 'phones',
    mobile: 'phones',
    laptop: 'computers',
    pc: 'computers',
    console: 'game-consoles',
    gaming: 'game-consoles',
    furniture: 'home-furniture',
    home: 'home-furniture',
    clothes: 'clothing',
    fashion: 'clothing',
    bike: 'bicycles',
    bicycle: 'bicycles',
    kids: 'kids-baby',
    baby: 'kids-baby',
    toys: 'kids-baby',
    pet: 'pets',
    tool: 'tools',
    book: 'books-hobbies',
    books: 'books-hobbies',
  };
  for (const word of needle.split(/[^a-z0-9]+/)) {
    const slug = aliases[word];
    if (slug) return bySlug.get(slug)!;
  }
  return FALLBACK_CATEGORY;
}
