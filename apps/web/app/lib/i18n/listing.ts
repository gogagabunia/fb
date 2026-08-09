import type { Lang } from '../i18n';

/**
 * Listing-detail page translations (client page, its not-found state and the
 * page footer). Bind with makeT(listingStrings, lang).
 */
export const listingStrings = {
  // Not-found page (server component)
  notFoundMetaTitle: { ka: 'განცხადება ვერ მოიძებნა | GroupMarket', en: 'Listing Not Found | GroupMarket' },
  notFoundMetaDesc: {
    ka: 'მოთხოვნილი განცხადება მარკეტპლეისზე ვერ მოიძებნა.',
    en: 'The requested listing could not be found on the marketplace.',
  },
  backToBrowse: { ka: '← განცხადებებზე დაბრუნება', en: 'Back to Browse' },
  notFoundHeading: { ka: 'განცხადება ვერ მოიძებნა', en: 'Listing Not Found' },
  notFoundBody: {
    ka: 'განცხადება, რომელსაც ეძებ, შესაძლოა გაიყიდა, დაარქივდა ან საერთოდ არ არსებობს.',
    en: 'The listing you are looking for might have been sold, archived, or does not exist in our database.',
  },
  returnToMarketplace: { ka: 'მარკეტპლეისზე დაბრუნება', en: 'Return to Marketplace' },
  copyright: {
    ka: '© {year} GroupMarket. ყველა უფლება დაცულია.',
    en: '© {year} GroupMarket Inc. All rights reserved.',
  },

  // Toasts
  linkCopied: { ka: 'ბმული დაკოპირდა!', en: 'Link copied to clipboard!' },
  paymentReceived: {
    ka: 'გადახდა მიღებულია — შენი განცხადება მალე გამორჩეული გახდება.',
    en: 'Payment received — your listing is being featured.',
  },
  checkoutFailed: {
    ka: 'გადახდის დაწყება ვერ მოხერხდა. სცადე თავიდან.',
    en: 'Could not start checkout. Please try again.',
  },
  addedToSaved: { ka: 'შენახულებში დაემატა!', en: 'Added to Saved Listings!' },
  removedFromSaved: { ka: 'შენახულებიდან წაიშალა.', en: 'Removed from Saved Listings.' },

  // Top navigation
  browseFeed: { ka: 'განცხადებები', en: 'Browse Feed' },
  syncGroups: { ka: 'ჯგუფების სინქრონიზაცია', en: 'Sync Groups' },
  adminPanel: { ka: 'ადმინ პანელი', en: 'Admin Panel' },
  listItem: { ka: 'დაამატე განცხადება', en: 'List Item' },
  userProfileAlt: { ka: 'მომხმარებლის პროფილი', en: 'User profile' },
  toggleMenu: { ka: 'მენიუს გახსნა', en: 'Toggle menu' },

  // Breadcrumb + actions
  home: { ka: 'მთავარი', en: 'Home' },
  share: { ka: 'გაზიარება', en: 'Share' },
  save: { ka: 'შენახვა', en: 'Save' },
  saved: { ka: 'შენახულია', en: 'Saved' },

  // Gallery + description
  thumbnailAlt: { ka: '{title} — ფოტო {n}', en: '{title} thumbnail {n}' },
  description: { ka: 'აღწერა', en: 'Description' },
  noDescription: { ka: 'ამ განცხადებას აღწერა არ აქვს.', en: 'No description available for this listing.' },

  // Price / status card
  statusActive: { ka: 'აქტიური', en: 'Active' },
  statusArchived: { ka: 'დაარქივებული', en: 'Archived' },
  remote: { ka: 'მდებარეობა უცნობია', en: 'Remote' },
  postedOneDay: { ka: 'გამოქვეყნდა 1 დღის წინ', en: 'Posted 1 day ago' },
  postedDays: { ka: 'გამოქვეყნდა {n} დღის წინ', en: 'Posted {n} days ago' },

  // Specs
  year: { ka: 'წელი', en: 'Year' },
  mileage: { ka: 'გარბენი', en: 'Mileage' },
  fuel: { ka: 'საწვავი', en: 'Fuel' },
  transmission: { ka: 'გადაცემათა კოლოფი', en: 'Transmission' },
  category: { ka: 'კატეგორია', en: 'Category' },

  // CTAs
  contactSeller: { ka: 'გამყიდველთან დაკავშირება', en: 'Contact Seller' },
  viewOnFacebook: { ka: 'ნახვა Facebook-ზე', en: 'View on Facebook' },

  // Seller card
  verifiedMember: { ka: 'დადასტურებული წევრი', en: 'Verified Member' },
  verifiedSeller: { ka: 'დადასტურებული გამყიდველი', en: 'Verified Seller' },
  sourceGroup: { ka: 'Facebook ჯგუფი (წყარო)', en: 'Facebook Source Group' },
  facebookGroup: { ka: 'Facebook ჯგუფი', en: 'Facebook Group' },
  viewOtherListings: { ka: 'სხვა განცხადებების ნახვა', en: 'View Other Listings' },

  // Promotion card
  sponsor: { ka: 'სპონსორი', en: 'SPONSOR' },
  promoteListing: { ka: 'განცხადების დაწინაურება', en: 'Promote Listing' },
  promoteDescription: {
    ka: 'გახადე შენი განცხადება უფრო შესამჩნევი! გამორჩეული განცხადება მარკეტპლეისის თავში, სპეციალურ ბადეში ჯდება.',
    en: "Boost your listing's visibility! Make it featured to place it in the asymmetric bento grid at the top of the Marketplace.",
  },
  featuredActive: { ka: 'განცხადება გამორჩეულია', en: 'Featured Listing Active' },
  redirecting: { ka: 'გადამისამართება…', en: 'Redirecting...' },
  promotePrice: { ka: 'დააწინაურე $19.99-ად', en: 'Promote for $19.99' },

  // Map card
  mapAlt: { ka: 'რუკა', en: 'Map placeholder' },
  locationLabel: { ka: 'მდებარეობა: {loc}', en: 'Location: {loc}' },
  coordinatesNote: {
    ka: 'ზუსტი მისამართი მოთხოვნისას მიიღება.',
    en: 'Detailed coordinates provided upon inquiry.',
  },

  // Similar listings
  similarHeading: { ka: 'მსგავსი განცხადებები', en: 'Similar High-End Listings' },
  viewAll: { ka: 'ყველას ნახვა', en: 'View all' },

  // Footer
  footerBlurb: {
    ka: 'GroupMarket — მარკეტპლეისი ადგილობრივი Facebook ჯგუფებისთვის: სოციალური ვაჭრობა პროფესიონალური ხელსაწყოებითა და გადამოწმებით.',
    en: 'The premium marketplace for niche Facebook groups and automotive enthusiasts. Experience the power of social commerce with professional tools and verification.',
  },
  footerMarketplace: { ka: 'მარკეტპლეისი', en: 'Marketplace' },
  sellerDashboard: { ka: 'გამყიდველის დაფა', en: 'Seller Dashboard' },
  footerResources: { ka: 'რესურსები', en: 'Resources' },
  trustSafety: { ka: 'ნდობა და უსაფრთხოება', en: 'Trust & Safety' },
  helpCenter: { ka: 'დახმარების ცენტრი', en: 'Help Center' },
  termsOfService: { ka: 'მომსახურების პირობები', en: 'Terms of Service' },
} as const satisfies Record<string, Record<Lang, string>>;
