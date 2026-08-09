import type { Lang } from '../i18n';

export const dashboardStrings = {
  // Header
  overview: { ka: 'მიმოხილვა', en: 'Overview' },
  welcomeBlurb: {
    ka: 'მოგესალმება GroupMarket-ის ადმინ-ცენტრი. აქ თვალს ადევნებ იმპორტირებულ პოსტებსა და დამტკიცებებს.',
    en: 'Welcome to your GroupMarket admin hub. Monitor scraped updates and approvals here.',
  },
  viewAnalytics: { ka: 'ანალიტიკის ნახვა', en: 'View Analytics' },
  addNewGroup: { ka: 'ახალი Facebook ჯგუფის დამატება', en: 'Add New Facebook Group' },

  // Stat cards
  connectedGroups: { ka: 'დაკავშირებული ჯგუფები', en: 'Connected Groups' },
  activeIngest: { ka: 'აქტიური იმპორტი', en: 'Active Ingest' },
  pendingReviews: { ka: 'მოდერაციის მოლოდინში', en: 'Pending Reviews' },
  needsReview: { ka: 'საჭიროებს განხილვას', en: 'Needs Review' },
  liveListings: { ka: 'გამოქვეყნებული განცხადებები', en: 'Live Listings' },
  publicFeed: { ka: 'საჯარო ლენტა', en: 'Public Feed' },

  // Empty state
  connectFirstGroup: { ka: 'დააკავშირე შენი პირველი Facebook ჯგუფი', en: 'Connect your first Facebook group' },
  connectFirstGroupBody: {
    ka: 'ავტომობილები, ნაწილები, ელექტრონიკა თუ ნებისმიერი განცხადება — ყველაფერი ავტომატურად შემოვა. დააკავშირე პირველი ჯგუფი და მოირგე სკანირების პარამეტრები.',
    en: 'Ingest cars, parts, electronics or any classified post automatically. Connect your first group and configure the scanning terms now.',
  },
  addGroupWizard: { ka: 'ჯგუფის დამატება', en: 'Add Group Wizard' },

  // Scraping history table
  scrapingHistory: { ka: 'სკრაპინგის ისტორია', en: 'Scraping Ingestion History' },
  scrapingHistorySub: {
    ka: 'Playwright სკრაპერის გაშვებების სტატუსი რეალურ დროში.',
    en: 'Real-time status of Playwright scraper run cycles.',
  },
  thGroup: { ka: 'Facebook ჯგუფი', en: 'Facebook Group' },
  thStatus: { ka: 'სტატუსი', en: 'Scrape Status' },
  thPostsChecked: { ka: 'შემოწმებული პოსტები', en: 'Posts Checked' },
  thIngestedAds: { ka: 'იმპორტირებული განცხადებები', en: 'Ingested Ads' },
  thDateScanned: { ka: 'სკანირების თარიღი', en: 'Date scanned' },
  statusSuccess: { ka: 'წარმატება', en: 'SUCCESS' },
  statusFailed: { ka: 'ვერ შესრულდა', en: 'FAILED' },
  statusRunning: { ka: 'მიმდინარეობს', en: 'RUNNING' },

  // Active sources panel
  activeSources: { ka: 'აქტიური წყაროები', en: 'Active Scanning Sources' },
  noActiveSources: { ka: 'აქტიური წყარო არ არის დაკავშირებული.', en: 'No active sources connected.' },
  viewGroupSource: { ka: 'ჯგუფის წყაროს ნახვა', en: 'View Group Source' },
  publicBadge: { ka: 'საჯარო · სინქრონდება ავტორიზაციის გარეშე', en: 'Public · syncs without login' },
  privateBadge: { ka: 'დახურული · სჭირდება Facebook', en: 'Private · needs Facebook' },

  // Manual ingest panel
  manualIngest: { ka: 'ხელით იმპორტი', en: 'Manual Feed Ingest' },
  manualIngestSub: {
    ka: 'დააკოპირე პოსტის ტექსტი Facebook-იდან, ჩასვი ქვემოთ და AI ავტომატურად ამოიღებს განცხადებას.',
    en: 'Copy raw post text from Facebook, paste below, and AI will automatically parse the listing.',
  },
  selectTargetGroup: { ka: 'აირჩიე ჯგუფი', en: 'Select Target Group' },
  pasteRawText: { ka: 'ჩასვი განცხადების ტექსტი', en: 'Paste Classified Raw Text' },
  rawTextPlaceholder: {
    ka: 'მაგალითად: იყიდება Honda Accord 2018, იდეალურ მდგომარეობაში. ფასი 18 500 ₾…',
    en: 'Example: Selling my 2018 Honda Accord EX-L in pristine condition. Asking $18,500...',
  },
  aiClassifying: { ka: 'AI ამუშავებს…', en: 'AI Classification...' },
  importViaAi: { ka: 'იმპორტი AI-ით', en: 'Import Listing via AI' },

  // Pro card
  enterpriseSyncing: { ka: 'Enterprise სინქრონიზაცია', en: 'Enterprise Syncing' },
  enterpriseBody: {
    ka: 'გახსენი ყოველსაათიანი სკრაპერები, ულიმიტო საკვანძო სიტყვები, პროქსი-გვირაბები და მყისიერი SMS შეტყობინებები.',
    en: 'Unlock hourly scrapers, unlimited keywords, proxy tunnels, and instant SMS alerts.',
  },
  upgradeTier: { ka: 'გეგმის განახლება', en: 'Upgrade Tier' },

  // Toasts
  toastSelectGroup: {
    ka: 'აირჩიე ჯგუფი და შეიყვანე განცხადების დეტალები.',
    en: 'Please select a group and enter listing details.',
  },
  toastAiParsing: { ka: 'AI ამუშავებს ჩასმულ ტექსტს…', en: 'AI Parsing pasted text block...' },
  toastImportSuccess: {
    ka: 'განცხადება წარმატებით შემოვიდა! დაემატა მოდერაციის რიგში.',
    en: 'Successfully imported listing! Added to Moderation Queue.',
  },
  toastParseFailed: {
    ka: 'ტექსტის დამუშავება ვერ მოხერხდა. ნამდვილად განცხადებაა?',
    en: 'Failed to parse text. Is it a classified ad?',
  },
  toastIngestFailed: { ka: 'ხელით იმპორტი ვერ შესრულდა.', en: 'Manual ingestion failed.' },
  toastNoGroups: {
    ka: 'აქტიური Facebook ჯგუფი არ არის დაკავშირებული. ჯერ დაამატე!',
    en: 'No active Facebook groups connected. Please add one first!',
  },
  toastSyncStarting: { ka: 'იწყება იმპორტი და AI დამუშავება…', en: 'Starting ingestion and AI parsing...' },
  toastSyncComplete: {
    ka: 'სინქრონიზაცია დასრულდა! ნაპოვნია {found} პოსტი, {imported} განცხადება დაემატა მოდერაციის რიგში.',
    en: 'Sync Complete! Found {found} posts, imported {imported} listings into PENDING queue.',
  },
  toastSyncFailed: {
    ka: 'სკრაპინგი ვერ შესრულდა: {error}. არსებული ჩანაწერები შენარჩუნებულია.',
    en: 'Scraping failed: {error}. Preserving existing entries.',
  },
  unknownError: { ka: 'უცნობი შეცდომა', en: 'Unknown error' },
} as const satisfies Record<string, Record<Lang, string>>;
