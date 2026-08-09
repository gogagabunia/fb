import type { Lang } from '../i18n';

/**
 * Saved-listings (favorites) page translations. Bind with
 * makeT(favoritesStrings, lang).
 */
export const favoritesStrings = {
  heading: { ka: 'შენახული განცხადებები', en: 'Saved Listings' },
  subheading: {
    ka: 'აქ ნახავ და მართავ ყველა განცხადებას, რომელიც შეინახე.',
    en: 'Browse and manage the classified postings you bookmarked.',
  },
  exploreFeed: { ka: 'განცხადებების ნახვა', en: 'Explore Feed' },

  emptyHeading: { ka: 'შენახული განცხადებები არ გაქვს', en: 'No Saved Listings' },
  emptyBody: {
    ka: 'შეინახე განცხადებები ლენტიდან, რომ თვალი ადევნო ნივთებს, რომლებიც მოგწონს.',
    en: 'Bookmark listings in the public feed to keep track of items you are interested in.',
  },
  browseMarketplace: { ka: 'მარკეტპლეისის დათვალიერება', en: 'Browse Marketplace Feed' },

  removedToast: { ka: '„{title}" წაიშალა შენახულებიდან.', en: '"{title}" removed from saved listings.' },
  removeFailed: { ka: 'შენახულებიდან წაშლა ვერ მოხერხდა.', en: 'Failed to remove from saved.' },
  errorOccurred: { ka: 'მოხდა შეცდომა.', en: 'Error occurred.' },

  removeFromSaved: { ka: 'შენახულებიდან წაშლა', en: 'Remove from saved' },
  viewInfo: { ka: 'დეტალურად', en: 'View Info' },
  local: { ka: 'ადგილობრივი', en: 'Local' },
} as const satisfies Record<string, Record<Lang, string>>;
