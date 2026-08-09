import type { Lang } from '../i18n';

/**
 * Marketplace feed page + search bar translations. Same shape as the
 * welcome-page dictionary in lib/i18n.ts — bind with makeT(marketplaceStrings, lang).
 */
export const marketplaceStrings = {
  // Top navigation
  browseFeed: { ka: 'განცხადებები', en: 'Browse Feed' },
  syncGroups: { ka: 'ჯგუფების სინქრონიზაცია', en: 'Sync Groups' },
  adminPanel: { ka: 'ადმინ პანელი', en: 'Admin Panel' },
  listItem: { ka: 'დაამატე განცხადება', en: 'List Item' },
  userProfileAlt: { ka: 'მომხმარებლის პროფილი', en: 'User profile' },

  // Featured / bento section
  premiumHeading: { ka: 'გამორჩეული განცხადებები', en: 'Premium Inventory' },
  premiumSub: {
    ka: 'შერჩეული ნივთები დადასტურებული ადგილობრივი ჯგუფებიდან.',
    en: 'Curated selection from verified local groups.',
  },
  newArrival: { ka: 'ახალი', en: 'NEW ARRIVAL' },
  verifiedGroup: { ka: 'დადასტურებული ჯგუფი', en: 'Verified Group' },
  viewDetail: { ka: 'დეტალურად', en: 'View Detail' },
  premiumExperience: { ka: 'პრემიუმ გამოცდილება', en: 'Premium Experience' },
  premiumExperienceSub: {
    ka: 'ავტომატურად დამუშავებული განცხადებები სრული მახასიათებლებით.',
    en: 'Auto-parsed, curated items with complete specifications.',
  },
  verifiedOnly: { ka: 'მხოლოდ დადასტურებული განცხადებები', en: 'Verified Listings Only' },
  syncFacebookGroups: { ka: 'დააკავშირე Facebook ჯგუფები', en: 'Sync Facebook Groups' },
  syncFacebookGroupsSub: {
    ka: 'AI ავტომატურად წაიკითხავს და გააფორმებს ჯგუფის განცხადებებს შენ მაგივრად.',
    en: 'Let AI automatically ingest and format local listing posts for you.',
  },
  connectGroup: { ka: 'ჯგუფის დაკავშირება', en: 'Connect Group' },

  // Feed section
  allInventory: { ka: 'ყველა განცხადება', en: 'All Inventory' },
  categoryListings: { ka: '{c} — განცხადებები', en: '{c} Listings' },
  showingOne: { ka: 'ნაჩვენებია {shown} შედეგი {total}-დან', en: 'Showing {shown} of {total} matching item' },
  showingMany: { ka: 'ნაჩვენებია {shown} შედეგი {total}-დან', en: 'Showing {shown} of {total} matching items' },
  noListingsFound: { ka: 'განცხადებები ვერ მოიძებნა', en: 'No Listings Found' },
  noListingsHint: {
    ka: 'სცადე შეცვალო საძიებო სიტყვა, ფასის დიაპაზონი ან კატეგორია.',
    en: 'Try modifying your search query, price range, or category filter.',
  },
  local: { ka: 'ადგილობრივი', en: 'Local' },
  viewListing: { ka: 'განცხადების ნახვა', en: 'View Listing' },
  saveListingAria: { ka: 'განცხადების შენახვა', en: 'Save listing' },
  loadingMore: { ka: 'იტვირთება…', en: 'Loading…' },
  exploreMore: { ka: 'მეტი განცხადების ნახვა', en: 'Explore More Listings' },

  // Search bar
  searchPlaceholder: {
    ka: 'მოძებნე სათაურით, აღწერით ან ჯგუფით…',
    en: 'Search listings by title, description, or group...',
  },
  clearSearch: { ka: 'ძებნის გასუფთავება', en: 'Clear search' },
  sortNewest: { ka: 'სორტირება: უახლესი', en: 'Sort by: Newest' },
  sortPriceAsc: { ka: 'ფასი: ზრდადობით', en: 'Price: Low to High' },
  sortPriceDesc: { ka: 'ფასი: კლებადობით', en: 'Price: High to Low' },
  filters: { ka: 'ფილტრები', en: 'Filters' },
  categoryLabel: { ka: 'კატეგორია', en: 'Category' },
  allCategories: { ka: 'ყველა კატეგორია', en: 'All Categories' },
  priceRangeLabel: { ka: 'ფასის დიაპაზონი (₾)', en: 'Price Range (₾)' },
  minPrice: { ka: 'მინ. ფასი', en: 'Min Price' },
  maxPrice: { ka: 'მაქს. ფასი', en: 'Max Price' },
} as const satisfies Record<string, Record<Lang, string>>;
