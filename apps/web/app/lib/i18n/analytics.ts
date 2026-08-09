import type { Lang } from '../i18n';

export const analyticsStrings = {
  // Header
  title: { ka: 'პლატფორმის ანალიტიკა', en: 'Platform Analytics' },
  subtitle: {
    ka: 'თვალი ადევნე ვიზიტორების ქმედებებს, კლიკებს, პოპულარულ კატეგორიებსა და მარკეტპლეისის აქტივობას.',
    en: 'Track visitor actions, click behavior, popular categories, and marketplace engagement.',
  },
  backToDashboard: { ka: 'დაფაზე დაბრუნება', en: 'Back to Dashboard' },

  // Stat cards
  totalPageViews: { ka: 'ჯამური ნახვები', en: 'Total Page Views' },
  acrossAllListings: { ka: 'ყველა შენს განცხადებაზე', en: 'Across all of your listings' },
  actionClicks: { ka: 'ქმედების კლიკები', en: 'Action Clicks' },
  clicksBreakdown: { ka: '{contact} კონტაქტი · {fb} Facebook', en: '{contact} contact · {fb} Facebook' },
  ctr: { ka: 'კლიკების მაჩვენებელი (CTR)', en: 'Click-Through-Rate' },
  ctrSub: { ka: 'კლიკების წილი ნახვებში', en: 'Clicks as a share of page views' },
  inquiriesSent: { ka: 'გაგზავნილი შეტყობინებები', en: 'Inquiries Sent' },
  inquiriesSub: { ka: 'პირდაპირი მიმართვები გამყიდველებთან', en: 'Direct inquiries to sellers' },

  // Traffic chart
  weeklyTraffic: { ka: 'კვირის ტრაფიკი', en: 'Weekly Traffic Volume' },
  weeklyTrafficSub: {
    ka: 'დღიური ნახვების ვიზუალური განაწილება.',
    en: 'Visual distribution of daily visitor page views.',
  },
  noViewsYet: { ka: 'ნახვები ჯერ არ დაფიქსირებულა.', en: 'No page views recorded yet.' },
  viewsTooltip: { ka: '{n} ნახვა', en: '{n} views' },

  // Popular listings
  popularListings: { ka: 'ყველაზე პოპულარული განცხადებები', en: 'Most Popular Listings' },
  popularListingsSub: { ka: 'დალაგებულია ჯამური ნახვების მიხედვით.', en: 'Ranked by overall page views.' },
  approveFirst: {
    ka: 'დაამტკიცე პოსტი, რომ პირველი განცხადება გამოქვეყნდეს.',
    en: 'Approve a post to publish your first listing.',
  },
  categoryOther: { ka: 'სხვა', en: 'Other' },
  viewsCount: { ka: '{n} ნახვა', en: '{n} views' },
  clicksCount: { ka: '{n} კლიკი', en: '{n} clicks' },
} as const satisfies Record<string, Record<Lang, string>>;
