/**
 * Welcome-page translations. Georgian is the default; English is the opt-in.
 *
 * Deliberately not an i18n framework: the welcome page is the only translated
 * surface for now, so its strings live in one flat dictionary. When the rest
 * of the app gets translated, this file is the seed — grow it, don't replace
 * it with a library until locale routing is actually needed.
 *
 * User content (listing titles, descriptions, locations) renders as stored.
 */

export type Lang = 'ka' | 'en';

export const LANG_COOKIE = 'lang';

/** Validates a raw cookie value; anything unexpected falls back to Georgian. */
export function getLang(cookieValue: string | undefined): Lang {
  return cookieValue === 'en' ? 'en' : 'ka';
}

export const strings = {
  searchPlaceholder: {
    ka: 'მოძებნე ნებისმიერი რამ — ველოსიპედი, ტელეფონი, დივანი…',
    en: 'Search for anything — bikes, phones, sofas…',
  },
  searchButton: {
    ka: 'ძებნა',
    en: 'Search',
  },
  sell: {
    ka: 'გაყიდე',
    en: 'Sell',
  },
  login: {
    ka: 'შესვლა',
    en: 'Log in',
  },
  register: {
    ka: 'რეგისტრაცია',
    en: 'Register',
  },
  dashboard: {
    ka: 'დაფა',
    en: 'Dashboard',
  },
  admin: {
    ka: 'ადმინი',
    en: 'Admin',
  },
  allCategories: {
    ka: 'ყველა კატეგორია',
    en: 'All categories',
  },
  freshHeading: {
    ka: 'ახალი განცხადებები ჯგუფებიდან',
    en: 'Fresh from the groups',
  },
  seeAll: {
    ka: 'ყველას ნახვა →',
    en: 'See all →',
  },
  emptyState: {
    ka: 'ჯერ ცარიელია — განცხადებები გამოჩნდება, როგორც კი გამყიდველები დაამტკიცებენ.',
    en: 'Nothing here yet — listings appear as sellers approve them.',
  },
  footerBlurb: {
    ka: 'GroupMarket — მეორადი ნივთები ადგილობრივი Facebook ჯგუფებიდან, შემოწმებული ნამდვილი გამყიდველების მიერ.',
    en: 'GroupMarket — second-hand listings from local Facebook groups, checked by real sellers.',
  },
  favorites: {
    ka: 'შენახული',
    en: 'Favorites',
  },
  settings: {
    ka: 'პარამეტრები',
    en: 'Settings',
  },
} as const satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof strings;

/** Convenience accessor: t('sell', lang). */
export function t(key: StringKey, lang: Lang): string {
  return strings[key][lang];
}
