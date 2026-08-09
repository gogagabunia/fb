import type { Lang } from '../i18n';

/**
 * Strings for the seller moderation queue (/dashboard/moderation).
 * Dynamic values use {placeholder} tokens replaced at the call site.
 */
export const moderationStrings = {
  // Toasts
  loadFailed: {
    ka: 'მონაცემების ჩატვირთვა ვერ მოხერხდა.',
    en: 'Failed to load data from database.',
  },
  noGroupsConnected: {
    ka: 'აქტიური Facebook ჯგუფი დაკავშირებული არ არის. ჯერ დაამატე ერთი!',
    en: 'No active Facebook groups connected. Please add one first!',
  },
  syncStarting: {
    ka: 'იწყება {n} ჯგუფის სინქრონიზაცია და AI ანალიზი…',
    en: 'Starting ingestion and AI parsing for {n} group(s)...',
  },
  syncFailed: {
    ka: 'სინქრონიზაცია ვერ მოხერხდა. {err}',
    en: 'Sync failed. {err}',
  },
  syncPartial: {
    ka: 'სინქრონიზდა {ok}/{total} ჯგუფი — მოიძებნა {found} პოსტი, შემოვიდა {imported}. ვერ მოხერხდა: {failures}',
    en: 'Synced {ok}/{total} groups — found {found} posts, imported {imported}. Failed: {failures}',
  },
  syncComplete: {
    ka: 'სინქრონიზაცია დასრულდა! მოიძებნა {found} პოსტი, მომლოდინე რიგში შემოვიდა {imported} ახალი განცხადება.',
    en: 'Sync complete! Found {found} posts, imported {imported} new listings into the PENDING queue.',
  },
  scrapingFailed: {
    ka: 'სკრეიპინგი ვერ მოხერხდა: {err}. არსებული ჩანაწერები შენარჩუნდება.',
    en: 'Scraping failed: {err}. Preserving existing entries.',
  },
  unknownError: {
    ka: 'უცნობი შეცდომა',
    en: 'Unknown error',
  },
  approveSuccess: {
    ka: 'განცხადება წარმატებით დამტკიცდა და გამოქვეყნდა!',
    en: 'Listing successfully approved and published live!',
  },
  approveFailed: {
    ka: 'დამტკიცება ვერ მოხერხდა: {err}',
    en: 'Approval failed: {err}',
  },
  errorGeneric: {
    ka: 'შეცდომა: {err}',
    en: 'Error: {err}',
  },
  rejectSuccess: {
    ka: 'განცხადება უარყოფილია და რიგში მოინიშნა.',
    en: 'Listing rejected and marked in queue.',
  },
  rejectFailed: {
    ka: 'უარყოფა ვერ მოხერხდა: {err}',
    en: 'Rejection failed: {err}',
  },

  // Header
  pageTitle: {
    ka: 'დასამტკიცებელი რიგი',
    en: 'Approval Queue',
  },
  pageSubtitle: {
    ka: 'გადახედე და გაუწიე მოდერაცია დაკავშირებული Facebook ჯგუფებიდან წამოღებულ პოსტებს.',
    en: 'Review and moderate raw posts scraped from connected Facebook groups.',
  },
  searchPlaceholder: {
    ka: 'მოძებნე იმპორტებში…',
    en: 'Search imports...',
  },

  // Stats bar
  statPending: {
    ka: 'რიგში მომლოდინე',
    en: 'Pending In Queue',
  },
  statLive: {
    ka: 'აქტიური განცხადებები',
    en: 'Live Listings',
  },
  statRejected: {
    ka: 'უარყოფილი პოსტები',
    en: 'Rejected Posts',
  },
  statGroups: {
    ka: 'Facebook ჯგუფები',
    en: 'Facebook Groups',
  },

  // Tabs + statuses
  tabPENDING: {
    ka: 'მომლოდინე',
    en: 'PENDING review',
  },
  tabAPPROVED: {
    ka: 'დამტკიცებული',
    en: 'APPROVED review',
  },
  tabREJECTED: {
    ka: 'უარყოფილი',
    en: 'REJECTED review',
  },
  statusPENDING: {
    ka: 'მომლოდინე',
    en: 'PENDING',
  },
  statusAPPROVED: {
    ka: 'დამტკიცებული',
    en: 'APPROVED',
  },
  statusREJECTED: {
    ka: 'უარყოფილი',
    en: 'REJECTED',
  },

  // Table
  thPost: {
    ka: 'პოსტის დეტალები',
    en: 'Post Details',
  },
  thGroup: {
    ka: 'ჯგუფი',
    en: 'Group',
  },
  thDate: {
    ka: 'წამოღების თარიღი',
    en: 'Date Scraped',
  },
  thActions: {
    ka: 'მოქმედებები',
    en: 'Actions',
  },
  emptyTitle: {
    ka: '„{tab}" ჩანართში ჩანაწერები არ არის',
    en: 'No entries in {tab}',
  },
  emptyPendingHint: {
    ka: 'წამოღებული და დახარისხებული ნივთები აქ გამოჩნდება განსახილველად.',
    en: 'Scraped and classified items will appear here for review.',
  },
  emptyOtherHint: {
    ka: 'შესაბამისი ჩანაწერები არ მოიძებნა.',
    en: 'No matching records.',
  },

  // Row
  clickForDetails: {
    ka: 'დააკლიკე სრული დეტალების სანახავად',
    en: 'Click to see all details',
  },
  noImage: {
    ka: 'ამ პოსტს ფოტო არ აქვს',
    en: 'No image on this post',
  },
  byAuthor: {
    ka: 'ავტორი: {name}',
    en: 'By {name}',
  },
  classifiedPrice: {
    ka: 'ამოცნობილი ფასი:',
    en: 'Classified Price:',
  },
  notScraped: {
    ka: 'ვერ მოიძებნა',
    en: 'Not Scraped',
  },
  noText: {
    ka: '(ტექსტის გარეშე)',
    en: '(no text)',
  },
  reasonLabel: {
    ka: 'მიზეზი:',
    en: 'Reason:',
  },
  hideDetails: {
    ka: 'დეტალების დამალვა',
    en: 'Hide details',
  },
  showDetails: {
    ka: 'სრული დეტალების ნახვა',
    en: 'Show all details',
  },
  approveAction: {
    ka: 'დამტკიცება და გაფორმება',
    en: 'Approve & Format',
  },
  rejectAction: {
    ka: 'პოსტის უარყოფა',
    en: 'Reject Post',
  },
  viewOriginal: {
    ka: 'ორიგინალის ნახვა Facebook-ზე',
    en: 'View original on Facebook',
  },

  // Expanded details panel
  postDetails: {
    ka: 'პოსტის დეტალები',
    en: 'Post details',
  },
  fullText: {
    ka: 'სრული ტექსტი',
    en: 'Full text',
  },
  noTextCaptured: {
    ka: '(ტექსტი ვერ ჩაიწერა)',
    en: '(no text captured)',
  },
  attrAuthor: {
    ka: 'ავტორი',
    en: 'Author',
  },
  attrPriceScraped: {
    ka: 'წამოღებული ფასი',
    en: 'Price scraped',
  },
  notFound: {
    ka: 'ვერ მოიძებნა',
    en: 'Not found',
  },
  attrGroup: {
    ka: 'ჯგუფი',
    en: 'Group',
  },
  attrStatus: {
    ka: 'სტატუსი',
    en: 'Status',
  },
  attrScrapedAt: {
    ka: 'წამოღების დრო',
    en: 'Scraped at',
  },
  attrImages: {
    ka: 'ფოტოები',
    en: 'Images',
  },
  authorProfile: {
    ka: 'ავტორის პროფილი',
    en: 'Author profile',
  },
  openProfile: {
    ka: 'პროფილის გახსნა',
    en: 'Open profile',
  },
  originalPost: {
    ka: 'ორიგინალი პოსტი',
    en: 'Original post',
  },
  imagesCount: {
    ka: 'ფოტოები ({n})',
    en: 'Images ({n})',
  },

  // Approve modal
  approveModalTitle: {
    ka: 'განცხადების დამტკიცება და გაფორმება',
    en: 'Approve & Format Listing',
  },
  itemTitle: {
    ka: 'სათაური',
    en: 'Item Title',
  },
  category: {
    ka: 'კატეგორია',
    en: 'Category',
  },
  price: {
    ka: 'ფასი (₾)',
    en: 'Price (₾)',
  },
  location: {
    ka: 'მდებარეობა',
    en: 'Location',
  },
  description: {
    ka: 'აღწერა',
    en: 'Description',
  },
  cancel: {
    ka: 'გაუქმება',
    en: 'Cancel',
  },
  publishLive: {
    ka: 'განცხადების გამოქვეყნება',
    en: 'Publish Live Listing',
  },
  listingFrom: {
    ka: 'განცხადება — {name}',
    en: 'Listing from {name}',
  },

  // Reject modal
  rejectModalTitle: {
    ka: 'განცხადების უარყოფა',
    en: 'Reject Listing',
  },
  rejectPrompt: {
    ka: 'მიუთითე ამ პოსტის უარყოფის მიზეზი. მიზეზი ისტორიისთვის შეინახება.',
    en: 'Please provide a reason for rejecting this imported post. This reason will be logged for reference.',
  },
  rejectPlaceholder: {
    ka: 'მაგ. აკლია მნიშვნელოვანი დეტალები ან ფასი დაუზუსტებელია…',
    en: 'e.g. Missing vehicle mileage details or pricing is unverified...',
  },
  rejectConfirm: {
    ka: 'უარყოფა',
    en: 'Reject Listing',
  },
} as const satisfies Record<string, Record<Lang, string>>;
