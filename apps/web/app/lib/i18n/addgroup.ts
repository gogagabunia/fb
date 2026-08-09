import type { Lang } from '../i18n';

/**
 * Strings for the group-connection wizard and workspace (/add-group).
 * Dynamic values use {placeholder} tokens replaced at the call site.
 */
export const addGroupStrings = {
  // Toasts
  urlRequired: {
    ka: 'მიუთითე Facebook ჯგუფის სწორი ბმული!',
    en: 'Please provide a valid Facebook Group URL!',
  },
  connectingDb: {
    ka: 'წყარო უკავშირდება მონაცემთა ბაზას…',
    en: 'Connecting source in PostgreSQL database...',
  },
  sourceConnected: {
    ka: 'წყარო წარმატებით დაუკავშირდა! იწყება პირველი სინქრონიზაცია…',
    en: 'Source connected successfully! Executing initial sync...',
  },
  scrapeDone: {
    ka: 'სინქრონიზაცია დასრულდა! შემოვიდა {n} დახარისხებული განცხადება.',
    en: 'Scrape Done! Ingested {n} classified items.',
  },
  syncSandboxAlert: {
    ka: 'სინქრონიზაცია: ჩაიტვირთა სატესტო (sandbox) ჩანაწერები.',
    en: 'Sync alert: Remote browserless CDP loaded sandbox template items.',
  },
  scraperFallback: {
    ka: 'სკრეიპერი დასრულდა. შემოვიდა სარეზერვო ჩანაწერები.',
    en: 'Scraper finished. Ingested fallback vehicle records.',
  },
  errorGeneric: {
    ka: 'შეცდომა: {err}',
    en: 'Error: {err}',
  },
  submissionFailed: {
    ka: 'გაგზავნა ვერ მოხერხდა: {err}',
    en: 'Submission failed: {err}',
  },
  launchingScraper: {
    ka: 'სკრეიპერი ეშვება და ჯგუფს უკავშირდება…',
    en: 'Connecting to Browserless CDP WebSocket and launching scraper...',
  },
  syncFinished: {
    ka: 'სინქრონიზაცია დასრულდა! წარმატებით შემოვიდა {n} განცხადება.',
    en: 'Sync finished! Ingested {n} listings successfully.',
  },
  syncFinishedSandbox: {
    ka: 'სინქრონიზაცია დასრულდა სატესტო შაბლონებით.',
    en: 'Sync finished using CDP sandbox templates.',
  },
  scrapingFinalized: {
    ka: 'სკრეიპინგი დასრულდა.',
    en: 'Scraping finalized.',
  },
  nameUrlBlank: {
    ka: 'სახელი და ბმული ცარიელი ვერ იქნება.',
    en: 'Name and URL cannot be blank.',
  },
  updatingParams: {
    ka: 'წყაროს პარამეტრები ახლდება…',
    en: 'Updating source parameters...',
  },
  updateSuccess: {
    ka: 'ჯგუფის კონფიგურაცია წარმატებით განახლდა!',
    en: 'Group configuration updated successfully!',
  },
  updateFailed: {
    ka: 'კონფიგურაციის განახლება ვერ მოხერხდა.',
    en: 'Failed to update configuration.',
  },
  updateFailedShort: {
    ka: 'განახლება ვერ მოხერხდა.',
    en: 'Update failed.',
  },
  deletingSource: {
    ka: 'წყარო იშლება მონაცემთა ბაზიდან…',
    en: 'Deleting source from cloud database...',
  },
  deleteSuccess: {
    ka: 'ჯგუფი წარმატებით გაითიშა და მონაცემები გასუფთავდა!',
    en: 'Successfully disconnected group and cleaned up database relations!',
  },
  deleteFailed: {
    ka: 'ჯგუფის გათიშვა ვერ მოხერხდა.',
    en: 'Failed to disconnect group.',
  },
  deletionFailed: {
    ka: 'წაშლა ვერ მოხერხდა.',
    en: 'Deletion failed.',
  },
  defaultGroupName: {
    ka: 'ადგილობრივი ყიდვა/გაყიდვის ჯგუფი',
    en: 'Local Buy/Sell Group',
  },

  // Loading
  loadingWorkspace: {
    ka: 'სამუშაო სივრცე იტვირთება…',
    en: 'Loading Source Workspace...',
  },

  // Header
  workspaceTitle: {
    ka: 'დაკავშირებული ჯგუფები',
    en: 'Connected Groups Workspace',
  },
  workspaceSubtitle: {
    ka: 'მართე დაკავშირებული Facebook ჯგუფები, დააკონფიგურირე ფილტრები ან დაამატე ახალი წყარო.',
    en: 'Manage your active target Facebook Group pipelines, configure brand filters, or connect new feeds.',
  },
  backToWorkspace: {
    ka: 'სამუშაო სივრცეში დაბრუნება',
    en: 'Back to Workspace',
  },
  connectNewSource: {
    ka: 'ახალი წყაროს დამატება',
    en: 'Connect New Source',
  },

  // Group card — edit mode
  groupLabelName: {
    ka: 'ჯგუფის სახელი',
    en: 'Group Label Name',
  },
  groupNameExample: {
    ka: 'მაგ. თბილისის ავტო-განცხადებები',
    en: 'e.g. California Cars Classifieds',
  },
  fbGroupUrl: {
    ka: 'Facebook ჯგუფის ბმული',
    en: 'Facebook Group URL',
  },
  groupUrlExample: {
    ka: 'მაგ. https://facebook.com/groups/california-auto',
    en: 'e.g. https://facebook.com/groups/california-auto',
  },
  keywordsComma: {
    ka: 'საკვანძო სიტყვები (მძიმით გამოყოფილი)',
    en: 'Keywords (Comma Separated)',
  },
  keywordsExample: {
    ka: 'BMW, Porsche, Mazda',
    en: 'BMW, Porsche, Mazda',
  },

  // Group card — detail mode
  automatedSync: {
    ka: 'ავტომატური სინქრონიზაცია',
    en: 'Automated CDP Sync',
  },
  keywordsMonitored: {
    ka: 'სამონიტორინგო სიტყვები',
    en: 'Keywords Monitored',
  },
  scanningAllPosts: {
    ka: 'სკანირდება ყველა პოსტი',
    en: 'Scanning all feed posts',
  },
  cancel: {
    ka: 'გაუქმება',
    en: 'Cancel',
  },
  saving: {
    ka: 'ინახება…',
    en: 'Saving...',
  },
  saveConfig: {
    ka: 'კონფიგურაციის შენახვა',
    en: 'Save Configuration',
  },
  deleteConfirmText: {
    ka: 'დარწმუნებული ხარ? ჯგუფის წაშლა ყველა წამოღებულ განცხადებას შლის.',
    en: 'Are you sure? Deleting this group removes all scraped listings.',
  },
  disconnect: {
    ka: 'გათიშვა',
    en: 'Disconnect',
  },
  editSourceTitle: {
    ka: 'წყაროს პარამეტრების რედაქტირება',
    en: 'Edit source parameters',
  },
  disconnectSourceTitle: {
    ka: 'წყაროს გათიშვა',
    en: 'Disconnect source pipeline',
  },
  syncing: {
    ka: 'სინქრონიზდება…',
    en: 'CDP Syncing...',
  },
  syncFeed: {
    ka: 'სინქრონიზაცია',
    en: 'Sync Feed',
  },

  // Wizard step labels
  stepConnect: {
    ka: 'დაკავშირება',
    en: 'Connect',
  },
  stepCategories: {
    ka: 'კატეგორიები',
    en: 'Categories',
  },
  stepRules: {
    ka: 'წესები',
    en: 'Rules',
  },

  // Step 1
  step1Title: {
    ka: 'ჯგუფის დეტალები',
    en: 'Paste Group Details',
  },
  step1Subtitle: {
    ka: 'დააკავშირე Facebook ყიდვა/გაყიდვის ჯგუფი და განცხადებების მონიტორინგი ავტომატურად დაიწყება.',
    en: 'Connect a Facebook Buy/Sell group to start monitoring for listings automatically.',
  },
  wizardUrlPlaceholder: {
    ka: 'მაგ. https://facebook.com/groups/scottsdale-classifieds',
    en: 'e.g. https://facebook.com/groups/scottsdale-classifieds',
  },
  customLabel: {
    ka: 'სახელი / ჯგუფის დასახელება',
    en: 'Custom Label / Group Name',
  },
  wizardNamePlaceholder: {
    ka: 'მაგ. თბილისის განცხადებები (არასავალდებულო)',
    en: 'e.g. Scottsdale Classifieds (Optional)',
  },
  workerInfo: {
    ka: 'ავტომატური სისტემა თავად დაასკანერებს ჯგუფს და მონიშნავს შენს კრიტერიუმებზე მორგებულ ნივთებს.',
    en: 'Our automated background worker will automatically scan and flag items matching your monitoring criteria.',
  },

  // Step 2
  step2Title: {
    ka: 'კატეგორიების მონიტორინგი',
    en: 'Monitor Categories',
  },
  step2Subtitle: {
    ka: 'აირჩიე, რომელი ტიპის პოსტები დაასკანეროს და დაახარისხოს კლასიფიკატორმა ავტომატურად.',
    en: 'Select which types of posts our classifier should automatically scan and catalog.',
  },
  catVehiclesTitle: {
    ka: 'ავტომობილები და ტრანსპორტი',
    en: 'Cars & Vehicles',
  },
  catVehiclesDesc: {
    ka: 'სედანები, ჯიპები, სპორტული',
    en: 'Sedans, SUVs, Sports Cars',
  },
  catElectronicsTitle: {
    ka: 'ელექტრონიკა',
    en: 'Consumer Electronics',
  },
  catElectronicsDesc: {
    ka: 'ტელეფონები, კამერები, ლეპტოპები',
    en: 'Phones, Cameras, Laptops',
  },
  catRealEstateTitle: {
    ka: 'უძრავი ქონება / მიწა',
    en: 'Real Estate / Land',
  },
  catRealEstateDesc: {
    ka: 'ქირავდება, იყიდება, ნაკვეთები',
    en: 'Rentals, Sales, Plots',
  },
  catOtherTitle: {
    ka: 'სხვა განცხადებები',
    en: 'Other Classifieds',
  },
  catOtherDesc: {
    ka: 'ხელსაწყოები, ავეჯი, საკოლექციო',
    en: 'Tools, Furniture, Collectibles',
  },

  // Step 3
  step3Title: {
    ka: 'იმპორტის ფილტრები',
    en: 'Import Filtering Rules',
  },
  step3Subtitle: {
    ka: 'განსაზღვრე საკვანძო სიტყვები, რომ განცხადებების ხარისხი სრულად გააკონტროლო.',
    en: 'Define scanning keywords to maintain absolute quality control over live listings.',
  },
  groupVisibility: {
    ka: 'ჯგუფის ხილვადობა',
    en: 'Group Visibility',
  },
  groupVisibilityHint: {
    ka: 'დახურული ჯგუფების სინქრონიზაციას შენი Facebook-ის დაკავშირება სჭირდება.',
    en: 'Private groups need you to connect your Facebook to sync.',
  },
  privateOption: {
    ka: '🔒 დახურული',
    en: '🔒 Private',
  },
  publicOption: {
    ka: '🌐 საჯარო',
    en: '🌐 Public',
  },
  keywordFilter: {
    ka: 'საკვანძო სიტყვების ფილტრი',
    en: 'Keyword Filter Spans',
  },
  keywordFilterHint: {
    ka: 'შემოვა მხოლოდ ის პოსტები, რომლებიც ამ სიტყვებს შეიცავს (მძიმით გამოყავი).',
    en: 'Only import posts containing these terms (comma separated).',
  },
  keywordFilterPlaceholder: {
    ka: 'მაგ. BMW, Toyota, Porsche, Leica',
    en: 'e.g. BMW, Toyota, Porsche, Leica',
  },
  autoNotify: {
    ka: 'ადმინის ავტომატური შეტყობინება',
    en: 'Auto-Notify Platform Admin',
  },
  autoNotifyHint: {
    ka: 'ახალი მოდერაციისთვის ელფოსტაზე შეტყობინება გაიგზავნება.',
    en: 'Send email alerts for newly flagged moderation reviews.',
  },

  // Step 4
  step4Title: {
    ka: 'წყარო წარმატებით დაკონფიგურირდა!',
    en: 'Source Successfully Configured!',
  },
  step4Subtitle: {
    ka: 'სინქრონიზაცია დაიწყო — მოდერაციის რიგი მალე შეივსება.',
    en: 'We are initiating your Playwright sync via the Browserless CDP engine. Your moderation queue will populate momentarily.',
  },
  parsingBackground: {
    ka: 'მონაცემები მუშავდება ფონურად…',
    en: 'Parsing feed data in background...',
  },

  // Wizard actions
  back: {
    ka: 'უკან',
    en: 'Back',
  },
  connecting: {
    ka: 'უკავშირდება…',
    en: 'Connecting...',
  },
  completeSetup: {
    ka: 'დასრულება',
    en: 'Complete Setup',
  },
  continueBtn: {
    ka: 'გაგრძელება',
    en: 'Continue',
  },
  goToWorkspace: {
    ka: 'სამუშაო სივრცეზე გადასვლა',
    en: 'Go to Connected Workspace',
  },
} as const satisfies Record<string, Record<Lang, string>>;
