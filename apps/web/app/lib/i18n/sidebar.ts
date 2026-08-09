import type { Lang } from '../i18n';

export const sidebarStrings = {
  // Navigation
  navDashboard: { ka: 'დაფა', en: 'Dashboard' },
  navAnalytics: { ka: 'ანალიტიკა', en: 'Analytics Panel' },
  navModeration: { ka: 'მოდერაციის რიგი', en: 'Moderation Queue' },
  navGroups: { ka: 'დაკავშირებული ჯგუფები', en: 'Connected Groups' },
  navFavorites: { ka: 'შენახული განცხადებები', en: 'Saved Listings' },
  navSettings: { ka: 'ანგარიშის პარამეტრები', en: 'Account Settings' },
  navMarketplace: { ka: 'მარკეტპლეისი', en: 'View Marketplace' },

  // Identity / footer
  sellerPortal: { ka: 'გამყიდველის პორტალი', en: 'Seller Portal' },
  syncNewPosts: { ka: 'ახალი პოსტების სინქრონიზაცია', en: 'Sync New Posts' },
  syncingPosts: { ka: 'პოსტები მუშავდება…', en: 'Parsing Posts...' },
  databaseEngine: { ka: 'მონაცემთა ბაზა', en: 'Database Engine' },
  liveDb: { ka: 'Serverless ბაზა ონლაინშია', en: 'Live Serverless DB' },
  signOut: { ka: 'გასვლა', en: 'Sign Out' },

  // Aria labels
  openMenu: { ka: 'ნავიგაციის მენიუს გახსნა', en: 'Open navigation menu' },
  closeMenu: { ka: 'ნავიგაციის მენიუს დახურვა', en: 'Close navigation menu' },
} as const satisfies Record<string, Record<Lang, string>>;
